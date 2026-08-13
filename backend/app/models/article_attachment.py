from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base
from app.core.types import UUIDType


class ArticleAttachment(Base):
    """
    文章附件/资料：图片、视频、音频、文档等。
    is_reference=True 表示仅作者可见的写作参考资料（详情页不渲染），
    is_reference=False 为读者可见的展示型内容（详情页渲染播放器/下载链接）。
    """

    __tablename__ = "article_attachments"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    article_id = Column(
        UUIDType, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # 显示名（默认为原始文件名）
    name = Column(String(255), nullable=False)
    # 文件地址（OSS URL 或外部 URL）
    url = Column(String(500), nullable=False)
    # 媒体类型：image / video / audio / file
    media_type = Column(String(20), nullable=False, default="file")
    # 原始 MIME 类型（可空，外部 URL 可能未知）
    mime_type = Column(String(100), nullable=True)
    # 文件大小（字节，可空）
    file_size = Column(Integer, nullable=True)
    # True=仅作者写作参考，False=读者可见
    is_reference = Column(Boolean, default=False)
    # 展示顺序
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    article = relationship("Article", back_populates="attachments")
