from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    color = Column(String(7), default="#00D9FF")  # 弹幕颜色，默认科技蓝
    is_danmaku = Column(Boolean, default=True)  # 是否以弹幕形式显示
    likes = Column(Integer, default=0)  # 点赞数
    level = Column(Integer, default=1)  # 用户等级
    is_deleted = Column(Boolean, default=False)  # 软删除标记
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign keys
    author_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # 登录用户留言；游客为 NULL
    nickname = Column(String(50), nullable=True)  # 游客昵称（author_id 为空时展示）
    parent_id = Column(UUIDType, ForeignKey("messages.id", ondelete="CASCADE"), nullable=True)
    
    # Relationships
    author = relationship("User", back_populates="messages")
    parent = relationship("Message", remote_side=[id], backref="replies")
