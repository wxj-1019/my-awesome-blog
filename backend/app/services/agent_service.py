"""Agent 服务层：组装 provider + 工具 + 循环引擎，对外提供 chat / polish / 流式写作。

约定：本服务抛出的 ValueError 由 API 端点捕获并转为 HTTP 400。
"""

import json
from typing import AsyncIterator, Optional

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
    AgentGenerateRequest,
    AgentMetaRequest,
    AgentMetaResponse,
    AgentPolishRequest,
    AgentPolishResponse,
    AgentReviseRequest,
    AgentToolCallInfo,
)

AGENT_SYSTEM_PROMPT = """你是这个个人博客站点的「写作助手」，帮助博主选题、查站内旧文、列大纲、改写与润色。
你可以使用工具查询站内已发布文章、文章详情和站点统计。
规则：
1. 主目标是协助写文章：可先 search_articles / get_article_detail 找相关旧文，再给大纲、段落或修改建议。
2. 涉及站内内容时，先调工具再基于返回事实回答，不要编造标题或链接。
3. 文章链接格式为 /articles/{slug}。
4. 用简洁的中文；需要成稿润色时，可建议用户使用管理端 polish 接口做 Writer-Critic 循环。"""

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


# ── AI 导向写作 prompt ──────────────────────────────────────────────
# 生成 / 改稿 / 元信息三套 prompt。
# 生成与改稿走流式（stream_chat），元信息走一次性 chat（输出短、要解析 JSON）。


GENERATE_PROMPT = """你是一名资深中文博客作者。请按下面的要求撰写一篇完整文章，**直接输出 Markdown 正文**，不要任何前置说明、不要 ```markdown 围栏。

写作要求：
1. 结构清晰：以 `# 标题` 开头，含 `##` 小节；适当使用列表、引用、代码块。
2. 语言自然流畅，有观点、有例子，避免空话套话和 AI 腔。
3. 只输出文章本身，不要「好的，以下是文章」之类的开场白。
{requirements_block}{context_block}
【主题】
{topic}"""

REVISE_PROMPT = """你是一名中文博客编辑。请按修改指令调整下面的文章，**直接输出修改后的完整 Markdown 正文**，不要解释你做了什么。

要求：
1. 保留未涉及部分，只按指令改动。
2. 仍以 `# 标题` 开头，保持 Markdown 结构完整。
3. 不要加任何开场白或说明。

【修改指令】
{instruction}

【当前正文】
{content}"""

META_PROMPT = """根据下面的文章正文，生成适合博客的标题、URL slug 和摘要。**只输出一个 JSON 对象**，不要任何解释或 markdown 围栏，格式严格为：
{{"title": "...", "slug": "...", "excerpt": "..."}}

要求：
- title：15-40 字，有吸引力，不含书名号/引号。
- slug：英文小写短横线分隔，仅 a-z0-9-，由 title 含义翻译而来，不超过 60 字符。
- excerpt：80-150 字中文摘要，概括核心观点，不含换行。

【正文】
{content}"""


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
            model=request.model or provider.get_model_name(),
            iterations=result.iterations,
            stop_reason=result.stop_reason,
            tool_calls=[AgentToolCallInfo(**t) for t in result.tool_trace],
            total_tokens=result.total_tokens,
        )

    async def polish(self, request: AgentPolishRequest) -> AgentPolishResponse:
        """Writer-Critic 循环润色：评审 → 修改 → 再评审，直到 PASS 或达到轮数上限。
        达到 max_rounds 后最后一轮改写不再送评审，直接返回。"""
        provider = self._get_provider_or_raise(None)
        draft = request.content
        critiques: list[str] = []
        requirements_block = f"\n【附加要求】{request.requirements}\n" if request.requirements else ""

        for round_idx in range(request.max_rounds):
            critique = await self._ask(
                provider, CRITIC_PROMPT.format(draft=draft, requirements_block=requirements_block),
                temperature=0.3,
            )
            if critique.strip().upper().rstrip("。").rstrip(".") == "PASS":
                app_logger.info(f"Agent polish 第 {round_idx + 1} 轮评审通过（PASS）")
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

    # ── SSE 辅助 ───────────────────────────────────────────────────
    @staticmethod
    def _sse(payload: dict) -> str:
        """格式化一条 SSE 事件（ensure_ascii=False 让中文原样流过）。"""
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    async def _stream_final(
        self,
        provider: LLMProvider,
        prompt: str,
        model: Optional[str],
        temperature: float,
        max_tokens: Optional[int],
    ) -> AsyncIterator[str]:
        """最终的流式生成：把拼好的 prompt 喂给 provider.stream_chat，逐 chunk 发 SSE。

        content 事件：{"content": "..."}；最后发 [DONE]。错误发 {"error": "...}。
        """
        try:
            request = ChatCompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in provider.stream_chat(request):
                if chunk.content:
                    yield self._sse({"content": chunk.content})
        except Exception as e:
            app_logger.exception("Agent 流式生成失败")
            yield self._sse({"error": str(e)})
            return
        yield "data: [DONE]\n\n"

    # ── AI 导向写作：生成 / 改稿 / 元信息 ──────────────────────────
    async def generate_stream(
        self, db: Session, request: AgentGenerateRequest
    ) -> AsyncIterator[str]:
        """按主题流式生成文章。

        两阶段（贴合现有架构，低风险）：
        1. 若 context_mode=auto，跑非流式 AgentLoop 查站内相关文章，把摘要注入 prompt；
           每次工具调用先发一个 tool 事件，让前端显示「正在检索站内文章…」。
        2. 用 provider.stream_chat 流式吐 Markdown 正文，逐 chunk 发 content 事件。
        """
        provider = self._get_provider_or_raise(request.provider)
        context_block = ""
        if request.context_mode == "auto":
            registry = register_builtin_tools(ToolRegistry())
            loop = AgentLoop(provider, registry, max_iterations=request.max_iterations)
            # 让 agent 先检索站内相关文章，只取它的回复作上下文（reply 本身可能就是摘要/大纲）
            try:
                result = await loop.run(
                    db,
                    [
                        ChatMessage(role="system", content=AGENT_SYSTEM_PROMPT),
                        ChatMessage(
                            role="user",
                            content=(
                                f"我想写一篇关于「{request.topic}」的文章。"
                                "请先用工具检索站内是否已有相关或风格相近的文章，"
                                "然后用 3-5 行概述你找到的参考（标题 + 一句话要点），"
                                "便于我在写作时保持风格一致、避免重复。只概述，不要写成正文。"
                            ),
                        ),
                    ],
                    model=request.model,
                )
                for trace in result.tool_trace:
                    yield self._sse({"tool": trace.get("name"), "arguments": trace.get("arguments")})
                if result.reply.strip():
                    context_block = f"\n【站内相关参考】（写作时保持风格一致、避免与已发布内容重复）\n{result.reply.strip()}\n"
            except Exception as e:
                # 检索失败不阻塞生成，降级为无上下文
                app_logger.warning(f"Agent 站内检索失败，降级为无上下文生成：{e}")
                yield self._sse({"tool": "error", "arguments": {"message": str(e)}})

        requirements_block = (
            f"\n【附加要求】{request.requirements}\n" if request.requirements else ""
        )
        prompt = GENERATE_PROMPT.format(
            topic=request.topic,
            requirements_block=requirements_block,
            context_block=context_block,
        )
        async for sse in self._stream_final(
            provider, prompt, request.model, request.temperature, request.max_tokens
        ):
            yield sse

    async def revise_stream(
        self, request: AgentReviseRequest
    ) -> AsyncIterator[str]:
        """流式改稿：当前正文 + 自然语言指令 → 流式输出修改后的完整正文。"""
        provider = self._get_provider_or_raise(request.provider)
        prompt = REVISE_PROMPT.format(instruction=request.instruction, content=request.content)
        async for sse in self._stream_final(
            provider, prompt, request.model, request.temperature, request.max_tokens
        ):
            yield sse

    async def generate_meta(self, request: AgentMetaRequest) -> AgentMetaResponse:
        """根据正文反推 title / slug / excerpt（非流式，输出 JSON）。"""
        provider = self._get_provider_or_raise(request.provider)
        prompt = META_PROMPT.format(content=request.content)
        raw = await self._ask(provider, prompt, temperature=0.3)
        # 容错：模型偶尔会包 ```json 围栏或多余文本，提取首个 {...}
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```", 2)[1]
            if raw.lower().startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        start, end = raw.find("{"), raw.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("AI 返回的内容无法解析为标题/摘要，请重试或手填")
        try:
            data = json.loads(raw[start: end + 1])
            return AgentMetaResponse(
                title=str(data.get("title", "")).strip(),
                slug=str(data.get("slug", "")).strip(),
                excerpt=str(data.get("excerpt", "")).strip(),
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"解析 AI 元信息失败：{e}")


agent_service = AgentService()
