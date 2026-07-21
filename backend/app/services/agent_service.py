"""Agent 服务层：组装 provider + 工具 + 循环引擎，对外提供 chat / polish。

约定：本服务抛出的 ValueError 由 API 端点捕获并转为 HTTP 400。
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.agent.loop import AgentLoop
from app.agent.tools.builtin import register_builtin_tools
from app.agent.tools.registry import ToolRegistry
from app.llm.base import ChatCompletionRequest, ChatMessage, LLMProvider
from app.llm.provider_factory import get_llm_provider
from app.utils.logger import app_logger
from app.schemas.agent import (
    AgentChatRequest,
    AgentChatResponse,
    AgentPolishRequest,
    AgentPolishResponse,
    AgentToolCallInfo,
)

AGENT_SYSTEM_PROMPT = """你是这个个人博客站点的 AI 助手，熟悉站内内容。
你可以使用提供的工具查询站内已发布文章、文章详情和站点统计信息。
规则：
1. 涉及站内内容的问题，先调用工具查询，再基于工具返回的事实回答，不要编造文章标题或链接。
2. 文章链接格式为 /articles/{slug}。
3. 用简洁的中文回答。"""

CRITIC_PROMPT = """你是一名严格的中文博客文章评审。审阅下面的草稿，从结构、可读性、事实准确性、SEO 角度提出最多 3 条具体修改建议（每条一行）。
如果草稿质量已经足够好、无需修改，只回复：PASS
{requirements_block}
【草稿】
{draft}"""

WRITER_PROMPT = """你是一名专业的中文博客作者。根据评审意见修改下面的草稿，直接输出修改后的完整文章（Markdown），不要输出任何解释。

【评审意见】
{critique}

【草稿】
{draft}"""


class AgentService:
    """Agent 服务：chat 走工具循环，polish 走 Writer-Critic 循环。"""

    def _get_provider_or_raise(self, provider_name: Optional[str]) -> LLMProvider:
        provider = get_llm_provider(provider_name)
        if provider is None:
            raise ValueError(f"LLM provider「{provider_name or '默认'}」不可用，请检查 API key 配置")
        return provider

    async def chat(self, db: Session, request: AgentChatRequest) -> AgentChatResponse:
        """工具循环对话：模型可自主调用站内工具后作答。"""
        provider = self._get_provider_or_raise(request.provider)
        registry = register_builtin_tools(ToolRegistry())
        loop = AgentLoop(provider, registry, max_iterations=request.max_iterations)
        result = await loop.run(db, [
            ChatMessage(role="system", content=AGENT_SYSTEM_PROMPT),
            ChatMessage(role="user", content=request.message),
        ], model=request.model)
        return AgentChatResponse(
            reply=result.reply,
            provider=provider.get_provider_name(),
            model=provider.get_model_name(),
            iterations=result.iterations,
            stop_reason=result.stop_reason,
            tool_calls=[AgentToolCallInfo(**t) for t in result.tool_trace],
            total_tokens=result.total_tokens,
        )

    async def polish(self, request: AgentPolishRequest) -> AgentPolishResponse:
        """Writer-Critic 循环润色：评审 → 修改 → 再评审，直到 PASS 或达到轮数上限。"""
        provider = self._get_provider_or_raise(None)
        draft = request.content
        critiques: list[str] = []
        requirements_block = f"\n【附加要求】{request.requirements}\n" if request.requirements else ""

        for _ in range(request.max_rounds):
            critique = await self._ask(
                provider, CRITIC_PROMPT.format(draft=draft, requirements_block=requirements_block),
                temperature=0.3,
            )
            if critique.strip().upper().rstrip("。").rstrip(".") == "PASS":
                app_logger.info(f"Agent polish 第 {_ + 1} 轮评审通过（PASS）")
                break
            critiques.append(critique)
            draft = await self._ask(provider, WRITER_PROMPT.format(draft=draft, critique=critique))

        return AgentPolishResponse(polished=draft, rounds=len(critiques), critiques=critiques)

    @staticmethod
    async def _ask(provider: LLMProvider, prompt: str, temperature: float = 0.7) -> str:
        """单次无工具调用，返回文本。"""
        response = await provider.chat(ChatCompletionRequest(
            messages=[ChatMessage(role="user", content=prompt)],
            temperature=temperature,
        ))
        return response.message.content


agent_service = AgentService()
