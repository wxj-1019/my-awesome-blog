from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Index, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class User(Base):
    __tablename__ = "users"

    # 添加复合索引以优化常用查询
    __table_args__ = (
        Index('idx_user_active_created', 'is_active', 'created_at'),  # 按状态和时间查询
        Index('idx_user_superuser', 'is_superuser'),                  # 管理员查询
        Index('idx_user_tenant', 'tenant_id'),                   # 租户查询
    )

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    tenant_id = Column(UUIDType, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), index=True)  # 添加索引以加快搜索
    is_active = Column(Boolean, default=True, index=True)  # 添加索引以加快过滤
    is_superuser = Column(Boolean, default=False, index=True)  # 添加索引以加快权限检查
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)  # 添加索引以加快按时间排序
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # 新增字段
    avatar = Column(String(500))
    bio = Column(Text)
    website = Column(String(200), index=True)  # 添加索引以加快搜索
    twitter = Column(String(100), index=True)  # 添加索引以加快搜索
    github = Column(String(100), index=True)  # 添加索引以加快搜索
    linkedin = Column(String(100), index=True)  # 添加索引以加快搜索

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    articles = relationship("Article", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="author", cascade="all, delete-orphan")