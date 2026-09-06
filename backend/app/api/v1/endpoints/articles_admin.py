"""文章管理端点（仅管理语义：删除 / 批量删除 / 批量发布 / 批量精选）

自 articles.py 拆出，路由经 v1 router 以 prefix="/articles" 挂载，
对外路径与拆分前完全一致。
"""

import asyncio
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app.models.article import Article as ArticleModel
from app.models.user import User
from app.utils.common_helpers import parse_uuid_list
from app.utils.logger import app_logger
from app.services.cache_service import cache_service
from app.utils.cache_keys import CacheKeys

router = APIRouter()


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
    await cache_service.delete(CacheKeys.article(article_id))
    
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
            await cache_service.delete(CacheKeys.article(article_id))
        for slug in slugs:
            await cache_service.delete(CacheKeys.article_by_slug(slug))

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
        # 注意：必须使用 ORM 模型 ArticleModel，顶部的 Article 是 Pydantic schema
        if current_user.is_superuser:
            query = db.query(ArticleModel).filter(ArticleModel.id.in_(article_uuids))
        else:
            query = db.query(ArticleModel).filter(
                ArticleModel.id.in_(article_uuids),
                ArticleModel.author_id == current_user.id  # type: ignore
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
            await cache_service.delete(CacheKeys.article_by_slug(slug))

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
        # 注意：必须使用 ORM 模型 ArticleModel，顶部的 Article 是 Pydantic schema
        articles = db.query(ArticleModel).filter(
            ArticleModel.id.in_(article_uuids)
        ).all()

        if not articles:
            return None, []

        updated_ids = [str(article.id) for article in articles]
        slugs = [article.slug for article in articles if article.slug]

        db.query(ArticleModel).filter(
            ArticleModel.id.in_(article_uuids)
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
            await cache_service.delete(CacheKeys.article_by_slug(slug))

    app_logger.info(f"批量{'设置精选' if featured else '取消精选'}完成: {len(updated_ids)} 篇文章, IDs: {updated_ids}")

    action = "设置精选" if featured else "取消精选"
    return {
        "message": f"成功{action} {len(updated_ids)} 篇文章",
        "updated_count": len(updated_ids),
        "updated_ids": updated_ids
    }