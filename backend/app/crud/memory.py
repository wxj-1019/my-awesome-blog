"""
Memory CRUD Operations
记忆数据库操作
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from app.models.memory import Memory
from app.schemas.memory import MemoryCreate, MemoryUpdate
from datetime import datetime
from app.utils.logger import app_logger


def get_memory(db: Session, memory_id: str) -> Optional[Memory]:
    """
    根据 ID 获取记忆
    
    Args:
        db: 数据库会话
        memory_id: 记忆 ID
    
    Returns:
        Memory: 记忆对象或 None
    """
    return db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.is_deleted == False
    ).first()


def get_memories(
    db: Session,
    tenant_id: str,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
    memory_type: Optional[str] = None,
    min_importance: Optional[float] = None,
) -> List[Memory]:
    """
    获取记忆列表
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
        user_id: 用户 ID
        skip: 跳过数量
        limit: 限制数量
        memory_type: 记忆类型筛选
        min_importance: 最小重要性筛选
    
    Returns:
        List[Memory]: 记忆列表
    """
    query = db.query(Memory).filter(
        and_(
            Memory.tenant_id == tenant_id,
            Memory.user_id == user_id,
            Memory.is_deleted == False,
        )
    )
    
    if memory_type:
        query = query.filter(Memory.memory_type == memory_type)
    if min_importance is not None:
        query = query.filter(Memory.importance >= min_importance)
    
    return (
        query.order_by(desc(Memory.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def search_memories(
    db: Session,
    tenant_id: str,
    user_id: str,
    query: str,
    memory_type: Optional[str] = None,
    min_importance: Optional[float] = None,
    top_k: int = 10,
) -> List[Memory]:
    """
    搜索记忆
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
        user_id: 用户 ID
        query: 搜索查询
        memory_type: 记忆类型筛选
        min_importance: 最小重要性筛选
        top_k: 返回数量
    
    Returns:
        List[Memory]: 匹配的记忆列表
    """
    query_obj = db.query(Memory).filter(
        and_(
            Memory.tenant_id == tenant_id,
            Memory.user_id == user_id,
            Memory.is_deleted == False,
        )
    )
    
    if memory_type:
        query_obj = query_obj.filter(Memory.memory_type == memory_type)
    if min_importance is not None:
        query_obj = query_obj.filter(Memory.importance >= min_importance)
    
    query_obj = query_obj.filter(Memory.content.ilike(f"%{query}%"))
    
    return (
        query_obj.order_by(desc(Memory.importance), desc(Memory.created_at))
        .limit(top_k)
        .all()
    )


def get_expired_memories(db: Session, tenant_id: str) -> List[Memory]:
    """
    获取过期的记忆
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
    
    Returns:
        List[Memory]: 过期的记忆列表
    """
    now = datetime.utcnow()
    return (
        db.query(Memory)
        .filter(
            and_(
                Memory.tenant_id == tenant_id,
                Memory.expires_at < now,
                Memory.is_deleted == False,
            )
        )
        .all()
    )


def create_memory(
    db: Session,
    memory_in: MemoryCreate,
    tenant_id: str,
    user_id: str,
) -> Memory:
    """
    创建新记忆
    
    Args:
        db: 数据库会话
        memory_in: 创建请求
        tenant_id: 租户 ID
        user_id: 用户 ID
    
    Returns:
        Memory: 创建的记忆对象
    """
    import uuid
    db_memory = Memory(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        user_id=user_id,
        **memory_in.dict()
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    app_logger.info(f"Created memory: {db_memory.id}")
    return db_memory


def create_memories_batch(
    db: Session,
    memories_in: List[MemoryCreate],
    tenant_id: str,
    user_id: str,
) -> List[Memory]:
    """
    批量创建记忆
    
    Args:
        db: 数据库会话
        memories_in: 创建请求列表
        tenant_id: 租户 ID
        user_id: 用户 ID
    
    Returns:
        List[Memory]: 创建的记忆对象列表
    """
    import uuid
    db_memories = []
    
    for memory_in in memories_in:
        db_memory = Memory(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            user_id=user_id,
            **memory_in.dict()
        )
        db.add(db_memory)
        db_memories.append(db_memory)
    
    db.commit()
    
    for db_memory in db_memories:
        db.refresh(db_memory)
    
    app_logger.info(f"Created {len(db_memories)} memories")
    return db_memories


def update_memory(db: Session, db_memory: Memory, memory_in: MemoryUpdate) -> Memory:
    """
    更新记忆
    
    Args:
        db: 数据库会话
        db_memory: 现有记忆对象
        memory_in: 更新请求
    
    Returns:
        Memory: 更新后的记忆对象
    """
    for field, value in memory_in.dict(exclude_unset=True).items():
        setattr(db_memory, field, value)
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    app_logger.info(f"Updated memory: {db_memory.id}")
    return db_memory


def delete_memory(db: Session, memory_id: str) -> Memory:
    """
    删除记忆
    
    Args:
        db: 数据库会话
        memory_id: 记忆 ID
    
    Returns:
        Memory: 被删除的记忆对象
    """
    memory = get_memory(db, memory_id)
    if memory:
        db.delete(memory)
        db.commit()
        app_logger.info(f"Deleted memory: {memory_id}")
    return memory


def increment_memory_access(db: Session, memory_id: str) -> Optional[Memory]:
    """
    增加记忆访问计数
    
    Args:
        db: 数据库会话
        memory_id: 记忆 ID
    
    Returns:
        Memory: 更新后的记忆对象或 None
    """
    db.query(Memory).filter(Memory.id == memory_id).update(
        {Memory.access_count: Memory.access_count + 1}
    )
    db.commit()
    return get_memory(db, memory_id)


def count_memories(
    db: Session,
    tenant_id: str,
    user_id: str,
    memory_type: Optional[str] = None,
) -> int:
    """
    统计记忆数量
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
        user_id: 用户 ID
        memory_type: 记忆类型筛选
    
    Returns:
        int: 记忆数量
    """
    query = db.query(Memory).filter(
        and_(
            Memory.tenant_id == tenant_id,
            Memory.user_id == user_id,
        )
    )
    
    if memory_type:
        query = query.filter(Memory.memory_type == memory_type)
    
    return query.count()


def get_memory_stats(
    db: Session,
    tenant_id: str,
    user_id: str,
) -> dict:
    """
    获取记忆统计信息
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
        user_id: 用户 ID
    
    Returns:
        dict: 统计信息
    """
    from sqlalchemy import func
    
    memories = db.query(Memory).filter(
        and_(
            Memory.tenant_id == tenant_id,
            Memory.user_id == user_id,
        )
    ).all()
    
    if not memories:
        return {
            "total": 0,
            "by_type": {},
            "avg_importance": 0.0,
            "total_access_count": 0,
        }
    
    total = len(memories)
    by_type = {}
    for mem in memories:
        by_type[mem.memory_type] = by_type.get(mem.memory_type, 0) + 1
    
    avg_importance = sum(mem.importance for mem in memories) / total
    total_access_count = sum(mem.access_count for mem in memories)
    
    return {
        "total": total,
        "by_type": by_type,
        "avg_importance": avg_importance,
        "total_access_count": total_access_count,
    }


def cleanup_expired_memories(db: Session, tenant_id: str) -> int:
    """
    清理过期记忆
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
    
    Returns:
        int: 删除的记忆数量
    """
    expired = get_expired_memories(db, tenant_id)
    
    count = len(expired)
    for memory in expired:
        db.delete(memory)
    
    db.commit()
    
    app_logger.info(f"Cleaned up {count} expired memories for tenant {tenant_id}")
    return count
