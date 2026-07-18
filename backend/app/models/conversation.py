"""
Conversation Model
对话管理模型
"""

from sqlalchemy import Column, String, Text, DateTime, Index, ForeignKey, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType
from app.core.soft_delete import SoftDeleteMixinSync


class Conversation(Base, SoftDeleteMixinSync):
    """
    对话模型
    
    管理多轮对话会话
    """
    __tablename__ = "conversations"
    
    __table_args__ = (
        Index('idx_conversation_tenant', 'tenant_id'),
        Index('idx_conversation_user', 'user_id'),
        Index('idx_conversation_status', 'status'),
        Index('idx_conversation_created', 'created_at'),
    )
    
    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    tenant_id = Column(UUIDType, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    status = Column(String(20), nullable=False, default="active", index=True)
    prompt_id = Column(UUIDType, ForeignKey("prompts.id", ondelete="SET NULL"), nullable=True)
    model = Column(String(100), nullable=False)
    total_messages = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="conversations")
    user = relationship("User")
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")
    prompt = relationship("Prompt")


class ConversationMessage(Base):
    """
    对话消息模型
    
    存储单条对话消息
    """
    __tablename__ = "conversation_messages"
    
    __table_args__ = (
        Index('idx_conv_msg_conversation', 'conversation_id'),
        Index('idx_conv_msg_created', 'created_at'),
    )
    
    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    conversation_id = Column(UUIDType, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    tokens = Column(Integer, default=0)
    model = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
