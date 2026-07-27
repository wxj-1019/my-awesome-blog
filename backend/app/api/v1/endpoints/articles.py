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
from app.core.dependencies import get_current_active_user, get_current_superuser
from app import crud
from app.schemas.article import Article, ArticleCreate, ArticleUpdate, ArticleWithAuthor
from app.schemas.pagination import Page
from app.models.article import Article as ArticleModel
from app.models.user import User
from uuid import UUID
from app.services.cache_service import cache_service
from app.utils.pagination import CursorPaginationParams
from app.utils.db_utils import (
    get_articles_by_multiple_filters,
    count_articles_by_multiple_filters,
    get_popular_articles_optimized,
)
from app.utils.common_helpers import parse_uuid_list
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
        items = get_articles_by_multiple_filters(db, limit=limit, offset=skip, **filters)
        total = count_articles_by_multiple_filters(db, **filters)
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
    await cache_service.delete(f"article:slug:{article_in.slug}")
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


@router.get("/test-public")
def test_public():
    """
    Test public endpoint in articles route
    """
    return {"message": "This is a test public endpoint in articles route", "status": "success"}


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
            get_popular_articles_optimized, db, limit=limit, days=days
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
        return (
            db.query(ArticleModel)
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
        return crud.get_articles_with_categories_and_tags(
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


@router.get("/slug/{slug}", response_model=ArticleWithAuthor)
async def read_article_by_slug(
    slug: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a specific article by slug
    """
    article = await crud.get_article_by_slug_with_relationships_async(db, slug=slug)
    if not article:
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
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a specific article by id
    """
    article_uuid = UUID(article_id)

    # Increment view count and get updated article with relationships
    article = await crud.increment_view_count(db, article_id=article_uuid)
    if not article:
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
    Update an article
    """
    article_uuid = UUID(article_id)
    article = await crud.update_article(db, article_id=article_uuid, article_update=article_update)
    if not article:
        raise NotFoundException(
            resource="Article",
            identifier=article_id
        )
    
    # Clear related caches
    await cache_service.delete(f"article:{article_id}")
    if hasattr(article_update, 'slug') and article_update.slug:
        await cache_service.delete(f"article:slug:{article_update.slug}")
    
    return article


@router.delete("/{article_id}", response_model=dict)
async def delete_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)  # Only superusers can delete
) -> Any:
    """
    Delete an article
    """
    article_uuid = UUID(article_id)
    success = await crud.delete_article(db, article_id=article_uuid)
    if not success:
        raise NotFoundException(
            resource="Article",
            identifier=article_id
        )
    
    # Clear related caches
    await cache_service.delete(f"article:{article_id}")
    
    return {"message": "Article deleted successfully"}


@router.post("/batch/delete", response_model=dict)
async def batch_delete_articles(
    article_ids: list[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)  # 只有超级管理员可以批量删除
) -> Any:
    """
    批量删除文章
    只能删除当前用户有权限的文章
    """
    # 使用统一的UUID解析和验证
    article_uuids = parse_uuid_list(
        article_ids,
        max_count=100,
        error_detail_count="一次最多可以删除100篇文章"
    )

    app_logger.info(f"批量删除文章: {len(article_uuids)} 篇, 操作者: {current_user.username}")

    def _delete_articles_sync():
        articles = db.query(ArticleModel).filter(
            ArticleModel.id.in_(article_uuids)
        ).all()

        if not articles:
            return None, [], []

        slugs = [article.slug for article in articles if article.slug]
        deleted_ids = [str(article.id) for article in articles]

        deleted_count = db.query(ArticleModel).filter(
            ArticleModel.id.in_(article_uuids)
        ).delete(synchronize_session=False)

        db.commit()
        return deleted_count, slugs, deleted_ids

    deleted_count, slugs, deleted_ids = await asyncio.to_thread(_delete_articles_sync)

    if deleted_count is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到任何文章"
        )

    # 批量清除缓存
    if deleted_ids:
        # 精确删除每篇文章的缓存，避免使用通配符误伤其他缓存
        for article_id in deleted_ids:
            await cache_service.delete(f"article:{article_id}")
        for slug in slugs:
            await cache_service.delete(f"article:slug:{slug}")

    app_logger.info(f"批量删除完成: {deleted_count} 篇文章, IDs: {deleted_ids}")

    return {
        "message": f"成功删除 {deleted_count} 篇文章",
        "deleted_count": deleted_count,
        "deleted_ids": deleted_ids
    }


@router.post("/batch/publish", response_model=dict)
async def batch_publish_articles(
    article_ids: list[str],
    publish: bool = Query(..., description="True: 发布, False: 取消发布"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # 需要登录
) -> Any:
    """
    批量发布或取消发布文章
    只能操作当前用户的文章（除非是超级管理员）
    """
    from datetime import datetime, timezone

    # 使用统一的UUID解析和验证
    article_uuids = parse_uuid_list(
        article_ids,
        max_count=100,
        error_detail_count="一次最多可以操作100篇文章"
    )

    app_logger.info(f"批量{'发布' if publish else '取消发布'}文章: {len(article_uuids)} 篇, 操作者: {current_user.username}")

    def _publish_articles_sync():
        if current_user.is_superuser:
            query = db.query(Article).filter(Article.id.in_(article_uuids))
        else:
            query = db.query(Article).filter(
                Article.id.in_(article_uuids),
                Article.author_id == current_user.id  # type: ignore
            )

        articles = query.all()

        if not articles:
            return None, [], []

        updated_count = 0
        updated_ids = []
        slugs = []
        current_time = datetime.now(timezone.utc)

        for article in articles:
            old_status = article.is_published  # type: ignore

            if publish:
                if not old_status:
                    article.is_published = True  # type: ignore
                    article.published_at = current_time  # type: ignore
                    updated_count += 1
                    updated_ids.append(str(article.id))
                    if article.slug:
                        slugs.append(article.slug)
            else:
                if old_status:
                    article.is_published = False  # type: ignore
                    article.published_at = None  # type: ignore
                    updated_count += 1
                    updated_ids.append(str(article.id))
                    if article.slug:
                        slugs.append(article.slug)

        db.commit()
        return updated_count, updated_ids, slugs

    result = await asyncio.to_thread(_publish_articles_sync)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到任何文章或没有权限操作这些文章"
        )
    updated_count, updated_ids, slugs = result

    # 批量清除缓存
    if updated_ids:
        await cache_service.delete_pattern("article:*")
        for slug in slugs:
            await cache_service.delete(f"article:slug:{slug}")

    app_logger.info(f"批量{'发布' if publish else '取消发布'}完成: {updated_count} 篇文章, IDs: {updated_ids}")

    action = "发布" if publish else "取消发布"
    return {
        "message": f"成功{action} {updated_count} 篇文章",
        "updated_count": updated_count,
        "updated_ids": updated_ids
    }


@router.post("/batch/featured", response_model=dict)
async def batch_set_featured_articles(
    article_ids: list[str],
    featured: bool = Query(..., description="True: 设为精选, False: 取消精选"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)  # 只有超级管理员可以设置精选
) -> Any:
    """
    批量设置或取消精选文章
    """
    # 使用统一的UUID解析和验证
    article_uuids = parse_uuid_list(
        article_ids,
        max_count=100,
        error_detail_count="一次最多可以操作100篇文章"
    )

    app_logger.info(f"批量{'设置精选' if featured else '取消精选'}文章: {len(article_uuids)} 篇, 操作者: {current_user.username}")

    def _feature_articles_sync():
        articles = db.query(Article).filter(
            Article.id.in_(article_uuids)
        ).all()

        if not articles:
            return None, []

        updated_ids = [str(article.id) for article in articles]
        slugs = [article.slug for article in articles if article.slug]

        db.query(Article).filter(
            Article.id.in_(article_uuids)
        ).update(
            {"is_featured": featured},
            synchronize_session=False
        )

        db.commit()
        return updated_ids, slugs

    result = await asyncio.to_thread(_feature_articles_sync)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到任何文章"
        )
    updated_ids, slugs = result

    # 批量清除缓存
    if updated_ids:
        await cache_service.delete_pattern("article:*")
        for slug in slugs:
            await cache_service.delete(f"article:slug:{slug}")

    app_logger.info(f"批量{'设置精选' if featured else '取消精选'}完成: {len(updated_ids)} 篇文章, IDs: {updated_ids}")

    action = "设置精选" if featured else "取消精选"
    return {
        "message": f"成功{action} {len(updated_ids)} 篇文章",
        "updated_count": len(updated_ids),
        "updated_ids": updated_ids
    }