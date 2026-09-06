"""用户互动端点：文章点赞 / 收藏 / 关注作者。

所有写操作均为开关语义（toggle），返回操作后的状态；状态查询供前端
挂载时回显。与既有路由分离，经 v1 router 挂载（前缀见 router.py）。
"""

import asyncio
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_user_optional
from app.crud import interaction as interaction_crud
from app.models.user import User
from app.services.cache_service import cache_service
from app.utils.cache_keys import CacheKeys
from app.utils.rate_limit import interaction_rate_limit

router = APIRouter()


def _uuid(value: str, name: str) -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{name} not found",
        ) from exc


# ---------- 文章点赞 ----------

@router.get("/articles/{article_id}/like")
def get_like_status(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
) -> Any:
    """当前用户对该文章的点赞状态（匿名返回 false）"""
    if not current_user:
        return {"liked": False}
    liked = interaction_crud.is_article_liked(db, _uuid(article_id, "Article"), current_user.id)
    return {"liked": liked}


@interaction_rate_limit
@router.post("/articles/{article_id}/like")
async def toggle_like(
    request: Request,
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """切换点赞状态（已赞则取消），返回操作后的状态与最新计数"""
    aid = _uuid(article_id, "Article")
    if not interaction_crud.article_exists(db, aid):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    liked = await asyncio.to_thread(interaction_crud.toggle_article_like, db, aid, current_user.id)

    # likes_count 为 Article 的 column_property，查询实体时自动带出；
    # 计数已烘焙进详情缓存（TTL 30 分钟），toggle 后必须失效，否则前端
    # 会持续读到旧计数，且期间的文章编辑会把旧计数重新写回缓存
    from app.models.article import Article
    article = await asyncio.to_thread(lambda: db.query(Article).filter(Article.id == aid).first())
    if article:
        await cache_service.delete(CacheKeys.article(aid))
        if article.slug:
            await cache_service.delete(CacheKeys.article_by_slug(article.slug))
    return {"liked": liked, "likes_count": article.likes_count if article else 0}


# ---------- 文章收藏 ----------

@router.get("/articles/{article_id}/bookmark")
def get_bookmark_status(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
) -> Any:
    if not current_user:
        return {"bookmarked": False}
    bookmarked = interaction_crud.is_article_bookmarked(db, _uuid(article_id, "Article"), current_user.id)
    return {"bookmarked": bookmarked}


@interaction_rate_limit
@router.post("/articles/{article_id}/bookmark")
async def toggle_bookmark(
    request: Request,
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    aid = _uuid(article_id, "Article")
    if not interaction_crud.article_exists(db, aid):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    bookmarked = await asyncio.to_thread(interaction_crud.toggle_article_bookmark, db, aid, current_user.id)
    return {"bookmarked": bookmarked}


# ---------- 关注作者 ----------

@router.get("/users/{user_id}/follow")
def get_follow_status(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
) -> Any:
    if not current_user:
        return {"following": False}
    following = interaction_crud.is_following(db, current_user.id, _uuid(user_id, "User"))
    return {"following": following}


@interaction_rate_limit
@router.post("/users/{user_id}/follow")
async def toggle_follow(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """关注 / 取消关注目标用户；不能关注自己，目标不存在返回 404"""
    target_id = _uuid(user_id, "User")
    if target_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能关注自己")
    if not interaction_crud.user_exists(db, target_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    following = await asyncio.to_thread(interaction_crud.toggle_follow, db, current_user.id, target_id)
    return {"following": following}
