"""图循环基元（graph loop primitive）。

理念：用含环有向图显式表达 Agent 控制流——「节点做工作，边决定下一步」，
循环边（cycle）表达「重复某阶段直到条件满足」。与 LangGraph 的 StateGraph
同源，但零依赖、纯 asyncio，仅覆盖项目所需的最小语义：

- **节点（node）**：async 函数，读共享状态，返回 `(next_node, state_updates)`
- **条件边（conditional edge）**：节点动态决定下一步，等价于路由函数
- **循环边（cycle）**：节点返回已访问过的节点名即成环（如 生成→反思→生成）
- **状态合并（reducer）**：默认替换；`append_keys` 声明的键按追加语义合并
  （对应 LangGraph 的 append reducer，用于 trace/消息等只增不减的字段）
- **max_steps 硬上限**：防失控，语义对应现有 AgentLoop 的 max_iterations
- **checkpoint_cb / step_cb**：每步回调，供 DB 落库（持久化）与 SSE 外发

终止语义：节点返回 `next_node=None` 或 `GraphLoop.END` 即结束本次运行。
"""

from typing import Any, Awaitable, Callable, Dict, Optional, Set, Tuple

from app.utils.logger import app_logger

# 节点返回的下一步结果：(下一节点名或 None 表示结束, 状态更新 dict)
StepResult = Tuple[Optional[str], Dict[str, Any]]
NodeFunc = Callable[[Dict[str, Any]], Awaitable[StepResult]]


class GraphLoop:
    """轻量图循环执行器。

    Example:
        loop = GraphLoop("polish", max_steps=8)
        loop.add_node("write", write_fn)
        loop.add_node("critique", critique_fn)
        await loop.run({"draft": "", "round": 0}, entry="write")
    """

    # 终止标记：next_node 返回它等价于返回 None
    END = "__end__"

    def __init__(
        self,
        name: str,
        max_steps: int = 16,
        append_keys: Optional[Set[str]] = None,
        checkpoint_cb: Optional[Callable[[Dict[str, Any], str], Awaitable[None]]] = None,
        step_cb: Optional[Callable[[Dict[str, Any], str, Optional[str]], Awaitable[None]]] = None,
    ) -> None:
        self.name = name
        self.max_steps = max(1, max_steps)
        self.append_keys: Set[str] = set(append_keys or [])
        self._checkpoint_cb = checkpoint_cb
        self._step_cb = step_cb
        self._nodes: Dict[str, NodeFunc] = {}

    def add_node(self, name: str, fn: NodeFunc) -> None:
        """注册节点。"""
        self._nodes[name] = fn

    @property
    def nodes(self) -> Set[str]:
        return set(self._nodes.keys())

    def _merge(self, state: Dict[str, Any], updates: Dict[str, Any]) -> None:
        """合并状态更新：append_keys 声明的键按追加语义，其余替换。"""
        for key, value in updates.items():
            if key in self.append_keys:
                existing = state.get(key, [])
                if not isinstance(existing, list):
                    existing = [existing]
                state[key] = existing + (value if isinstance(value, list) else [value])
            else:
                state[key] = value

    async def run(self, state: Dict[str, Any], entry: str) -> Dict[str, Any]:
        """从 entry 节点开始执行，直到节点返回 None/END 或达到 max_steps。

        Returns:
            运行结束后的最终状态（原地更新传入的 state）。
        """
        if entry not in self._nodes:
            raise ValueError(f"入口节点不存在: {entry}")
        node = entry
        for step in range(1, self.max_steps + 1):
            fn = self._nodes[node]
            app_logger.info(f"GraphLoop[{self.name}] step {step}/{self.max_steps} @ {node}")
            next_node, updates = await fn(state)
            self._merge(state, updates)
            if self._step_cb is not None:
                await self._step_cb(state, node, next_node)
            if self._checkpoint_cb is not None:
                await self._checkpoint_cb(state, node)
            if next_node is None or next_node == self.END:
                return state
            if next_node not in self._nodes:
                raise ValueError(
                    f"GraphLoop[{self.name}] 节点 {node} 返回了未注册的下一节点: {next_node}"
                )
            node = next_node
        # 达到硬上限：记录并返回当前状态（调用方据 state 决定收尾）
        app_logger.warning(f"GraphLoop[{self.name}] 达到最大步数 {self.max_steps}，强制终止")
        return state
