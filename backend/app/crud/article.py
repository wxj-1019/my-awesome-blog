from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models.article import Article
from app.schemas.article import ArticleCreate, ArticleUpdate, ArticleWithAuthor
from app.services.cache_service import cache_service, cache_get_or_set
from app.utils.pagination import CursorPaginationParams, CursorPaginationResult
from app.utils.cache_keys import CacheKeys, CacheTTL
from sqlalchemy import text


def get_article(db: Session, article_id: UUID) -> Optional[Article]:
    return db.query(Article).filter(Article.id == article_id).first()


def _article_to_cache(article: Article) -> dict:
    """将 ORM 对象序列化为可缓存的 dict。

    缓存层是 JSON 序列化，直接存 ORM 实例会被 default=str 转成 repr 字符串，
    命中缓存后再访问 .id 等属性会 AttributeError。统一走 Pydantic schema 序列化。
    """
    return ArticleWithAuthor.model_validate(article).model_dump(mode="json")


def _article_from_cache(data: dict) -> ArticleWithAuthor:
    """从缓存 dict 还原为 Pydantic 对象（端点可直接读取 .id 等属性并作为响应返回）。"""
    return ArticleWithAuthor.model_validate(data)


async def get_article_async(db: Session, article_id: UUID) -> Optional[Article]:
    """异步获取文章，带缓存功能和缓存穿透防护"""
    cache_key = CacheKeys.article(article_id)
    cached_article = await cache_service.get(cache_key)

    if cached_article is not None:
        # 检查是否为空值缓存(用于缓存穿透防护)
        if cached_article is False:  # 使用False标记空值
            return None
        return _article_from_cache(cached_article)

    from sqlalchemy.orm import joinedload
    article = (
        db.query(Article)
        .options(joinedload(Article.author))
        .options(joinedload(Article.categories))
        .options(joinedload(Article.tags))
        .filter(Article.id == article_id)
        .first()
    )

    if article:
        # 缓存真实数据（序列化为 dict，不缓存 ORM 实例）
        await cache_service.set(cache_key, _article_to_cache(article), expire=CacheTTL.ARTICLE)
    else:
        # 缓存空值,防止缓存穿透(使用False标记,60秒过期)
        await cache_service.set(cache_key, False, expire=CacheTTL.VERY_SHORT)

    return article


def get_article_with_relationships(db: Session, article_id: UUID) -> Optional[Article]:
    from sqlalchemy.orm import joinedload
    return (
        db.query(Article)
        .options(joinedload(Article.author))
        .options(joinedload(Article.categories))
        .options(joinedload(Article.tags))
        .filter(Article.id == article_id)
        .first()
    )


def get_article_by_slug(db: Session, slug: str) -> Optional[Article]:
    return db.query(Article).filter(Article.slug == slug).first()


def get_article_by_slug_with_relationships(db: Session, slug: str) -> Optional[Article]:
    from sqlalchemy.orm import joinedload
    return (
        db.query(Article)
        .options(joinedload(Article.author))
        .options(joinedload(Article.categories))
        .options(joinedload(Article.tags))
        .filter(Article.slug == slug)
        .first()
    )


async def get_article_by_slug_with_relationships_async(db: Session, slug: str) -> Optional[Article]:
    """异步获取文章，带缓存和关系数据,以及缓存穿透防护"""
    cache_key = CacheKeys.article_by_slug(slug)
    cached_article = await cache_service.get(cache_key)

    if cached_article is not None:
        # 检查是否为空值缓存
        if cached_article is False:
            return None
        return _article_from_cache(cached_article)

    from sqlalchemy.orm import joinedload
    article = (
        db.query(Article)
        .options(joinedload(Article.author))
        .options(joinedload(Article.categories))
        .options(joinedload(Article.tags))
        .filter(Article.slug == slug)
        .first()
    )

    if article:
        await cache_service.set(cache_key, _article_to_cache(article), expire=CacheTTL.ARTICLE)
    else:
        # 缓存空值,防止缓存穿透
        await cache_service.set(cache_key, False, expire=CacheTTL.VERY_SHORT)

    return article


def get_articles(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    published_only: bool = True,
    author_id: Optional[UUID] = None,
    search: Optional[str] = None,
    order_by_views: bool = False,
    category_id: Optional[UUID] = None,
    tag_id: Optional[UUID] = None,
    with_relationships: bool = True,  # 默认预加载关联数据，防止 N+1 查询
):
    """
    获取文章列表
    
    Args:
        with_relationships: 是否预加载关联数据（作者、分类、标签），
                           默认为 True 以防止 N+1 查询问题
    """
    from sqlalchemy.orm import joinedload
    
    # 使用 joinedload 预加载关联数据，避免 N+1 查询
    if with_relationships:
        query = db.query(Article).options(
            joinedload(Article.author),
            joinedload(Article.categories),
            joinedload(Article.tags)
        )
    else:
        query = db.query(Article)
    
    if published_only:
        query = query.filter(Article.is_published == True)
    
    if author_id is not None:
        query = query.filter(Article.author_id == author_id)
    
    if search:
        search_filter = or_(
            Article.title.ilike(f"%{search}%"),
            Article.content.ilike(f"%{search}%"),
            Article.excerpt.ilike(f"%{search}%"),
        )
        query = query.filter(search_filter)
    
    # Filter by category if provided
    if category_id is not None:
        from app.models.article_category import ArticleCategory
        query = query.join(ArticleCategory).filter(ArticleCategory.category_id == category_id)
    
    # Filter by tag if provided
    if tag_id is not None:
        from app.models.article_tag import ArticleTag
        query = query.join(ArticleTag).filter(ArticleTag.tag_id == tag_id)
    
    # Order by views or by creation date
    if order_by_views:
        query = query.order_by(Article.view_count.desc(), Article.created_at.desc())
    else:
        query = query.order_by(Article.created_at.desc())
    
    return query.offset(skip).limit(limit).all()


def create_article(db: Session, article: ArticleCreate, author_id: UUID) -> Article:
    from app.models.tag import Tag
    from app.models.category import Category
    from app.models.article_tag import ArticleTag
    from app.models.article_category import ArticleCategory

    db_article = Article(
        **article.model_dump(exclude={'tags', 'category_id'}),
        author_id=author_id,
    )

    # Set published_at if article is published
    if article.is_published:
        db_article.published_at = datetime.now(timezone.utc)  # type: ignore

    db.add(db_article)
    db.flush()  # Get the ID without committing

    # Associate category
    if article.category_id:
        category = db.query(Category).filter(Category.id == article.category_id).first()
        if category:
            article_category = ArticleCategory(
                article_id=db_article.id,
                category_id=category.id,
                is_primary=True
            )
            db.add(article_category)

    # Associate tags
    if article.tags:
        for tag_id in article.tags:
            tag = db.query(Tag).filter(Tag.id == tag_id).first()
            if tag:
                article_tag = ArticleTag(article_id=db_article.id, tag_id=tag.id)
                db.add(article_tag)

    db.commit()
    db.refresh(db_article)
    return db_article


async def update_article(db: Session, article_id: UUID, article_update: ArticleUpdate) -> Optional[Article]:
    db_article = get_article(db, article_id)
    if not db_article:
        return None

    update_data = article_update.model_dump(exclude_unset=True)

    # Handle publish status change
    if "is_published" in update_data:
        is_published = update_data["is_published"]
        if is_published and not db_article.is_published:  # type: ignore
            update_data["published_at"] = datetime.now(timezone.utc)
        elif not is_published and db_article.is_published:  # type: ignore
            update_data["published_at"] = None

    for field, value in update_data.items():
        setattr(db_article, field, value)

    db.commit()
    db.refresh(db_article)

    # 使用统一的缓存键更新缓存（序列化为 dict，不缓存 ORM 实例）
    cache_key = CacheKeys.article(article_id)
    await cache_service.set(cache_key, _article_to_cache(db_article), expire=CacheTTL.ARTICLE)

    # Also update by slug cache if slug was changed
    if hasattr(article_update, 'slug') and article_update.slug:
        slug_cache_key = CacheKeys.article_by_slug(article_update.slug)
        await cache_service.set(slug_cache_key, _article_to_cache(db_article), expire=CacheTTL.ARTICLE)

    return db_article


async def delete_article(db: Session, article_id: UUID) -> bool:
    db_article = get_article(db, article_id)
    if not db_article:
        return False

    db.delete(db_article)
    db.commit()

    # 使用统一的缓存键删除缓存
    cache_key = CacheKeys.article(article_id)
    await cache_service.delete(cache_key)

    if db_article.slug:
        slug_cache_key = CacheKeys.article_by_slug(db_article.slug)
        await cache_service.delete(slug_cache_key)

    return True


async def increment_view_count(db: Session, article_id: UUID) -> Optional[Article]:
    from sqlalchemy.orm import joinedload

    db_article = (
        db.query(Article)
        .options(joinedload(Article.author))
        .options(joinedload(Article.categories))
        .options(joinedload(Article.tags))
        .filter(Article.id == article_id)
        .first()
    )
    if not db_article:
        return None

    db.query(Article).filter(Article.id == article_id).update(
        {Article.view_count: Article.view_count + 1}
    )
    db.commit()

    # 重新加载文章以返回最新数据
    db_article = (
        db.query(Article)
        .options(joinedload(Article.author))
        .options(joinedload(Article.categories))
        .options(joinedload(Article.tags))
        .filter(Article.id == article_id)
        .first()
    )

    # 使用统一的缓存键更新缓存（序列化为 dict，不缓存 ORM 实例）
    if db_article:
        cache_key = CacheKeys.article(article_id)
        await cache_service.set(cache_key, _article_to_cache(db_article), expire=CacheTTL.ARTICLE)

    return db_article


def get_featured_articles(db: Session, limit: int = 10):
    """Get featured articles based on view count and publication date"""
    from sqlalchemy.orm import joinedload

    # 预加载作者/分类/标签，避免 ArticleWithAuthor 序列化时 N+1
    return (
        db.query(Article)
        .options(joinedload(Article.author))
        .options(joinedload(Article.categories))
        .options(joinedload(Article.tags))
        .filter(Article.is_published == True)
        .order_by(Article.view_count.desc(), Article.created_at.desc())
        .limit(limit)
        .all()
    )


def get_related_articles(db: Session, article_id: UUID, limit: int = 5):
    """Get articles related to a specific article based on category or tags"""
    from sqlalchemy.orm import joinedload
    from app.models.article_category import ArticleCategory
    from app.models.article_tag import ArticleTag
    
    # Get the original article (预加载关联数据)
    original_article = (
        db.query(Article)
        .options(joinedload(Article.article_categories))
        .filter(Article.id == article_id)
        .first()
    )
    if not original_article:
        return []
    
    # Find articles in the same category (预加载作者信息)
    related_by_category = []
    if original_article.article_categories and len(original_article.article_categories) > 0:
        category_id = original_article.article_categories[0].category_id
        related_by_category = (
            db.query(Article)
            .options(joinedload(Article.author))  # 预加载作者，避免 N+1
            .options(joinedload(Article.categories))
            .options(joinedload(Article.tags))
            .join(ArticleCategory)
            .filter(
                Article.id != article_id,
                Article.is_published == True,
                ArticleCategory.category_id == category_id
            )
            .order_by(Article.view_count.desc())
            .limit(limit)
            .all()
        )
    
    # If we don't have enough articles from the same category, get popular articles
    if len(related_by_category) < limit:
        remaining = limit - len(related_by_category)
        existing_ids = [a.id for a in related_by_category]
        existing_ids.append(article_id)
        
        popular_articles = (
            db.query(Article)
            .options(joinedload(Article.author))  # 预加载作者，避免 N+1
            .options(joinedload(Article.categories))
            .options(joinedload(Article.tags))
            .filter(
                Article.is_published == True,
                ~Article.id.in_(existing_ids)
            )
            .order_by(Article.view_count.desc(), Article.created_at.desc())
            .limit(remaining)
            .all()
        )
        related_by_category.extend(popular_articles)
    
    return related_by_category


def get_articles_with_categories_and_tags(db: Session, skip: int = 0, limit: int = 100, published_only: bool = True, category_id: UUID = None, tag_id: UUID = None, author_id: UUID = None, search: str = None):
    """Get articles with optimized query including joined relationships for categories and tags"""
    from sqlalchemy.orm import joinedload
    from app.models.article_category import ArticleCategory
    from app.models.article_tag import ArticleTag
    from app.models.category import Category
    from app.models.tag import Tag
    from sqlalchemy import or_

    query = db.query(Article).options(
        joinedload(Article.author),
        joinedload(Article.categories),
        joinedload(Article.tags)
    )

    if published_only:
        query = query.filter(Article.is_published == True)

    if author_id is not None:
        query = query.filter(Article.author_id == author_id)

    if category_id is not None:
        query = query.join(ArticleCategory).filter(ArticleCategory.category_id == category_id)

    if tag_id is not None:
        query = query.join(ArticleTag).filter(ArticleTag.tag_id == tag_id)

    if search:
        search_filter = or_(
            Article.title.ilike(f"%{search}%"),
            Article.content.ilike(f"%{search}%"),
            Article.excerpt.ilike(f"%{search}%"),
        )
        query = query.filter(search_filter)

    return query.offset(skip).limit(limit).all()


def get_popular_articles(db: Session, limit: int = 5, days: int = 30):
    """
    获取热门文章（基于浏览量和评论数）
    """
    from sqlalchemy import func, and_
    from sqlalchemy.orm import joinedload
    from datetime import datetime, timedelta
    from app.models.comment import Comment

    # 计算日期范围
    since_date = datetime.now(timezone.utc) - timedelta(days=days)

    # 查询热门文章（考虑浏览量和评论数）
    # 使用 joinedload 预加载作者信息，避免 N+1 查询
    popular_articles = (
        db.query(Article)
        .options(joinedload(Article.author))  # 预加载作者
        .join(Comment, Comment.article_id == Article.id, isouter=True)  # 左连接评论表
        .filter(and_(Article.is_published == True, Article.published_at >= since_date))
        .group_by(Article.id)  # 按文章分组
        .order_by(
            Article.view_count.desc(),  # 首先按浏览量降序
            func.count(Comment.id).desc(),  # 然后按评论数降序
            Article.published_at.desc()  # 最后按发布时间降序
        )
        .limit(limit)
        .all()
    )

    return popular_articles


async def get_articles_with_cursor_pagination(
    db: Session,
    cursor_params: CursorPaginationParams,
    published_only: bool = True,
    author_id: Optional[UUID] = None,
    search: Optional[str] = None,
    category_id: Optional[UUID] = None,
    tag_id: Optional[UUID] = None,
) -> CursorPaginationResult[Article]:
    """
    使用游标分页获取文章（按 created_at 降序、id 降序）
    """
    from sqlalchemy import desc
    from sqlalchemy.orm import joinedload
    from app.utils.pagination import encode_cursor, decode_cursor


    # 构建基础查询
    query = db.query(Article).options(
        joinedload(Article.author),
        joinedload(Article.categories),
        joinedload(Article.tags)
    )

    # 应用过滤条件
    if published_only:
        query = query.filter(Article.is_published == True)

    if author_id is not None:
        query = query.filter(Article.author_id == author_id)

    if search:
        search_filter = or_(
            Article.title.ilike(f"%{search}%"),
            Article.content.ilike(f"%{search}%"),
            Article.excerpt.ilike(f"%{search}%"),
        )
        query = query.filter(search_filter)

    # Filter by category if provided
    if category_id is not None:
        from app.models.article_category import ArticleCategory
        query = query.join(ArticleCategory).filter(ArticleCategory.category_id == category_id)

    # Filter by tag if provided
    if tag_id is not None:
        from app.models.article_tag import ArticleTag
        query = query.join(ArticleTag).filter(ArticleTag.tag_id == tag_id)

    # 应用游标条件（必须在 limit 之前）
    if cursor_params.cursor:
        cursor_data = decode_cursor(cursor_params.cursor)
        created_at_val = cursor_data.get("created_at")
        id_val = cursor_data.get("id")
        if created_at_val and id_val:
            from app.core.config import settings
            from sqlalchemy import func

            created_at_dt = datetime.fromisoformat(created_at_val.replace("Z", "+00:00"))
            cursor_id = str(UUID(id_val))

            if settings.DATABASE_URL.startswith("sqlite"):
                # SQLite 中 datetime 以字符串存储且 server_default 精度为秒，
                # 使用 strftime 统一格式后再比较，避免 Python datetime 绑定带 .000000
                created_at_str = created_at_dt.strftime("%Y-%m-%d %H:%M:%S")
                db_created_at = func.strftime("%Y-%m-%d %H:%M:%S", Article.created_at)
                query = query.filter(
                    or_(
                        db_created_at < created_at_str,
                        and_(db_created_at == created_at_str, Article.id < cursor_id),
                    )
                )
            else:
                query = query.filter(
                    or_(
                        Article.created_at < created_at_dt,
                        and_(Article.created_at == created_at_dt, Article.id < cursor_id),
                    )
                )

    # 按创建时间倒序排列，并以 id 作为第二排序字段保证稳定
    query = query.order_by(desc(Article.created_at), desc(Article.id))
    query = query.limit(cursor_params.limit + 1)

    results = query.all()

    has_more = len(results) > cursor_params.limit
    if has_more:
        results = results[:-1]

    next_cursor = None
    if results and has_more:
        last = results[-1]
        next_cursor = encode_cursor({
            "created_at": last.created_at.isoformat() if last.created_at else None,
            "id": str(last.id),
        })

    return CursorPaginationResult(items=results, next_cursor=next_cursor, has_more=has_more)


def search_articles_fulltext(
    db: Session,
    search_query: str,
    published_only: bool = True,
    skip: int = 0,
    limit: int = 100,
) -> list[Article]:
    """
    使用PostgreSQL全文搜索功能搜索文章
    """
    # 构建全文搜索查询
    search_condition = text(
        "search_vector @@ plainto_tsquery('english', :search_term)"
    )

    from sqlalchemy.orm import joinedload
    # 预加载关联数据，避免 ArticleWithAuthor 序列化时 N+1
    query = (
        db.query(Article)
        .options(joinedload(Article.author))
        .options(joinedload(Article.categories))
        .options(joinedload(Article.tags))
        .filter(search_condition.params(search_term=search_query))
    )
    
    # 应用发布状态过滤
    if published_only:
        query = query.filter(Article.is_published == True)
    
    # 添加相关性排序
    rank_expression = text(
        "ts_rank(search_vector, plainto_tsquery('english', :search_term)) DESC"
    )
    query = query.order_by(rank_expression.params(search_term=search_query))
    
    # 应用分页
    query = query.offset(skip).limit(limit)
    
    return query.all()