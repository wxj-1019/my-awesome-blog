from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentUpdate


def get_comment(db: Session, comment_id: UUID, with_relationships: bool = False, include_deleted: bool = False) -> Optional[Comment]:
    query = db.query(Comment)
    if not include_deleted:
        query = query.filter(Comment.is_deleted == False)
    if with_relationships:
        from sqlalchemy.orm import joinedload
        query = query.options(joinedload(Comment.article)).options(joinedload(Comment.author))
    return query.filter(Comment.id == comment_id).first()


async def get_comment_async(db: Session, comment_id: UUID, with_relationships: bool = False) -> Optional[Comment]:
    """异步获取评论，带缓存功能和缓存穿透防护"""
    cache_key = CacheKeys.comment(comment_id)
    cached_comment = await cache_service.get(cache_key)

    if cached_comment is not None:
        # 检查是否为空值缓存
        if cached_comment is False:
            return None
        return cached_comment

    from sqlalchemy.orm import joinedload
    query = db.query(Comment)
    if with_relationships:
        query = query.options(joinedload(Comment.article)).options(joinedload(Comment.author))

    comment = query.filter(Comment.id == comment_id).first()

    if comment:
        # 缓存真实数据
        await cache_service.set(cache_key, comment, expire=CacheTTL.COMMENT)
    else:
        # 缓存空值,防止缓存穿透
        await cache_service.set(cache_key, False, expire=CacheTTL.VERY_SHORT)

    return comment


def get_comments_by_article(
    db: Session,
    article_id: UUID,
    skip: int = 0,
    limit: int = 100,
    approved_only: bool = True,
    with_relationships: bool = True,  # 默认为 True，防止 N+1 查询
):
    """
    获取文章的评论列表
    
    Args:
        with_relationships: 是否预加载关联数据（作者），
                           默认为 True 以防止 N+1 查询问题
    """
    from sqlalchemy.orm import joinedload
    
    query = db.query(Comment).filter(Comment.article_id == article_id)

    if approved_only:
        query = query.filter(Comment.is_approved == True)

    # Get top-level comments (no parent) first
    query = query.filter(Comment.parent_id.is_(None))

    # 默认预加载作者信息，避免 N+1 查询
    if with_relationships:
        query = query.options(joinedload(Comment.author))

    return query.order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()


def get_comments_by_author(
    db: Session,
    author_id: UUID,
    skip: int = 0,
    limit: int = 100,
    with_relationships: bool = True,  # 默认为 True，防止 N+1 查询
):
    """
    获取用户的评论列表
    
    Args:
        with_relationships: 是否预加载关联数据（文章），
                           默认为 True 以防止 N+1 查询问题
    """
    from sqlalchemy.orm import joinedload
    
    query = db.query(Comment).filter(Comment.author_id == author_id)

    # 默认预加载文章信息，避免 N+1 查询
    if with_relationships:
        query = query.options(joinedload(Comment.article))

    return query.order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()


def get_all_comments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    approved_only: Optional[bool] = None,
    with_relationships: bool = True,
):
    """
    获取所有评论列表（管理员用）
    
    Args:
        skip: 跳过的记录数
        limit: 返回的最大记录数
        approved_only: None 表示全部，True 表示只返回已审核，False 表示只返回未审核
        with_relationships: 是否预加载关联数据（文章和作者）
    """
    from sqlalchemy.orm import joinedload
    
    query = db.query(Comment)
    
    if approved_only is not None:
        query = query.filter(Comment.is_approved == approved_only)
    
    if with_relationships:
        query = query.options(
            joinedload(Comment.article),
            joinedload(Comment.author)
        )
    
    return query.order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()


def get_replies(db: Session, comment_id: UUID, skip: int = 0, limit: int = 100, with_relationships: bool = True):
    """
    获取评论的回复列表
    
    Args:
        with_relationships: 是否预加载关联数据（作者），
                           默认为 True 以防止 N+1 查询问题
    """
    from sqlalchemy.orm import joinedload
    
    query = db.query(Comment).filter(Comment.parent_id == comment_id)

    # 默认预加载作者信息，避免 N+1 查询
    if with_relationships:
        query = query.options(joinedload(Comment.author))

    return query.order_by(Comment.created_at.asc()).offset(skip).limit(limit).all()


def create_comment(db: Session, comment: CommentCreate, author_id: UUID) -> Comment:
    data = comment.model_dump()
    data["article_id"] = UUID(str(data["article_id"]))
    if data.get("parent_id") is not None:
        data["parent_id"] = UUID(str(data["parent_id"]))
    db_comment = Comment(
        **data,
        author_id=author_id,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def update_comment(db: Session, comment_id: UUID, comment_update: CommentUpdate) -> Optional[Comment]:
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return None

    update_data = comment_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_comment, field, value)

    db.commit()
    db.refresh(db_comment)
    return db_comment


async def update_comment_with_cache_clear(
    db: Session,
    comment_id: UUID,
    comment_update: CommentUpdate
) -> Optional[Comment]:
    """更新评论并清除相关缓存"""
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return None

    update_data = comment_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_comment, field, value)

    db.commit()
    db.refresh(db_comment)

    # 清除缓存
    cache_key = CacheKeys.comment(comment_id)
    await cache_service.delete(cache_key)

    # 清除文章评论列表缓存
    if db_comment.article_id:
        article_comments_key = CacheKeys.comment_list_by_article(
            db_comment.article_id,
            approved_only=True,
            skip=0,
            limit=100
        )
        await cache_service.delete(article_comments_key)

    return db_comment


def delete_comment(db: Session, comment_id: UUID) -> bool:
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return False

    db.delete(db_comment)
    db.commit()
    return True


async def delete_comment_with_cache_clear(db: Session, comment_id: UUID) -> bool:
    """删除评论并清除相关缓存"""
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return False

    article_id = db_comment.article_id
    db.delete(db_comment)
    db.commit()

    # 清除缓存
    cache_key = CacheKeys.comment(comment_id)
    await cache_service.delete(cache_key)

    # 清除文章评论列表缓存
    if article_id:
        article_comments_key = CacheKeys.comment_list_by_article(
            article_id,
            approved_only=True,
            skip=0,
            limit=100
        )
        await cache_service.delete(article_comments_key)

    return True


def approve_comment(db: Session, comment_id: UUID) -> Optional[Comment]:
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return None

    db_comment.is_approved = True  # type: ignore
    db.commit()
    db.refresh(db_comment)
    return db_comment


async def approve_comment_with_cache_clear(
    db: Session,
    comment_id: UUID
) -> Optional[Comment]:
    """批准评论并清除相关缓存"""
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return None

    db_comment.is_approved = True  # type: ignore
    db.commit()
    db.refresh(db_comment)

    # 清除缓存
    cache_key = CacheKeys.comment(comment_id)
    await cache_service.delete(cache_key)

    # 清除文章评论列表缓存
    if db_comment.article_id:
        article_comments_key = CacheKeys.comment_list_by_article(
            db_comment.article_id,
            approved_only=True,
            skip=0,
            limit=100
        )
        await cache_service.delete(article_comments_key)

    return db_comment