from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, field_serializer, computed_field

from app.schemas.article_attachment import ArticleAttachmentCreate


# Base schemas
class ArticleBase(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    is_published: bool = False


# Create schemas
class ArticleCreate(ArticleBase):
    category_id: Optional[UUID] = None  # 旧的单分类字段，兼容保留；与 category_ids 同时给出时合并
    category_ids: Optional[List[UUID]] = None  # 多分类（产品决策 2026-09）
    tags: Optional[List[UUID]] = []
    attachments: Optional[List[ArticleAttachmentCreate]] = None


class ArticleCreateWithAuthor(ArticleCreate):
    author_id: str


# Update schemas
class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    is_published: Optional[bool] = None
    category_ids: Optional[List[UUID]] = None  # 多分类全量替换
    tag_ids: Optional[List[UUID]] = None  # 标签全量替换（此前更新端点无法改标签）
    attachments: Optional[List[ArticleAttachmentCreate]] = None


# Response schemas
class ArticleInDBBase(ArticleBase):
    id: UUID
    author_id: UUID
    view_count: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    read_time: Optional[int] = 0
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0

    @field_serializer('id', 'author_id')
    def serialize_uuids(self, value: UUID) -> str:
        return str(value)

    model_config = {'from_attributes': True}


class Article(ArticleInDBBase):
    pass


class ArticleWithAuthor(Article):
    author: Optional["User"] = None
    categories: Optional[List["Category"]] = []
    tags: Optional[List["Tag"]] = []
    attachments: Optional[List["ArticleAttachment"]] = []
    
    @computed_field
    def category(self) -> Optional["Category"]:
        if self.categories and len(self.categories) > 0:
            return self.categories[0]
        return None

# For nested relationships
from app.schemas.user import User
from app.schemas.category import Category
from app.schemas.tag import Tag
from app.schemas.article_attachment import ArticleAttachment
ArticleWithAuthor.model_rebuild()
ArticleWithAuthor.update_forward_refs()