from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_serializer


class ArticleAttachmentBase(BaseModel):
    """附件基础字段（创建与更新共用）"""
    name: str
    url: str
    # media_type: image / video / audio / file
    media_type: str = "file"
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    # True=仅作者写作参考，False=读者可见
    is_reference: bool = False
    sort_order: int = 0


class ArticleAttachmentCreate(ArticleAttachmentBase):
    pass


class ArticleAttachmentUpdate(ArticleAttachmentBase):
    name: Optional[str] = None
    url: Optional[str] = None
    media_type: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    is_reference: Optional[bool] = None
    sort_order: Optional[int] = None


class ArticleAttachment(ArticleAttachmentBase):
    id: UUID
    created_at: Optional[datetime] = None

    @field_serializer('id')
    def serialize_uuids(self, value: UUID) -> str:
        return str(value)

    model_config = {'from_attributes': True}
