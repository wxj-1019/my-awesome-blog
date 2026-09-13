"""AI 无状态生成类端点的 schema（生成即返回，不落库）"""

from pydantic import BaseModel, Field


class ArticleSummaryRequest(BaseModel):
    """文章摘要生成请求（无状态，不落库；编辑器自行填写 excerpt）"""
    title: str = Field(..., min_length=1, max_length=300, description="文章标题")
    # 至少 50 字：过短的内容没有摘要价值，直接 422 拒绝
    content: str = Field(..., min_length=50, description="文章正文")
    max_length: int = Field(120, ge=10, le=1000, description="摘要最大字数，默认 120")


class ArticleSummaryResponse(BaseModel):
    """文章摘要生成响应"""
    summary: str
