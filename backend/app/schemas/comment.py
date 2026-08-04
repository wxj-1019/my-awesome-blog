from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_serializer


# Base schemas
class CommentBase(BaseModel):
    # 与 ConversationMessage 等保持一致：内容非空且限长，避免空评论落库
    content: str = Field(..., min_length=1, max_length=5000, description="评论内容")


# Create schemas
class CommentCreate(CommentBase):
    article_id: str
    parent_id: Optional[str] = None
    nickname: Optional[str] = Field(default=None, max_length=50, description="游客昵称（未登录时展示）")


# Update schemas
class CommentUpdate(BaseModel):
    content: Optional[str] = None
    is_approved: Optional[bool] = None


# Response schemas
class CommentInDBBase(CommentBase):
    id: UUID
    article_id: UUID
    author_id: Optional[UUID] = None
    nickname: Optional[str] = None
    parent_id: Optional[UUID] = None
    is_approved: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer('id', 'article_id', 'author_id', 'parent_id')
    def serialize_uuids(self, value: Optional[UUID]) -> Optional[str]:
        return str(value) if value is not None else None

    model_config = {'from_attributes': True}


class Comment(CommentInDBBase):
    pass


class CommentWithAuthor(Comment):
    author: Optional["User"] = None


class CommentWithArticle(Comment):
    article: Optional["Article"] = None


class CommentWithAuthorAndArticle(Comment):
    author: Optional["User"] = None
    article: Optional["Article"] = None


# For nested relationships
from app.schemas.user import User
from app.schemas.article import Article
CommentWithAuthor.update_forward_refs()
CommentWithArticle.update_forward_refs()
CommentWithAuthorAndArticle.update_forward_refs()