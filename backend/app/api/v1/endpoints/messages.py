from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user_optional, get_current_active_user, get_current_superuser
from app import crud
from app.schemas.message import (
    Message, MessageCreate, MessageUpdate,
    MessageWithAuthor, MessageWithReplies
)
from app.models.user import User
from app.utils.rate_limit import message_create_rate_limit
from uuid import UUID
from app.utils.common_helpers import parse_uuid
from app.utils.permission_helpers import check_edit_permission, check_delete_permission
from app.utils.logger import app_logger

router = APIRouter()


@router.get("/", response_model=List[MessageWithAuthor])
def read_messages(
    skip: int = 0,
    limit: int = Query(100, ge=1, le=100),
    danmaku_only: bool = Query(False, description="Only return danmaku messages"),
    author_id: Optional[str] = Query(None, description="Filter by author ID"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve messages
    """
    if author_id:
        author_uuid = UUID(author_id)
        messages = crud.get_messages_by_author(
            db,
            author_id=author_uuid,
            skip=skip,
            limit=limit,
            with_relationships=True
        )
    else:
        messages = crud.get_messages(
            db,
            skip=skip,
            limit=limit,
            danmaku_only=danmaku_only,
            with_relationships=True
        )
    return messages


@router.get("/danmaku", response_model=List[MessageWithAuthor])
def read_danmaku_messages(
    limit: int = Query(50, ge=1, le=100, description="Number of danmaku messages to return"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get random danmaku messages for display
    """
    messages = crud.get_danmaku_messages(
        db,
        limit=limit,
        with_relationships=True
    )
    return messages


@router.post("/", response_model=Message)
@message_create_rate_limit
def create_message(
    request: Request,
    *,
    db: Session = Depends(get_db),
    message_in: MessageCreate,
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Any:
    """
    Create new message

    登录用户以账号身份发布；游客可用昵称匿名留言（author_id 为空）。
    """
    # 游客留言：昵称留空时给默认值，避免显示空名
    author_id = current_user.id if current_user else None
    if not current_user and not (message_in.nickname or "").strip():
        message_in.nickname = "匿名游客"
    message = crud.create_message(
        db,
        message=message_in,
        author_id=author_id
    )
    operator = current_user.username if current_user else (message.nickname or "匿名游客")
    app_logger.info(f"创建留言成功: {message.id}, 操作者: {operator}")
    return message


@router.get("/trending", response_model=List[MessageWithAuthor])
def read_trending_messages(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get trending messages (most liked)
    """
    try:
        messages = crud.get_trending_messages(
            db,
            limit=limit,
            with_relationships=True
        )
        return messages
    except Exception as e:
        app_logger.error(f"Error getting trending messages: {e}")
        raise


@router.get("/stats/activity", response_model=List[Dict[str, Any]])
def read_message_activity(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get message activity statistics for the last N days
    """
    try:
        stats = crud.get_message_activity(
            db,
            days=days
        )
        return stats
    except Exception as e:
        app_logger.error(f"Error getting message activity: {e}")
        raise


@router.get("/{message_id}", response_model=MessageWithAuthor)
def read_message_by_id(
    message_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a specific message by id
    """
    message_uuid = parse_uuid(message_id, error_detail="Invalid message ID format")

    message = crud.get_message(db, message_id=message_uuid, with_relationships=True)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    return message


@router.get("/{message_id}/replies", response_model=List[MessageWithAuthor])
def read_message_replies(
    message_id: str,
    skip: int = 0,
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get replies to a message
    """
    message_uuid = parse_uuid(message_id, error_detail="Invalid message ID format")

    message = crud.get_message(db, message_id=message_uuid)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    replies = crud.get_replies(
        db,
        message_id=message_uuid,
        skip=skip,
        limit=limit,
        with_relationships=True
    )
    return replies


@router.put("/{message_id}", response_model=Message)
def update_message(
    *,
    db: Session = Depends(get_db),
    message_id: str,
    message_in: MessageUpdate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update a message
    """
    message_uuid = parse_uuid(message_id, error_detail="Invalid message ID format")

    message = crud.get_message(db, message_id=message_uuid)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    # 使用统一的权限检查
    check_edit_permission(message, current_user, superuser_bypass=True, resource_name="留言")

    message = crud.update_message(db, message_id=message_uuid, message_update=message_in)
    app_logger.info(f"更新留言: {message_id}, 操作者: {current_user.username}")
    return message


@router.delete("/{message_id}", response_model=dict)
def delete_message(
    *,
    db: Session = Depends(get_db),
    message_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Delete a message (soft delete)
    """
    message_uuid = parse_uuid(message_id, error_detail="Invalid message ID format")

    message = crud.get_message(db, message_id=message_uuid)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    # 使用统一的权限检查
    check_delete_permission(message, current_user, superuser_bypass=True, resource_name="留言")

    deleted = crud.delete_message(db, message_id=message_uuid)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    app_logger.info(f"删除留言: {message_id}, 操作者: {current_user.username}")
    return {"message": "Message deleted successfully"}


@router.post("/{message_id}/like", response_model=Message)
def like_message(
    message_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Like a message (public, no login required)
    """
    message_uuid = parse_uuid(message_id, error_detail="Invalid message ID format")

    message = crud.like_message(db, message_id=message_uuid)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    return message


@router.post("/{message_id}/unlike", response_model=Message)
def unlike_message(
    message_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Unlike a message (public, no login required)
    """
    message_uuid = parse_uuid(message_id, error_detail="Invalid message ID format")

    message = crud.unlike_message(db, message_id=message_uuid)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    return message


@router.delete("/{message_id}/hard", response_model=dict)
def hard_delete_message(
    *,
    db: Session = Depends(get_db),
    message_id: str,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Hard delete a message (admin only)
    """
    message_uuid = parse_uuid(message_id, error_detail="Invalid message ID format")

    message = crud.get_message(db, message_id=message_uuid)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    deleted = crud.hard_delete_message(db, message_id=message_uuid)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    app_logger.info(f"永久删除留言: {message_id}, 操作者: {current_user.username}")
    return {"message": "Message permanently deleted"}
