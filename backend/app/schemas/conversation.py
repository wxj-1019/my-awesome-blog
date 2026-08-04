"""
Conversation Schemas
对话管理相关的请求和响应 Schema
"""

from typing import Optional, List
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer


class ConversationMessageBase(BaseModel):
    """
    对话消息基础 Schema
    """
    role: str = Field(..., description="角色: user, assistant, system")
    content: str = Field(..., min_length=1, description="消息内容")
    tokens: int = Field(default=0, description="Token 数量")


class ConversationMessageCreate(ConversationMessageBase):
    """
    创建对话消息 Schema
    """
    pass


class ConversationMessageUpdate(BaseModel):
    """
    更新对话消息 Schema
    """
    content: Optional[str] = Field(None, min_length=1)
    tokens: Optional[int] = None


class ConversationMessageInDBBase(ConversationMessageBase):
    """
    数据库中的对话消息基础 Schema
    """
    id: str
    conversation_id: str
    model: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationMessage(ConversationMessageInDBBase):
    """
    完整对话消息 Schema
    """
    pass


class ConversationBase(BaseModel):
    """
    对话基础 Schema
    """
    title: str = Field(..., min_length=1, max_length=200, description="对话标题")
    status: str = Field(default="active", description="状态: active, archived, deleted")
    model: str = Field(..., description="使用的模型")
    prompt_id: Optional[str] = Field(None, description="使用的 Prompt ID")


class ConversationCreate(ConversationBase):
    """
    创建对话 Schema
    """
    pass


class ConversationUpdate(BaseModel):
    """
    更新对话 Schema
    """
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    status: Optional[str] = None
    model: Optional[str] = None
    prompt_id: Optional[str] = None


class ConversationInDBBase(ConversationBase):
    """
    数据库中的对话基础 Schema

    id / tenant_id / user_id 在 ORM 层是 UUID，原先标注为 str 会在
    model_validate 时抛 string_type 校验错误（列表接口因此 400）。
    按规范 §9 / §12.1：标注为 UUID，再用 field_serializer 序列化成字符串。
    """
    id: UUID
    tenant_id: UUID
    user_id: UUID
    total_messages: int = 0
    total_tokens: int = 0
    created_at: datetime
    updated_at: Optional[datetime]

    @field_serializer("id", "tenant_id", "user_id")
    def serialize_uuids(self, value: UUID) -> str:
        return str(value)

    model_config = {"from_attributes": True}


class Conversation(ConversationInDBBase):
    """
    完整对话 Schema（含消息，供单条详情接口使用）
    """
    messages: List[ConversationMessage] = []


class ConversationSummary(ConversationInDBBase):
    """
    对话摘要 Schema（列表用，**不含 messages**）。

    为什么单独一个 Schema：列表若复用 Conversation，序列化时会对每一条对话
    触发一次 messages 懒加载（N+1），并把每条对话的全部消息正文塞进列表响应。
    消息条数已由基类的 total_messages 提供，列表页无需消息体。
    需要消息请走 GET /conversations/{id}/messages。
    """
    pass


class ConversationListResponse(BaseModel):
    """
    对话列表响应

    已弃用：改用 app.schemas.pagination.Page[ConversationSummary]。
    保留定义仅为兼容可能的存量引用。
    """
    conversations: List[Conversation]
    total: int
    page: int
    page_size: int


class ChatRequest(BaseModel):
    """
    聊天请求
    """
    conversation_id: Optional[str] = Field(None, description="对话 ID（不指定则创建新对话）")
    message: str = Field(..., min_length=1, description="用户消息")
    model: str = Field(default="deepseek-v4-flash", description="使用的模型")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="温度参数")
    max_tokens: Optional[int] = Field(None, ge=1, description="最大 Token 数")
    stream: bool = Field(default=False, description="是否流式响应")
    prompt_id: Optional[str] = Field(None, description="使用的 Prompt ID")


class ChatResponse(BaseModel):
    """
    聊天响应
    """
    conversation_id: str
    message_id: str
    role: str
    content: str
    tokens: int
    model: str
    created_at: datetime


class ChatStreamChunk(BaseModel):
    """
    聊天流式响应块
    """
    conversation_id: str
    message_id: str
    role: str
    content: str
    delta: str
    finish_reason: Optional[str] = None
