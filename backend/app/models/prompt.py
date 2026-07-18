"""
Prompt Model
Prompt 模板管理模型，支持版本控制和 A/B 测试
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, JSON, Index, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class Prompt(Base):
    """
    Prompt 模型
    
    支持多版本、A/B 测试分组、变量定义
    """
    __tablename__ = "prompts"
    
    __table_args__ = (
        Index('idx_prompt_tenant', 'tenant_id'),
        Index('idx_prompt_name', 'name'),
        Index('idx_prompt_version', 'version'),
        Index('idx_prompt_active', 'is_active'),
        Index('idx_prompt_ab_test', 'ab_test_group'),
        Index('idx_prompt_created', 'created_at'),
    )
    
    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    tenant_id = Column(UUIDType, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    version = Column(String(20), nullable=False, index=True)
    content = Column(Text, nullable=False)
    variables = Column(JSON, nullable=True, default={})
    description = Column(String(500))
    category = Column(String(50), index=True)
    is_active = Column(Boolean, default=True, index=True)
    is_system = Column(Boolean, default=False)
    ab_test_group = Column(String(20), nullable=True, index=True)
    ab_test_percentage = Column(Integer, default=50)
    usage_count = Column(Integer, default=0)
    success_rate = Column(Integer, default=0)
    total_interactions = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="prompts")
