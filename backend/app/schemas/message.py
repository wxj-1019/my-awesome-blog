from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_serializer


# Base schemas
class MessageBase(BaseModel):
    content: str
    color: Optional[str] = "#00D9FF"
    is_danmaku: Optional[bool] = True


# Create schemas
class MessageCreate(MessageBase):
    parent_id: Optional[str] = None
    nickname: Optional[str] = Field(default=None, max_length=50, description="游客昵称（未登录时展示）")


# Update schemas
class MessageUpdate(BaseModel):
    content: Optional[str] = None
    color: Optional[str] = None
    is_danmaku: Optional[bool] = None


# Response schemas
class MessageInDBBase(MessageBase):
    id: UUID
    author_id: Optional[UUID] = None
    nickname: Optional[str] = None
    parent_id: Optional[UUID] = None
    likes: int
    level: int
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer('id', 'author_id', 'parent_id')
    def serialize_uuids(self, value: Optional[UUID]) -> Optional[str]:
        return str(value) if value is not None else None

    model_config = {'from_attributes': True}


class Message(MessageInDBBase):
    pass


class MessageWithAuthor(Message):
    author: Optional["User"] = None


class MessageWithReplies(MessageWithAuthor):
    replies: List["MessageWithAuthor"] = []


class MessageWithAuthorAndParent(MessageWithAuthor):
    parent: Optional["MessageWithAuthor"] = None


# For nested relationships
from app.schemas.user import User
MessageWithAuthor.update_forward_refs()
MessageWithReplies.update_forward_refs()
MessageWithAuthorAndParent.update_forward_refs()
