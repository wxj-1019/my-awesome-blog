from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    is_approved = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)  # 软删除（对齐 messages/conversations/memories）
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign keys
    article_id = Column(UUIDType, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # 登录用户评论；游客为 NULL
    nickname = Column(String(50), nullable=True)  # 游客昵称（author_id 为空时展示）
    parent_id = Column(UUIDType, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    
    # Relationships
    article = relationship("Article", back_populates="comments")
    author = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")