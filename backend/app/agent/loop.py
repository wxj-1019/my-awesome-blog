"""Agent 循环引擎（loop agent 核心）。

循环：LLM 响应 → 有 tool_calls 则执行工具并回喂 → 再次调用 LLM → ...
终止：模型返回纯文本（finished），或达到 max_iterations 后用一次
无工具调用强制收尾（max_iterations）。

实现：基于 GraphLoop 图循环基元显式表达 agent ↔ tools 环
（graph loop 理念的循环边），而非手写 for 循环。
"""

import asyncio
import json
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agent.graph import GraphLoop
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
    iterations: int  # 循环轮数（不含达到上限后的收尾调用）
    stop_reason: str  # finished | max_iterations
    tool_trace: List[Dict[str, Any]] = Field(default_factory=list)
    total_tokens: int = 0


class AgentLoop:
    """工具调用循环引擎。provider 负责模型通信，registry 负责工具执行。

    图结构：agent →（有 tool_calls）→ tools → agent 环；
    agent 无 tool_calls → finished；达到轮数上限 → 无工具强制收尾。
    """

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
        """工具通过 asyncio.to_thread 执行以避免阻塞事件循环，Session 顺序使用不并发共享。"""
        history: List[ChatMessage] = list(messages)
        tools = self.registry.definitions()
        state: Dict[str, Any] = {
            "history": history,          # 引用传递，节点内直接 append
            "iterations": 0,             # LLM 调用轮数
            "tool_trace": [],
            "total_tokens": 0,
            "reply": None,
            "stop_reason": None,
            "pending_tool_calls": [],    # agent 节点传给 tools 节点的待执行调用
        }

        async def agent_node(s: Dict[str, Any]):
            """调用 LLM：无 tool_calls → finished；有 → 记录消息并交 tools 节点。"""
            iteration = s["iterations"] + 1
            app_logger.info(f"AgentLoop 第 {iteration}/{self.max_iterations} 轮")
            try:
                response = await self.provider.chat(ChatCompletionRequest(
                    messages=s["history"], model=model, temperature=temperature,
                    max_tokens=max_tokens, tools=tools,
                ))
            except Exception as e:
                app_logger.error(
                    f"AgentLoop 第 {iteration} 轮 LLM 调用失败: {e} "
                    f"(已执行工具 {len(s['tool_trace'])} 个, 累计 {s['total_tokens']} tokens)"
                )
                raise
            if response.usage:
                s["total_tokens"] += response.usage.total_tokens

            msg = response.message
            if not msg.tool_calls:
                s["reply"] = msg.content
                s["stop_reason"] = "finished"
                s["iterations"] = iteration
                return None, {}
            # 记录 assistant 的工具调用消息，转交 tools 节点执行
            s["history"].append(ChatMessage(role="assistant", content=msg.content or "",
                                            tool_calls=msg.tool_calls))
            s["pending_tool_calls"] = msg.tool_calls
            s["iterations"] = iteration
            return "tools", {}

        async def tools_node(s: Dict[str, Any]):
            """逐个执行工具并回喂结果（错误/超长文本也回喂，供模型自我纠正）。"""
            for tool_call in s["pending_tool_calls"]:
                arguments = self._parse_arguments(tool_call.arguments)
                if isinstance(arguments, str):  # JSON 解析失败，错误文本直接回喂
                    result = arguments
                    args_for_trace: Any = tool_call.arguments[:TRACE_PREVIEW_CHARS]
                else:
                    # 注意：Session 仅顺序跨线程使用；若未来并行执行多 tool_calls 需改为每线程独立 Session
                    result = await asyncio.to_thread(
                        self.registry.execute, db, tool_call.name, arguments)
                    args_for_trace = arguments
                result = result[:MAX_TOOL_RESULT_CHARS]
                app_logger.info(f"AgentLoop 工具调用: {tool_call.name} -> {result[:100]}")
                s["tool_trace"].append({
                    "name": tool_call.name,
                    "arguments": args_for_trace,
                    "result_preview": result[:TRACE_PREVIEW_CHARS],
                })
                s["history"].append(ChatMessage(role="tool", content=result,
                                                tool_call_id=tool_call.id))
            return "agent", {}

        loop = GraphLoop(
            "agent_tools",
            max_steps=2 * self.max_iterations,  # 每轮最多两步（LLM + 工具）
        )
        loop.add_node("agent", agent_node)
        loop.add_node("tools", tools_node)
        await loop.run(state, entry="agent")

        if state["stop_reason"] == "finished":
            return AgentRunResult(
                reply=state["reply"], iterations=state["iterations"],
                stop_reason="finished", tool_trace=state["tool_trace"],
                total_tokens=state["total_tokens"],
            )

        # 达到迭代上限：不带 tools 再调一次，强制模型用已有信息收尾
        app_logger.warning(f"AgentLoop 达到最大迭代数 {self.max_iterations}，强制收尾")
        try:
            final = await self.provider.chat(ChatCompletionRequest(
                messages=history, model=model, temperature=temperature, max_tokens=max_tokens,
            ))
        except Exception as e:
            app_logger.error(
                f"AgentLoop 收尾 LLM 调用失败: {e} "
                f"(已执行工具 {len(state['tool_trace'])} 个, 累计 {state['total_tokens']} tokens)"
            )
            raise
        if final.usage:
            state["total_tokens"] += final.usage.total_tokens
        return AgentRunResult(
            reply=final.message.content, iterations=self.max_iterations,
            stop_reason="max_iterations", tool_trace=state["tool_trace"],
            total_tokens=state["total_tokens"],
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
