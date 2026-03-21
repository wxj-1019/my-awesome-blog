"""
Memory Model
记忆管理模型，支持向量存储和语义检索
"""

from sqlalchemy import Column, String, Text, DateTime, UUID, Index, ForeignKey, Float, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.soft_delete import SoftDeleteMixinSync


class Memory(Base, SoftDeleteMixinSync):
    """
    记忆模型
    
    支持短期和长期记忆，向量检索
    """
    __tablename__ = "memories"
    
    __table_args__ = (
        Index('idx_memory_tenant', 'tenant_id'),
        Index('idx_memory_user', 'user_id'),
        Index('idx_memory_type', 'memory_type'),
        Index('idx_memory_importance', 'importance'),
        Index('idx_memory_expires', 'expires_at'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    memory_type = Column(String(50), nullable=False, index=True)
    content = Column(Text, nullable=False)
    embedding = Column(Text, nullable=True)
    importance = Column(Float, default=0.5, index=True)
    access_count = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="memories")
