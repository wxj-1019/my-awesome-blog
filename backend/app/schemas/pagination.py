"""
通用分页信封。

背景：列表接口原先直接返回 `List[T]`，调用方拿不到总数，只能用「当前页长度」
当作 total，导致总页数恒为 1、翻页失效（前端 admin 文章/图片列表即为此故障）。
本模块提供带总数的统一信封，供所有 offset/limit 分页的列表接口复用。

游标分页（如 /articles/cursor-paginated）另有形态，不走本信封。
"""
from typing import Generic, List, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """offset/limit 分页信封"""

    items: List[T] = Field(description="当前页数据")
    total: int = Field(description="符合过滤条件的总条数（非当前页条数）")
    skip: int = Field(description="本次请求跳过的条数")
    limit: int = Field(description="本次请求的每页上限")

    @property
    def has_more(self) -> bool:
        """是否还有下一页（仅供服务端内部使用，不参与序列化）"""
        return self.skip + len(self.items) < self.total
