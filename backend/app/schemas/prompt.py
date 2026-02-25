"""
Prompt Schemas
Prompt 管理相关的请求和响应 Schema
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class PromptVariable(BaseModel):
    """
    Prompt 变量定义
    """
    name: str = Field(..., description="变量名称")
    type: str = Field(..., description="变量类型: string, number, boolean, select")
    default: Optional[str] = Field(None, description="默认值")
    required: bool = Field(default=True, description="是否必填")
    description: Optional[str] = Field(None, description="变量描述")


class PromptBase(BaseModel):
    """
    Prompt 基础 Schema
    """
    name: str = Field(..., min_length=1, max_length=100, description="Prompt 名称")
    version: str = Field(..., min_length=1, max_length=20, description="版本号")
    content: str = Field(..., min_length=1, description="Prompt 内容")
    variables: Optional[Dict[str, PromptVariable]] = Field(default=None, description="变量定义")
    description: Optional[str] = Field(None, max_length=500, description="描述")
    category: Optional[str] = Field(None, max_length=50, description="分类")
    is_system: bool = Field(default=False, description="是否系统 Prompt")
    ab_test_group: Optional[str] = Field(None, max_length=20, description="A/B 测试分组")
    ab_test_percentage: int = Field(default=50, ge=0, le=100, description="A/B 测试分配百分比")


class PromptCreate(PromptBase):
    """
    创建 Prompt Schema
    """
    pass


class PromptUpdate(BaseModel):
    """
    更新 Prompt Schema
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    version: Optional[str] = Field(None, min_length=1, max_length=20)
    content: Optional[str] = Field(None, min_length=1)
    variables: Optional[Dict[str, PromptVariable]] = None
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    ab_test_group: Optional[str] = Field(None, max_length=20)
    ab_test_percentage: Optional[int] = Field(None, ge=0, le=100)


class PromptInDBBase(PromptBase):
    """
    数据库中的 Prompt 基础 Schema
    """
    id: UUID
    tenant_id: UUID
    is_active: bool
    usage_count: int = 0
    success_rate: int = 0
    total_interactions: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None


class Prompt(PromptInDBBase):
    """
    完整 Prompt Schema
    """
    class Config:
        from_attributes = True


class PromptListResponse(BaseModel):
    """
    Prompt 列表响应
    """
    prompts: List[Prompt]
    total: int
    page: int
    page_size: int


class PromptVersionInfo(BaseModel):
    """
    Prompt 版本信息
    """
    version: str
    created_at: datetime
    is_active: bool
    usage_count: int


class PromptVersionsResponse(BaseModel):
    """
    Prompt 版本列表响应
    """
    name: str
    versions: List[PromptVersionInfo]


class PromptABTestResult(BaseModel):
    """
    A/B 测试结果
    """
    group_a: Prompt
    group_b: Prompt
    stats_a: Dict[str, Any]
    stats_b: Dict[str, Any]
