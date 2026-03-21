"""
Memories API Endpoints
记忆管理相关的 API 接口
"""

from typing import Optional
from fastapi import APIRouter, Depends, status, Query, Request
from app.exceptions import (
    NotFoundException,
    ValidationException,
    ResourceNotFoundException,
)
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.memory import (
    MemoryCreate,
    MemoryUpdate,
    Memory,
    MemoryListResponse,
    MemorySearchRequest,
    MemorySearchResponse,
    MemoryStats,
    MemoryBatchCreate,
)
from app.models.user import User
from app.services.memory_service import memory_service
from app.utils.logger import app_logger
from app.utils.rate_limit import memory_create_rate_limit, batch_operation_rate_limit

router = APIRouter()


@router.post("/", response_model=Memory, status_code=status.HTTP_201_CREATED)
@memory_create_rate_limit
async def create_memory(
    request: Request,
    *,
    db: Session = Depends(get_db),
    memory_in: MemoryCreate,
    current_user: User = Depends(get_current_active_user),
) -> Memory:
    """
    创建新记忆
    
    - **memory_type**: 记忆类型 (fact, preference, behavior, skill)
    - **content**: 记忆内容
    - **importance**: 重要性评分 (0.0-1.0)
    - **expires_at**: 过期时间（可选）
    """
    memory = await memory_service.create_memory(
        db=db,
        memory_in=memory_in,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
    )
    
    app_logger.info(f"User {current_user.username} created memory: {memory.id}")
    return memory


@router.post("/batch", response_model=list[Memory], status_code=status.HTTP_201_CREATED)
@batch_operation_rate_limit
async def batch_create_memories(
    request: Request,
    *,
    db: Session = Depends(get_db),
    batch_request: MemoryBatchCreate,
    current_user: User = Depends(get_current_active_user),
):
    """
    批量创建记忆
    
    - **memories**: 记忆列表
    """
    memories = await memory_service.batch_create_memories(
        db=db,
        batch_request=batch_request,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
    )
    
    app_logger.info(f"User {current_user.username} created {len(memories)} memories")
    return memories


@router.get("/{memory_id}", response_model=Memory, status_code=status.HTTP_200_OK)
async def get_memory(
    *,
    db: Session = Depends(get_db),
    memory_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Memory:
    """
    获取指定记忆
    
    - **memory_id**: 记忆 ID
    """
    memory = await memory_service.get_memory(
        db=db,
        memory_id=memory_id,
        user_id=str(current_user.id),
    )
    
    if not memory:
        raise NotFoundException(
            resource="Memory",
            identifier=memory_id
        )
    
    return memory


@router.get("/", response_model=MemoryListResponse, status_code=status.HTTP_200_OK)
async def list_memories(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    memory_type: Optional[str] = Query(None),
    min_importance: Optional[float] = Query(None, ge=0.0, le=1.0),
) -> MemoryListResponse:
    """
    获取记忆列表
    
    - **skip**: 跳过数量（分页）
    - **limit**: 限制数量（分页）
    - **memory_type**: 记忆类型筛选（可选）
    - **min_importance**: 最小重要性筛选（可选）
    """
    return await memory_service.get_memories(
        db=db,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
        skip=skip,
        limit=limit,
        memory_type=memory_type,
        min_importance=min_importance,
    )


@router.post("/search", response_model=MemorySearchResponse, status_code=status.HTTP_200_OK)
async def search_memories(
    *,
    db: Session = Depends(get_db),
    search_request: MemorySearchRequest,
    current_user: User = Depends(get_current_active_user),
) -> MemorySearchResponse:
    """
    搜索记忆
    
    - **query**: 搜索查询
    - **memory_type**: 记忆类型筛选（可选）
    - **min_importance**: 最小重要性筛选（可选）
    - **top_k**: 返回数量
    """
    return await memory_service.search_memories(
        db=db,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
        search_request=search_request,
    )


@router.put("/{memory_id}", response_model=Memory, status_code=status.HTTP_200_OK)
async def update_memory(
    *,
    db: Session = Depends(get_db),
    memory_id: str,
    memory_in: MemoryUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Memory:
    """
    更新记忆
    
    - **memory_id**: 记忆 ID
    - **memory_type**: 新记忆类型（可选）
    - **content**: 新内容（可选）
    - **importance**: 新重要性评分（可选）
    - **expires_at**: 新过期时间（可选）
    """
    memory = await memory_service.update_memory(
        db=db,
        memory_id=memory_id,
        memory_in=memory_in,
        user_id=str(current_user.id),
    )
    
    if not memory:
        raise NotFoundException(
            resource="Memory",
            identifier=memory_id
        )
    
    app_logger.info(f"User {current_user.username} updated memory: {memory_id}")
    return memory


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    *,
    db: Session = Depends(get_db),
    memory_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    删除记忆
    
    - **memory_id**: 记忆 ID
    """
    memory = await memory_service.delete_memory(
        db=db,
        memory_id=memory_id,
        user_id=str(current_user.id),
    )
    
    if not memory:
        raise NotFoundException(
            resource="Memory",
            identifier=memory_id
        )
    
    app_logger.info(f"User {current_user.username} deleted memory: {memory_id}")


@router.get("/stats/summary", response_model=MemoryStats, status_code=status.HTTP_200_OK)
async def get_memory_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> MemoryStats:
    """
    获取记忆统计信息
    
    返回用户的记忆统计，包括总数、类型分布、平均重要性等
    """
    return await memory_service.get_stats(
        db=db,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
    )


@router.post("/cleanup", status_code=status.HTTP_200_OK)
async def cleanup_expired_memories(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    清理过期记忆
    
    删除所有已过期的记忆
    """
    count = await memory_service.cleanup_expired(
        db=db,
        tenant_id=str(current_user.tenant_id),
    )
    
    app_logger.info(f"User {current_user.username} cleaned up {count} expired memories")
    
    return {"message": f"Cleaned up {count} expired memories", "count": count}


@router.get("/short-term/{conversation_id}", status_code=status.HTTP_200_OK)
async def get_short_term_context(
    *,
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    获取对话的短期记忆上下文
    
    - **conversation_id**: 对话 ID
    """
    context = await memory_service.get_short_term_context(conversation_id)
    return {"conversation_id": conversation_id, "context": context}


@router.put("/short-term/{conversation_id}", status_code=status.HTTP_200_OK)
async def set_short_term_context(
    *,
    conversation_id: str,
    context: dict,
    current_user: User = Depends(get_current_active_user),
):
    """
    设置对话的短期记忆上下文
    
    - **conversation_id**: 对话 ID
    - **context**: 上下文数据
    """
    success = await memory_service.set_short_term_context(conversation_id, context)
    
    if not success:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set short-term context"
        )
    
    return {"message": "Short-term context set successfully"}
