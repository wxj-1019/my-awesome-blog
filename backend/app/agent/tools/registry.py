"""Agent 工具注册表：集中管理模型可调用的站内工具。

工具函数约定：同步函数，签名为 (db: Session, **arguments) -> str，
返回给模型的文本结果。异常由注册表捕获并转为错误文本回喂模型。
"""

from typing import Any, Callable, Dict, List

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.llm.base import ToolDefinition
from app.utils.logger import app_logger


class AgentTool(BaseModel):
    """一个可被模型调用的工具：描述 + 执行函数。"""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    name: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)  # JSON Schema
    func: Callable[..., str]


class ToolRegistry:
    """工具注册表：生成给模型的 ToolDefinition 列表，并按名执行工具。"""

    def __init__(self) -> None:
        self._tools: Dict[str, AgentTool] = {}

    def register(self, tool: AgentTool) -> None:
        self._tools[tool.name] = tool

    def definitions(self) -> List[ToolDefinition]:
        """生成传给 LLM 的工具声明列表。"""
        return [
            ToolDefinition(name=t.name, description=t.description, parameters=t.parameters)
            for t in self._tools.values()
        ]

    def execute(self, db: Session, name: str, arguments: Dict[str, Any]) -> str:
        """按名执行工具。任何异常都转为错误文本返回（供模型自我纠正），不向上抛。"""
        tool = self._tools.get(name)
        if tool is None:
            return f"错误：未知工具「{name}」，请从可用工具列表中选择。"
        try:
            return tool.func(db=db, **arguments)
        except TypeError as e:
            app_logger.warning(f"Agent 工具参数错误: {name}({arguments}) -> {e}")
            return f"错误：工具「{name}」参数不合法：{e}"
        except Exception as e:
            app_logger.error(f"Agent 工具执行失败: {name}({arguments}) -> {e}")
            return f"错误：工具「{name}」执行失败：{e}"
