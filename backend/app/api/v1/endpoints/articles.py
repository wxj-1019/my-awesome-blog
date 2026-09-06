import asyncio
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, status, Query, Request, HTTPException
from app.exceptions import (
    NotFoundException,
    ValidationException,
    ConflictException,
    InternalServerException,
)
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import (
    get_current_active_user,
    get_current_superuser,
    get_current_user_optional,
)
from app import crud
from app.schemas.article import Article, ArticleCreate, ArticleUpdate, ArticleWithAuthor
from app.schemas.pagination import Page
from app.models.article import Article as ArticleModel
from app.models.user import User
from uuid import UUID
from app.services.cache_service import cache_service
from app.utils.pagination import CursorPaginationParams
from app.utils.common_helpers import parse_uuid_list
from app.utils.cache_keys import CacheKeys
from app.utils.logger import app_logger
from app.utils.rate_limit import article_create_rate_limit, article_read_rate_limit

router = APIRouter()


@router.get("/", response_model=Page[ArticleWithAuthor])
@article_read_rate_limit
async def read_articles(
    request: Request,
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum 100 items per request"),
    published_only: bool = Query(True, description="Only return published articles"),
    author_id: Optional[str] = Query(None, description="Filter by author ID"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    tag_id: Optional[str] = Query(None, description="Filter by tag ID"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve articles（热路径：同步查询放 to_thread）。

    返回分页信封 `{items, total, skip, limit}`：调用方需要 total 才能算出总页数，
    原先直接返回数组导致前端只能拿当前页长度当 total、翻页恒为 1 页。
    """
    author_ids = [author_id] if author_id else None
    category_ids = [category_id] if category_id else None
    tag_ids = [tag_id] if tag_id else None

    filters = dict(
        author_ids=author_ids,
        category_ids=category_ids,
        tag_ids=tag_ids,
        search=search,
        published_only=published_only,
    )

    def _query_page():
        """列表与计数在同一线程内完成，避免两次 to_thread 往返。"""
        items = crud.get_articles_by_multiple_filters(db, limit=limit, offset=skip, **filters)
        total = crud.count_articles_by_multiple_filters(db, **filters)
        return items, total

    items, total = await asyncio.to_thread(_query_page)

    return Page[ArticleWithAuthor](items=items, total=total, skip=skip, limit=limit)


@router.post("/", response_model=Article)
@article_create_rate_limit
async def create_article(
    request: Request,
    *,
    db: Session = Depends(get_db),
    article_in: ArticleCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Create new article（slug 检查 + 写入走 to_thread）。"""

    def _create_sync() -> ArticleModel:
        existing = crud.get_article_by_slug(db, slug=article_in.slug)
        if existing:
            raise ConflictException(
                resource="Article",
                field="slug",
                value=article_in.slug,
            )
        return crud.create_article(
            db, article=article_in, author_id=current_user.id  # type: ignore
        )

    article = await asyncio.to_thread(_create_sync)
    await cache_service.delete(CacheKeys.article_by_slug(article_in.slug))
    return article


@router.get("/featured", response_model=List[ArticleWithAuthor])
@article_read_rate_limit
async def read_featured_articles(
    request: Request,
    limit: int = Query(10, ge=1, le=50, description="Number of featured articles to return"),
    db: Session = Depends(get_db)
) -> Any:
    """Get featured/pinned articles."""
    return await asyncio.to_thread(crud.get_featured_articles, db, limit=limit)


@router.get("/popular", response_model=List[ArticleWithAuthor])
@article_read_rate_limit
async def read_popular_articles(
    request: Request,
    limit: int = Query(10, ge=1, le=50, description="Number of popular articles to return"),
    days: int = Query(30, ge=1, description="Number of days to consider for popularity calculation"),
    db: Session = Depends(get_db)
) -> Any:
    """Get popular articles based on views in recent days."""
    try:
        app_logger.info(f"Fetching popular articles: limit={limit}, days={days}")
        articles = await asyncio.to_thread(
            crud.get_popular_articles_optimized, db, limit=limit, days=days
        )
        app_logger.info(f"Successfully fetched {len(articles)} popular articles")
        return articles
    except Exception as e:
        app_logger.error(f"Error fetching popular articles: {e}", exc_info=True)
        raise InternalServerException(
            message=f"Failed to fetch popular articles: {str(e)}"
        )


@router.get("/recommended", response_model=List[ArticleWithAuthor])
@article_read_rate_limit
async def read_recommended_articles(
    request: Request,
    limit: int = Query(10, ge=1, le=50, description="Number of recommended articles to return"),
    db: Session = Depends(get_db)
) -> Any:
    """Get recommended articles (published, by view count)."""

    def _recommended() -> list:
        from sqlalchemy.orm import joinedload
        return (
            db.query(ArticleModel)
            .options(joinedload(ArticleModel.author))
            .options(joinedload(ArticleModel.categories))
            .options(joinedload(ArticleModel.tags))
            .filter(ArticleModel.is_published == True)  # noqa: E712
            .order_by(ArticleModel.view_count.desc())
            .limit(limit)
            .all()
        )

    return await asyncio.to_thread(_recommended)


@router.get("/search", response_model=List[ArticleWithAuthor])
@article_read_rate_limit
async def search_articles(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    category_slug: Optional[str] = Query(None, description="Filter by category slug"),
    tag_slug: Optional[str] = Query(None, description="Filter by tag slug"),
    author_id: Optional[str] = Query(None, description="Filter by author ID"),
    published_only: bool = Query(True, description="Only return published articles"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum 100 items per request"),
    db: Session = Depends(get_db)
) -> Any:
    """Search articles by query string with optional filters."""

    def _search() -> list:
        category_id = None
        if category_slug:
            category = crud.get_category_by_slug(db, category_slug)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found",
                )
            category_id = category.id

        tag_id = None
        if tag_slug:
            tag = crud.get_tag_by_slug(db, tag_slug)
            if not tag:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tag not found",
                )
            tag_id = tag.id

        author_uuid = UUID(author_id) if author_id else None
        return crud.get_articles(
            db,
            skip=skip,
            limit=limit,
            published_only=published_only,
            author_id=author_uuid,
            search=q,
            category_id=category_id,
            tag_id=tag_id,
        )

    return await asyncio.to_thread(_search)


def _can_view_article(article: Any, current_user: Optional[User]) -> bool:
    """已发布文章所有人可见；草稿仅作者本人或超级管理员可见。"""
    if article.is_published:
        return True
    if current_user is None:
        return False
    return bool(
        current_user.is_superuser or article.author_id == current_user.id
    )


@router.get("/slug/{slug}", response_model=ArticleWithAuthor)
async def read_article_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Any:
    """
    Get a specific article by slug
    """
    article = await crud.get_article_by_slug_with_relationships_async(db, slug=slug)
    # 草稿对匿名/非作者返回 404，避免泄露草稿存在性
    if not article or not _can_view_article(article, current_user):
        raise NotFoundException(
            resource="Article",
            identifier=slug
        )

    # Increment view count
    await crud.increment_view_count(db, article_id=article.id)  # type: ignore

    return article


@router.get("/related/{article_id}", response_model=List[ArticleWithAuthor])
async def read_related_articles(
    article_id: str,
    limit: int = Query(5, ge=1, le=20, description="Number of related articles to return"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get articles related to a specific article
    """
    article_uuid = UUID(article_id)
    article = await crud.get_article_async(db, article_id=article_uuid)
    if not article:
        raise NotFoundException(
            resource="Article",
            identifier=article_id
        )

    return await asyncio.to_thread(
        crud.get_related_articles, db, article_id=article_uuid, limit=limit
    )


@router.get("/cursor-paginated", response_model=dict)
async def read_articles_cursor_paginated(
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    published_only: bool = Query(True, description="Only return published articles"),
    author_id: Optional[str] = Query(None, description="Filter by author ID"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve articles with cursor-based pagination
    """
    from uuid import UUID
    
    # Parse parameters
    cursor_params = CursorPaginationParams(cursor=cursor, limit=limit)
    author_uuid = UUID(author_id) if author_id else None
    
    # Perform cursor-based pagination
    result = await crud.get_articles_with_cursor_pagination(
        db=db,
        cursor_params=cursor_params,
        published_only=published_only,
        author_id=author_uuid,
        search=search
    )
    
    return {
        "items": [ArticleWithAuthor.model_validate(item) for item in result.items],
        "next_cursor": result.next_cursor,
        "has_more": result.has_more
    }


@router.get("/search-fulltext", response_model=List[ArticleWithAuthor])
async def search_articles_fulltext(
    search_query: str = Query(..., min_length=1, max_length=100, description="Fulltext search query"),
    published_only: bool = Query(True, description="Only return published articles"),
    skip: int = 0,
    limit: int = Query(100, le=100, description="Max limit is 100"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Search articles using PostgreSQL fulltext search
    """
    return await asyncio.to_thread(
        crud.search_articles_fulltext,
        db,
        search_query=search_query,
        published_only=published_only,
        skip=skip,
        limit=limit,
    )


@router.get("/{article_id}", response_model=ArticleWithAuthor)
async def read_article_by_id(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Any:
    """
    Get a specific article by id
    """
    article_uuid = UUID(article_id)

    # Increment view count and get updated article with relationships
    article = await crud.increment_view_count(db, article_id=article_uuid)
    # 草稿对匿名/非作者返回 404，避免泄露草稿存在性
    if not article or not _can_view_article(article, current_user):
        raise NotFoundException(
            resource="Article",
            identifier=article_id
        )

    return article


@router.put("/{article_id}", response_model=Article)
async def update_article(
    article_id: str,
    article_update: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update an article（仅作者本人或超级管理员可修改）
    """
    article_uuid = UUID(article_id)

    # 先查出原文章做归属校验与 slug 冲突检查
    existing = await asyncio.to_thread(crud.get_article, db, article_uuid)
    if not existing:
        raise NotFoundException(
            resource="Article",
            identifier=article_id
        )
    if existing.author_id != current_user.id and not current_user.is_superuser:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有权限修改该文章",
        )
    old_slug = existing.slug

    # slug 变更时检查唯一性，避免触发数据库唯一约束 500
    if article_update.slug and article_update.slug != old_slug:
        slug_taken = await asyncio.to_thread(
            crud.get_article_by_slug, db, slug=article_update.slug
        )
        if slug_taken:
            raise ConflictException(
                resource="Article",
                field="slug",
                value=article_update.slug,
            )

    article = await crud.update_article(db, article_id=article_uuid, article_update=article_update)
    if not article:
        raise NotFoundException(
            resource="Article",
            identifier=article_id
        )

    # Clear related caches（含旧 slug，避免旧链接继续命中过期缓存）
    await cache_service.delete(CacheKeys.article(article_id))
    if old_slug:
        await cache_service.delete(CacheKeys.article_by_slug(old_slug))
    if hasattr(article_update, 'slug') and article_update.slug:
        await cache_service.delete(CacheKeys.article_by_slug(article_update.slug))

    return article
