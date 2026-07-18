"""
Tenant Model
多租户数据模型
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class Tenant(Base):
    """
    租户模型
    
    支持多租户数据隔离，每个租户拥有独立的数据空间
    """
    __tablename__ = "tenants"
    
    __table_args__ = (
        Index('idx_tenant_status', 'is_active'),
        Index('idx_tenant_created', 'created_at'),
    )
    
    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True, unique=True)
    slug = Column(String(50), nullable=False, index=True, unique=True)
    description = Column(String(500))
    is_active = Column(Boolean, default=True, index=True)
    max_users = Column(Integer, default=100)
    max_conversations = Column(Integer, default=1000)
    max_storage_mb = Column(Integer, default=1024)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="tenant", cascade="all, delete-orphan")
    prompts = relationship("Prompt", back_populates="tenant", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="tenant", cascade="all, delete-orphan")
