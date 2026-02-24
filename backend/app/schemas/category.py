from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = 0
    is_active: Optional[bool] = True


class CategoryCreate(CategoryBase):
    name: str
    slug: str


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryInDBBase(CategoryBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {'from_attributes': True}


class Category(CategoryInDBBase):
    pass


class CategoryWithArticleCount(CategoryInDBBase):
    article_count: int = 0
