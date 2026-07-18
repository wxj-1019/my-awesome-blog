from pydantic import BaseModel, field_serializer, field_validator
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
import json


# PortfolioItem 相关的类定义（保持向后兼容）

class PortfolioItemBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    demo_url: Optional[str] = None
    github_url: Optional[str] = None
    technologies: Optional[List[str]] = []  # 使用JSON格式存储技术栈
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = 'completed'  # completed, in_progress, planned
    is_featured: Optional[bool] = False
    sort_order: Optional[int] = 0

    @field_validator('technologies', mode='before')
    @classmethod
    def parse_technologies(cls, v):
        # 数据库中技术栈以JSON字符串存储，读取时自动反序列化
        if isinstance(v, str):
            return json.loads(v) if v else []
        return v if v is not None else []


class PortfolioItemCreate(PortfolioItemBase):
    title: str
    slug: str


class PortfolioItemUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    demo_url: Optional[str] = None
    github_url: Optional[str] = None
    technologies: Optional[List[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None


class PortfolioItemInDBBase(PortfolioItemBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    model_config = {'from_attributes': True}


class PortfolioItem(PortfolioItemInDBBase):
    pass


class Portfolio(PortfolioItemInDBBase):
    pass


class PortfolioCreate(PortfolioItemBase):
    title: str
    slug: str


class PortfolioUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    demo_url: Optional[str] = None
    github_url: Optional[str] = None
    technologies: Optional[List[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None