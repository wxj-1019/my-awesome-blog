"""
Memory Vector Model
支持向量存储和语义检索的记忆模型
"""

from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Column, String, Text, DateTime, UUID, Index, ForeignKey, Float, Integer, inspect
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
import uuid
from app.core.database import Base

# 尝试导入 pgvector，如果不存在则使用 Text 作为后备
try:
    from pgvector.sqlalchemy import Vector
    VECTOR_TYPE_AVAILABLE = True
except ImportError:
    VECTOR_TYPE_AVAILABLE = False
    # 后备类型
    Vector = Text


class MemoryVector(Base):
    """
    记忆向量模型
    
    支持向量存储和语义检索的记忆管理
    """
    __tablename__ = "memories"
    
    __table_args__ = (
        Index('idx_memory_tenant', 'tenant_id'),
        Index('idx_memory_user', 'user_id'),
        Index('idx_memory_type', 'memory_type'),
        Index('idx_memory_importance', 'importance'),
        Index('idx_memory_expires', 'expires_at'),
        Index('idx_memory_deleted', 'deleted_at'),
        Index('idx_memory_is_deleted', 'is_deleted'),
        # 向量索引将在初始化时创建
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    memory_type = Column(String(50), nullable=False, index=True)
    content = Column(Text, nullable=False)
    
    # 向量字段 - 使用 pgvector 的 Vector 类型
    if VECTOR_TYPE_AVAILABLE:
        embedding = Column(Vector(1536), nullable=True)
    else:
        embedding = Column(Text, nullable=True)
    
    importance = Column(Float, default=0.5, index=True)
    access_count = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # 软删除字段
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    is_deleted = Column(Boolean, default=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="memories")
    
    @hybrid_property
    def is_expired(self) -> bool:
        """检查记忆是否已过期"""
        if self.expires_at is None:
            return False
        from datetime import datetime
        return datetime.utcnow() > self.expires_at
    
    @hybrid_property
    def is_active(self) -> bool:
        """检查记忆是否处于活跃状态（未删除且未过期）"""
        return not self.is_deleted and not self.is_expired
    
    def soft_delete(self):
        """软删除记忆"""
        from datetime import datetime
        self.deleted_at = datetime.utcnow()
        self.is_deleted = True
    
    def restore(self):
        """恢复已软删除的记忆"""
        self.deleted_at = None
        self.is_deleted = False
    
    def increment_access(self):
        """增加访问计数"""
        self.access_count += 1
    
    def set_embedding(self, embedding_vector: List[float]):
        """
        设置向量嵌入
        
        Args:
            embedding_vector: 1536 维的向量列表
        """
        if VECTOR_TYPE_AVAILABLE:
            self.embedding = embedding_vector
        else:
            import json
            self.embedding = json.dumps(embedding_vector)
    
    def get_embedding(self) -> Optional[List[float]]:
        """
        获取向量嵌入
        
        Returns:
            List[float] 或 None
        """
        if self.embedding is None:
            return None
        
        if VECTOR_TYPE_AVAILABLE:
            return self.embedding
        else:
            import json
            try:
                return json.loads(self.embedding)
            except (json.JSONDecodeError, TypeError):
                return None


# 向后兼容 - Memory 别名
Memory = MemoryVector


async def create_memory_vector_indexes():
    """
    创建记忆向量的索引
    应在应用启动时调用
    """
    from app.core.vector_db import vector_db
    from app.core.database_async import AsyncSessionLocal
    
    async with AsyncSessionLocal() as session:
        # 确保 pgvector 扩展已安装
        await vector_db.initialize_extension(session)
        
        # 创建向量索引
        await vector_db.create_vector_index(
            session=session,
            table_name="memories",
            column_name="embedding",
            index_type="ivfflat",
            lists=100,
        )


# 添加 Boolean 类型导入
from sqlalchemy import Boolean
