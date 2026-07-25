"""
Conversation Schemas
对话管理相关的请求和响应 Schema
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


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
    """
    id: str
    tenant_id: str
    user_id: str
    total_messages: int = 0
    total_tokens: int = 0
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class Conversation(ConversationInDBBase):
    """
    完整对话 Schema
    """
    messages: List[ConversationMessage] = []


class ConversationListResponse(BaseModel):
    """
    对话列表响应
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
