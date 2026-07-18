"""
Context History Model
上下文历史记录模型
"""

from sqlalchemy import Column, String, Text, DateTime, Index, ForeignKey, Integer
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class ContextHistory(Base):
    """
    上下文历史模型
    
    记录对话的上下文状态，用于智能窗口管理
    """
    __tablename__ = "context_history"
    
    __table_args__ = (
        Index('idx_ctx_conversation', 'conversation_id'),
        Index('idx_ctx_created', 'created_at'),
    )
    
    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    conversation_id = Column(UUIDType, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    message_count = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    summary = Column(Text)
    key_points = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
