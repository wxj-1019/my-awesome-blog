"""Agent 相关 schema"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AgentChatRequest(BaseModel):
    """Agent 对话请求"""
    message: str = Field(..., min_length=1, max_length=4000, description="用户消息")
    provider: Optional[str] = Field(None, description="LLM provider，默认读配置")
    model: Optional[str] = Field(None, description="模型名，默认 provider 配置")
    max_iterations: int = Field(8, ge=1, le=20, description="最大工具调用循环轮数（硬上限）")


class AgentToolCallInfo(BaseModel):
    """一次工具调用的审计信息"""
    name: str
    arguments: Any = None
    result_preview: str = ""


class AgentChatResponse(BaseModel):
    """Agent 对话响应"""
    reply: str
    provider: str
    model: str
    iterations: int
    stop_reason: str  # finished | max_iterations
    tool_calls: List[AgentToolCallInfo] = Field(default_factory=list)
    total_tokens: int = 0


class AgentPolishRequest(BaseModel):
    """文章润色请求（Writer-Critic 循环）"""
    content: str = Field(..., min_length=1, max_length=20000, description="待润色的文章草稿（Markdown）")
    requirements: Optional[str] = Field(None, max_length=500, description="附加润色要求，如 SEO 关键词、风格")
    max_rounds: int = Field(3, ge=1, le=5, description="最大评审-修改轮数（硬上限）")


class AgentPolishResponse(BaseModel):
    """文章润色响应"""
    polished: str
    rounds: int  # 实际执行的修改轮数
    critiques: List[str] = Field(default_factory=list)  # 各轮评审意见
