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


# ── AI 导向写作：生成 / 改稿 / 元信息 ────────────────────────────────
# 这三组 schema 配合后台「写文章」编辑器的 AI 流程：
#   generate-stream：按主题流式生成全文（先查站内文，再流式吐 Markdown）
#   revise-stream  ：基于现有正文 + 自然语言指令流式改稿
#   meta           ：根据正文反推 title / slug / excerpt（非流式）


class AgentGenerateRequest(BaseModel):
    """按主题生成文章（流式）"""
    topic: str = Field(..., min_length=1, max_length=4000, description="文章主题或要点")
    requirements: Optional[str] = Field(
        None, max_length=500, description="附加要求：字数 / 风格 / SEO 关键词等"
    )
    # auto=先查站内已发布文章作参考（保持风格一致、避免重复）；none=跳过检索
    context_mode: str = Field("auto", description="auto | none")
    provider: Optional[str] = Field(None, description="LLM provider，默认读配置")
    model: Optional[str] = Field(None, description="模型名，默认 provider 配置")
    max_iterations: int = Field(3, ge=1, le=15, description="工具循环上限；检索阶段通常 1-2 轮即够，过大徒增首字延迟")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="生成温度")
    max_tokens: Optional[int] = Field(None, ge=256, le=8192, description="正文 token 上限")


class AgentReviseRequest(BaseModel):
    """对话式改稿（流式）：把当前正文 + 自然语言指令交给 AI"""
    content: str = Field(..., min_length=1, max_length=20000, description="当前编辑器正文（Markdown）")
    instruction: str = Field(..., min_length=1, max_length=1000, description="修改指令，如『加一段案例』『改口语化』")
    provider: Optional[str] = None
    model: Optional[str] = None
    temperature: float = Field(0.6, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=256, le=8192)


class AgentMetaRequest(BaseModel):
    """根据正文反推标题 / slug / 摘要（非流式）"""
    content: str = Field(..., min_length=1, max_length=20000, description="文章正文")
    provider: Optional[str] = None
    model: Optional[str] = None


class AgentMetaResponse(BaseModel):
    """元信息生成响应"""
    title: str
    slug: str
    excerpt: str
