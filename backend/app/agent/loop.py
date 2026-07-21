"""Agent 循环引擎（loop agent 核心）。

循环：LLM 响应 → 有 tool_calls 则执行工具并回喂 → 再次调用 LLM → ...
终止：模型返回纯文本（finished），或达到 max_iterations 后用一次
无工具调用强制收尾（max_iterations）。
"""

import json
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.llm.base import ChatCompletionRequest, ChatMessage, LLMProvider
from app.agent.tools.registry import ToolRegistry
from app.utils.logger import app_logger

# 默认最大循环轮数（硬上限，防成本失控）
DEFAULT_MAX_ITERATIONS = 8
# 单次工具结果回喂的最大字符数（保护上下文窗口）
MAX_TOOL_RESULT_CHARS = 4000
# trace 中保存的结果预览长度
TRACE_PREVIEW_CHARS = 500


class AgentRunResult(BaseModel):
    """一次 agent 运行的结果。"""

    reply: str
    iterations: int
    stop_reason: str  # finished | max_iterations
    tool_trace: List[Dict[str, Any]] = Field(default_factory=list)
    total_tokens: int = 0


class AgentLoop:
    """工具调用循环引擎。provider 负责模型通信，registry 负责工具执行。"""

    def __init__(self, provider: LLMProvider, registry: ToolRegistry,
                 max_iterations: int = DEFAULT_MAX_ITERATIONS) -> None:
        self.provider = provider
        self.registry = registry
        self.max_iterations = max(1, max_iterations)

    async def run(
        self,
        db: Session,
        messages: List[ChatMessage],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AgentRunResult:
        history: List[ChatMessage] = list(messages)
        tool_trace: List[Dict[str, Any]] = []
        total_tokens = 0
        tools = self.registry.definitions()

        for iteration in range(1, self.max_iterations + 1):
            app_logger.info(f"AgentLoop 第 {iteration}/{self.max_iterations} 轮")
            response = await self.provider.chat(ChatCompletionRequest(
                messages=history, model=model, temperature=temperature,
                max_tokens=max_tokens, tools=tools,
            ))
            if response.usage:
                total_tokens += response.usage.total_tokens

            msg = response.message
            if not msg.tool_calls:
                return AgentRunResult(
                    reply=msg.content, iterations=iteration,
                    stop_reason="finished", tool_trace=tool_trace, total_tokens=total_tokens,
                )

            # 记录 assistant 的工具调用消息，再逐个执行工具并回喂
            history.append(ChatMessage(role="assistant", content=msg.content or "",
                                       tool_calls=msg.tool_calls))
            for tool_call in msg.tool_calls:
                arguments = self._parse_arguments(tool_call.arguments)
                if isinstance(arguments, str):  # JSON 解析失败，错误文本直接回喂
                    result = arguments
                    args_for_trace: Any = tool_call.arguments
                else:
                    result = self.registry.execute(db, tool_call.name, arguments)
                    args_for_trace = arguments
                result = result[:MAX_TOOL_RESULT_CHARS]
                app_logger.info(f"AgentLoop 工具调用: {tool_call.name} -> {result[:100]}")
                tool_trace.append({
                    "name": tool_call.name,
                    "arguments": args_for_trace,
                    "result_preview": result[:TRACE_PREVIEW_CHARS],
                })
                history.append(ChatMessage(role="tool", content=result,
                                           tool_call_id=tool_call.id))

        # 达到迭代上限：不带 tools 再调一次，强制模型用已有信息收尾
        app_logger.warning(f"AgentLoop 达到最大迭代数 {self.max_iterations}，强制收尾")
        final = await self.provider.chat(ChatCompletionRequest(
            messages=history, model=model, temperature=temperature, max_tokens=max_tokens,
        ))
        if final.usage:
            total_tokens += final.usage.total_tokens
        return AgentRunResult(
            reply=final.message.content, iterations=self.max_iterations,
            stop_reason="max_iterations", tool_trace=tool_trace, total_tokens=total_tokens,
        )

    @staticmethod
    def _parse_arguments(raw: str):
        """解析模型的 arguments JSON 字符串；失败时返回错误文本（str）。"""
        try:
            parsed = json.loads(raw or "{}")
        except json.JSONDecodeError:
            return f"错误：工具参数不是合法 JSON：{raw[:200]}"
        if not isinstance(parsed, dict):
            return f"错误：工具参数必须是 JSON 对象：{raw[:200]}"
        return parsed
