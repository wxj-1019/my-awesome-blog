"""
Soft Delete Mixin
软删除机制 - 支持数据恢复和审计追踪
"""

from datetime import datetime
from typing import Optional, TypeVar, List, Generic
from sqlalchemy import Column, DateTime, Boolean, select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import declared_attr
from sqlalchemy.sql import Select

from app.utils.logger import app_logger

T = TypeVar('T', bound='SoftDeleteMixin')


class SoftDeleteMixin:
    """
    软删除 Mixin 类
    
    为模型添加软删除功能，支持：
    - 软删除（保留数据，标记为已删除）
    - 恢复已删除数据
    - 永久删除
    - 查询时自动过滤已删除数据
    - 审计追踪
    
    Usage:
        class MyModel(Base, SoftDeleteMixin):
            __tablename__ = 'my_table'
            name = Column(String(100))
        
        # 软删除
        obj.soft_delete()
        
        # 恢复
        obj.restore()
        
        # 查询（自动过滤已删除）
        results = await MyModel.query_active(session).all()
        
        # 查询包含已删除
        results = await MyModel.query_with_deleted(session).all()
        
        # 只查询已删除
        results = await MyModel.query_only_deleted(session).all()
    """
    
    # 软删除字段
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    
    def soft_delete(self, deleted_at: Optional[datetime] = None) -> None:
        """
        软删除记录
        
        Args:
            deleted_at: 删除时间，默认为当前时间
        """
        self.deleted_at = deleted_at or datetime.utcnow()
        self.is_deleted = True
        
        app_logger.info(
            f"Soft deleted {self.__class__.__name__}",
            extra={"id": str(getattr(self, 'id', None))}
        )
    
    def restore(self) -> None:
        """恢复已软删除的记录"""
        self.deleted_at = None
        self.is_deleted = False
        
        app_logger.info(
            f"Restored {self.__class__.__name__}",
            extra={"id": str(getattr(self, 'id', None))}
        )
    
    @property
    def is_active(self) -> bool:
        """检查记录是否处于活跃状态（未删除）"""
        return not self.is_deleted
    
    @property
    def deletion_age_days(self) -> Optional[int]:
        """
        获取已删除天数
        
        Returns:
            int: 已删除天数，如果未删除则返回 None
        """
        if not self.is_deleted or not self.deleted_at:
            return None
        
        delta = datetime.utcnow() - self.deleted_at
        return delta.days
    
    @classmethod
    def query_active(cls, session: AsyncSession) -> Select:
        """
        查询活跃记录（未删除）
        
        Args:
            session: 数据库会话
            
        Returns:
            Select: SQLAlchemy 查询对象
        """
        return select(cls).where(cls.is_deleted == False)
    
    @classmethod
    def query_with_deleted(cls, session: AsyncSession) -> Select:
        """
        查询所有记录（包含已删除）
        
        Args:
            session: 数据库会话
            
        Returns:
            Select: SQLAlchemy 查询对象
        """
        return select(cls)
    
    @classmethod
    def query_only_deleted(cls, session: AsyncSession) -> Select:
        """
        只查询已删除记录
        
        Args:
            session: 数据库会话
            
        Returns:
            Select: SQLAlchemy 查询对象
        """
        return select(cls).where(cls.is_deleted == True)
    
    @classmethod
    async def restore_by_id(
        cls: type[T],
        session: AsyncSession,
        record_id: str
    ) -> Optional[T]:
        """
        通过 ID 恢复记录
        
        Args:
            session: 数据库会话
            record_id: 记录 ID
            
        Returns:
            恢复后的记录，如果不存在则返回 None
        """
        from sqlalchemy import update
        
        result = await session.execute(
            update(cls)
            .where(
                (cls.id == record_id) &
                (cls.is_deleted == True)
            )
            .values(
                deleted_at=None,
                is_deleted=False
            )
            .returning(cls)
        )
        
        record = result.scalar_one_or_none()
        if record:
            await session.commit()
            app_logger.info(f"Restored {cls.__name__} {record_id}")
        
        return record
    
    @classmethod
    async def hard_delete_by_id(
        cls: type[T],
        session: AsyncSession,
        record_id: str
    ) -> bool:
        """
        永久删除记录（物理删除）
        
        Args:
            session: 数据库会话
            record_id: 记录 ID
            
        Returns:
            bool: 是否成功删除
        """
        record = await session.get(cls, record_id)
        if record:
            await session.delete(record)
            await session.commit()
            app_logger.info(f"Hard deleted {cls.__name__} {record_id}")
            return True
        return False
    
    @classmethod
    async def cleanup_expired(
        cls,
        session: AsyncSession,
        days: int = 30
    ) -> int:
        """
        清理已删除超过指定天数的记录
        
        Args:
            session: 数据库会话
            days: 删除后保留天数，默认 30 天
            
        Returns:
            int: 清理的记录数量
        """
        cutoff_date = datetime.utcnow() - __import__('datetime').timedelta(days=days)
        
        result = await session.execute(
            select(cls).where(
                (cls.is_deleted == True) &
                (cls.deleted_at < cutoff_date)
            )
        )
        
        records = result.scalars().all()
        count = 0
        
        for record in records:
            await session.delete(record)
            count += 1
        
        await session.commit()
        
        if count > 0:
            app_logger.info(f"Cleaned up {count} expired {cls.__name__} records")
        
        return count


class SoftDeleteQuery:
    """
    软删除查询辅助类
    用于在 CRUD 操作中统一处理软删除过滤
    """
    
    @staticmethod
    def apply_active_filter(query: Select, model) -> Select:
        """
        应用活跃记录过滤器
        
        Args:
            query: 原始查询
            model: 模型类
            
        Returns:
            Select: 添加过滤条件的查询
        """
        if hasattr(model, 'is_deleted'):
            return query.where(model.is_deleted == False)
        return query
    
    @staticmethod
    def apply_deleted_filter(query: Select, model, include_deleted: bool = False) -> Select:
        """
        应用删除状态过滤器
        
        Args:
            query: 原始查询
            model: 模型类
            include_deleted: 是否包含已删除记录
            
        Returns:
            Select: 添加过滤条件的查询
        """
        if hasattr(model, 'is_deleted') and not include_deleted:
            return query.where(model.is_deleted == False)
        return query


# 同步版本的软删除 Mixin（用于现有同步代码）
class SoftDeleteMixinSync:
    """
    同步版本的软删除 Mixin
    用于现有的同步数据库操作
    """
    
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    
    def soft_delete(self, deleted_at: Optional[datetime] = None) -> None:
        """软删除记录"""
        self.deleted_at = deleted_at or datetime.utcnow()
        self.is_deleted = True
    
    def restore(self) -> None:
        """恢复已软删除的记录"""
        self.deleted_at = None
        self.is_deleted = False
    
    @property
    def is_active(self) -> bool:
        """检查记录是否处于活跃状态"""
        return not self.is_deleted
