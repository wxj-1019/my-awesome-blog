from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class TagBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    color: Optional[str] = None


class TagCreate(TagBase):
    name: str
    slug: str


class TagUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class TagInDBBase(TagBase):
    id: UUID
    created_at: datetime

    model_config = {'from_attributes': True}


class Tag(TagInDBBase):
    pass


class TagWithArticleCount(TagInDBBase):
    article_count: int = 0
