from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser, get_current_user_optional
from app import crud
from app.schemas.comment import Comment, CommentCreate, CommentUpdate, CommentWithAuthor
from app.models.user import User
from app.utils.permission_helpers import check_edit_permission, check_comment_delete_permission

router = APIRouter()


@router.get("/", response_model=List[CommentWithAuthor])
def read_comments(
    skip: int = 0,
    limit: int = 100,
    article_id: Optional[str] = Query(None, description="Filter by article ID"),
    author_id: Optional[str] = Query(None, description="Filter by author ID"),
    approved: Optional[bool] = Query(None, description="Filter by approval status (true=approved, false=pending, null=all for admin)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Any:
    """
    Retrieve comments
    
    - Regular users: must provide article_id or author_id filter, only see approved comments
    - Admin users: can list all comments without filters, can filter by approval status
    """
    from uuid import UUID

    if article_id:
        article_uuid = UUID(article_id)
        comments = crud.get_comments_by_article(
            db,
            article_id=article_uuid,
            skip=skip,
            limit=limit,
            approved_only=approved if approved is not None else True,
            with_relationships=True
        )
    elif author_id:
        author_uuid = UUID(author_id)
        comments = crud.get_comments_by_author(
            db,
            author_id=author_uuid,
            skip=skip,
            limit=limit,
            with_relationships=True
        )
    elif current_user and current_user.is_superuser:
        comments = crud.get_all_comments(
            db,
            skip=skip,
            limit=limit,
            approved_only=approved,
            with_relationships=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide either article_id or author_id filter",
        )

    return comments


@router.get("/{comment_id}", response_model=CommentWithAuthor)
def read_comment_by_id(
    comment_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a specific comment by id
    """
    from uuid import UUID
    comment_uuid = UUID(comment_id)
    comment = crud.get_comment(db, comment_id=comment_uuid, with_relationships=True)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    return comment


@router.get("/{comment_id}/replies", response_model=List[CommentWithAuthor])
def read_comment_replies(
    comment_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get replies to a comment
    """
    from uuid import UUID
    comment_uuid = UUID(comment_id)
    replies = crud.get_replies(db, comment_id=comment_uuid, skip=skip, limit=limit, with_relationships=True)
    return replies


@router.post("/", response_model=Comment)
def create_comment(
    *,
    db: Session = Depends(get_db),
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create new comment
    """
    comment = crud.create_comment(db, comment=comment_in, author_id=current_user.id)  # type: ignore
    return comment


@router.put("/{comment_id}", response_model=Comment)
def update_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: str,
    comment_in: CommentUpdate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update a comment
    """
    from uuid import UUID
    comment_uuid = UUID(comment_id)
    comment = crud.get_comment(db, comment_id=comment_uuid, with_relationships=True)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    # 使用统一的权限检查
    check_edit_permission(comment, current_user, superuser_bypass=True, resource_name="评论")

    comment = crud.update_comment(db, comment_id=comment_uuid, comment_update=comment_in)
    return comment


@router.delete("/{comment_id}", response_model=dict)
def delete_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Delete a comment
    """
    from sqlalchemy.orm import joinedload
    from uuid import UUID

    comment_uuid = UUID(comment_id)

    # Load comment with its article relationship to avoid N+1 queries
    comment = db.query(Comment).options(joinedload(Comment.article)).filter(Comment.id == comment_uuid).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    # 使用统一的权限检查（评论作者或文章作者可以删除）
    check_comment_delete_permission(comment, comment.article, current_user, resource_name="评论")

    deleted = crud.delete_comment(db, comment_id=comment_uuid)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    return {"message": "Comment deleted successfully"}


@router.post("/{comment_id}/approve", response_model=Comment)
def approve_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Approve a comment (admin or article author only)
    只能对已发布的文章批准评论
    """
    from sqlalchemy.orm import joinedload
    from uuid import UUID

    comment_uuid = UUID(comment_id)

    # First get the comment with its article relationship to avoid N+1 queries
    comment = db.query(Comment).options(joinedload(Comment.article)).filter(Comment.id == comment_uuid).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    # 使用统一的权限检查（文章作者或超级用户可以批准）
    from app.utils.permission_helpers import check_approve_permission
    check_approve_permission(comment.article, current_user, resource_name="评论")

    # 检查文章是否已发布 - 未发布的文章不能批准评论
    if not comment.article.is_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve comments on unpublished articles",
        )

    # Now approve the comment
    comment = crud.approve_comment(db, comment_id=comment_uuid)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    return comment


@router.post("/{comment_id}/reject", response_model=Comment)
def reject_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Reject a comment (admin or article author only)
    将评论标记为未审核状态
    """
    from sqlalchemy.orm import joinedload
    from uuid import UUID

    comment_uuid = UUID(comment_id)

    comment = db.query(Comment).options(joinedload(Comment.article)).filter(Comment.id == comment_uuid).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    from app.utils.permission_helpers import check_approve_permission
    check_approve_permission(comment.article, current_user, resource_name="评论")

    comment.is_approved = False  # type: ignore
    db.commit()
    db.refresh(comment)

    return comment