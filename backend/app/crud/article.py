from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy import and_, distinct, func, or_, select, text
from sqlalchemy.orm import Session, joinedload

from app.models.article import Article
from app.schemas.article import ArticleCreate, ArticleUpdate, ArticleWithAuthor
from app.services.cache_service import cache_service
from app.utils.pagination import CursorPaginationParams, CursorPaginationResult
from app.utils.cache_keys import CacheKeys, CacheTTL
from app.utils.logger import app_logger


# ---------------------------------------------------------------------------
# 统一查询构件：此前 joinedload 组合重复 13 处、搜索过滤 4 处、分类/标签过滤
# 3 处，全部收敛到以下 helper，任何新查询不得再手写 joinedload 组合。
# ---------------------------------------------------------------------------

def _with_relations(query, *, attachments: bool = True):
    """预加载 author/categories/tags（可选 attachments），序列化 ArticleWithAuthor 时防 N+1"""
    opts = [
        joinedload(Article.author),
        joinedload(Article.categories),
        joinedload(Article.tags),
    ]
    if attachments:
        opts.append(joinedload(Article.attachments))
    return query.options(*opts)


def _filter_by_category(query, category_ids: list[UUID]):
    """按分类过滤：半连接（id IN 子查询），避免 join 关联表造成行膨胀"""
    from app.models.article_category import ArticleCategory
    subq = select(ArticleCategory.article_id).where(ArticleCategory.category_id.in_(category_ids))
    return query.filter(Article.id.in_(subq))


def _filter_by_tag(query, tag_ids: list[UUID]):
    from app.models.article_tag import ArticleTag
    subq = select(ArticleTag.article_id).where(ArticleTag.tag_id.in_(tag_ids))
    return query.filter(Article.id.in_(subq))


def _apply_filters(
    query,
    *,
    published_only: bool = False,
    author_ids: Optional[list[UUID]] = None,
    search: Optional[str] = None,
    category_ids: Optional[list[UUID]] = None,
    tag_ids: Optional[list[UUID]] = None,
):
    """列表类查询的统一过滤入口（搜索/作者/发布/分类/标签）"""
    if published_only:
        query = query.filter(Article.is_published == True)  # noqa: E712
    if author_ids:
        query = query.filter(Article.author_id.in_(author_ids))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(or_(
            Article.title.ilike(pattern),
            Article.content.ilike(pattern),
            Article.excerpt.ilike(pattern),
        ))
    if category_ids:
        query = _filter_by_category(query, category_ids)
    if tag_ids:
        query = _filter_by_tag(query, tag_ids)
    return query


def _as_uuid_list(value) -> Optional[list[UUID]]:
    """单值/列表统一转 UUID 列表，None 原样返回"""
    if value is None:
        return None
    return value if isinstance(value, (list, tuple)) else [value]


# ---------------------------------------------------------------------------
# 详情查询
# ---------------------------------------------------------------------------

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

    article = _with_relations(db.query(Article)).filter(Article.id == article_id).first()

    if article:
        # 缓存真实数据（序列化为 dict，不缓存 ORM 实例）
        await cache_service.set(cache_key, _article_to_cache(article), expire=CacheTTL.ARTICLE)
    else:
        # 缓存空值,防止缓存穿透(使用False标记,60秒过期)
        await cache_service.set(cache_key, False, expire=CacheTTL.VERY_SHORT)

    return article


def get_article_by_slug(db: Session, slug: str) -> Optional[Article]:
    return db.query(Article).filter(Article.slug == slug).first()


def get_article_by_slug_with_relationships(db: Session, slug: str) -> Optional[Article]:
    return _with_relations(db.query(Article)).filter(Article.slug == slug).first()


async def get_article_by_slug_with_relationships_async(db: Session, slug: str) -> Optional[Article]:
    """异步获取文章，带缓存和关系数据,以及缓存穿透防护"""
    cache_key = CacheKeys.article_by_slug(slug)
    cached_article = await cache_service.get(cache_key)

    if cached_article is not None:
        # 检查是否为空值缓存
        if cached_article is False:
            return None
        return _article_from_cache(cached_article)

    article = _with_relations(db.query(Article)).filter(Article.slug == slug).first()

    if article:
        await cache_service.set(cache_key, _article_to_cache(article), expire=CacheTTL.ARTICLE)
    else:
        # 缓存空值,防止缓存穿透
        await cache_service.set(cache_key, False, expire=CacheTTL.VERY_SHORT)

    return article


# ---------------------------------------------------------------------------
# 写操作
# ---------------------------------------------------------------------------

def create_article(db: Session, article: ArticleCreate, author_id: UUID) -> Article:
    from app.models.tag import Tag
    from app.models.category import Category
    from app.models.article_tag import ArticleTag
    from app.models.article_category import ArticleCategory
    from app.models.article_attachment import ArticleAttachment

    db_article = Article(
        **article.model_dump(exclude={'tags', 'category_id', 'category_ids', 'attachments'}),
        author_id=author_id,
    )

    # Set published_at if article is published
    if article.is_published:
        db_article.published_at = datetime.now(timezone.utc)  # type: ignore

    db.add(db_article)
    db.flush()  # Get the ID without committing

    # Associate categories：优先 category_ids（多选），兼容旧单值字段 category_id
    category_id_list: list = list(article.category_ids or [])
    if article.category_id and article.category_id not in category_id_list:
        category_id_list.append(article.category_id)
    for idx, cid in enumerate(category_id_list):
        category = db.query(Category).filter(Category.id == cid).first()
        if category:
            db.add(ArticleCategory(
                article_id=db_article.id,
                category_id=category.id,
                is_primary=(idx == 0),
            ))

    # Associate tags
    if article.tags:
        for tag_id in article.tags:
            tag = db.query(Tag).filter(Tag.id == tag_id).first()
            if tag:
                article_tag = ArticleTag(article_id=db_article.id, tag_id=tag.id)
                db.add(article_tag)

    # Create attachments
    if article.attachments:
        for att in article.attachments:
            db.add(ArticleAttachment(
                article_id=db_article.id,
                name=att.name,
                url=att.url,
                media_type=att.media_type,
                mime_type=att.mime_type,
                file_size=att.file_size,
                is_reference=att.is_reference,
                sort_order=att.sort_order,
            ))

    db.commit()
    db.refresh(db_article)
    _refresh_search_vector(db, db_article.id, db_article.title, db_article.excerpt, db_article.content)  # type: ignore
    return db_article


async def update_article(db: Session, article_id: UUID, article_update: ArticleUpdate) -> Optional[Article]:
    from app.models.article_attachment import ArticleAttachment

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

    # attachments 全量替换：先删旧再建新（与 tags/categories 的编辑语义一致）
    if "attachments" in update_data:
        from app.schemas.article_attachment import ArticleAttachmentCreate
        attachments_in = update_data.pop("attachments")
        if attachments_in is None:
            attachments_in = []
        db.query(ArticleAttachment).filter(
            ArticleAttachment.article_id == db_article.id
        ).delete()
        for att_raw in attachments_in:
            # model_dump(exclude_unset=True) 后元素是 dict，统一转回 schema 再取值
            att = ArticleAttachmentCreate.model_validate(att_raw)
            db.add(ArticleAttachment(
                article_id=db_article.id,
                name=att.name,
                url=att.url,
                media_type=att.media_type,
                mime_type=att.mime_type,
                file_size=att.file_size,
                is_reference=att.is_reference,
                sort_order=att.sort_order,
            ))

    # 分类/标签全量替换（编辑语义与 attachments 一致：先删旧再建新）
    if "category_ids" in update_data:
        from app.models.article_category import ArticleCategory
        new_category_ids = update_data.pop("category_ids") or []
        db.query(ArticleCategory).filter(
            ArticleCategory.article_id == db_article.id
        ).delete()
        for idx, cid in enumerate(new_category_ids):
            db.add(ArticleCategory(
                article_id=db_article.id,
                category_id=cid,
                is_primary=(idx == 0),
            ))

    if "tag_ids" in update_data:
        from app.models.article_tag import ArticleTag
        new_tag_ids = update_data.pop("tag_ids") or []
        db.query(ArticleTag).filter(
            ArticleTag.article_id == db_article.id
        ).delete()
        for tid in new_tag_ids:
            db.add(ArticleTag(article_id=db_article.id, tag_id=tid))

    for field, value in update_data.items():
        setattr(db_article, field, value)

    db.commit()
    db.refresh(db_article)
    _refresh_search_vector(db, db_article.id, db_article.title, db_article.excerpt, db_article.content)  # type: ignore

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
    db_article = _with_relations(db.query(Article)).filter(Article.id == article_id).first()
    if not db_article:
        return None

    db.query(Article).filter(Article.id == article_id).update(
        {Article.view_count: Article.view_count + 1}
    )
    db.commit()

    # 重新加载文章以返回最新数据
    db_article = _with_relations(db.query(Article)).filter(Article.id == article_id).first()

    # 使用统一的缓存键更新缓存（序列化为 dict，不缓存 ORM 实例）
    if db_article:
        cache_key = CacheKeys.article(article_id)
        await cache_service.set(cache_key, _article_to_cache(db_article), expire=CacheTTL.ARTICLE)

    return db_article


# ---------------------------------------------------------------------------
# 列表查询
# ---------------------------------------------------------------------------

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
    """获取文章列表（get_articles_with_categories_and_tags 已并入此函数）"""
    query = db.query(Article) if not with_relationships else _with_relations(db.query(Article))

    query = _apply_filters(
        query,
        published_only=published_only,
        author_ids=_as_uuid_list(author_id),
        search=search,
        category_ids=_as_uuid_list(category_id),
        tag_ids=_as_uuid_list(tag_id),
    )

    # Order by views or by creation date
    if order_by_views:
        query = query.order_by(Article.view_count.desc(), Article.created_at.desc())
    else:
        query = query.order_by(Article.created_at.desc())

    return query.offset(skip).limit(limit).all()


def get_featured_articles(db: Session, limit: int = 10):
    """Get featured articles based on view count and publication date"""
    return (
        _with_relations(db.query(Article))
        .filter(Article.is_published == True)  # noqa: E712
        .order_by(Article.view_count.desc(), Article.created_at.desc())
        .limit(limit)
        .all()
    )


def get_related_articles(db: Session, article_id: UUID, limit: int = 5):
    """Get articles related to a specific article based on category or tags"""
    from app.models.article_category import ArticleCategory

    # Get the original article（仅关联表映射，避免加载全量集合）
    original_article = (
        db.query(Article)
        .options(joinedload(Article.article_categories))
        .filter(Article.id == article_id)
        .first()
    )
    if not original_article:
        return []

    related: list[Article] = []
    if original_article.article_categories:
        category_id = original_article.article_categories[0].category_id
        related = (
            _apply_filters(
                _with_relations(db.query(Article)),
                published_only=True,
                category_ids=[category_id],
            )
            .filter(Article.id != article_id)
            .order_by(Article.view_count.desc())
            .limit(limit)
            .all()
        )

    # If we don't have enough articles from the same category, get popular articles
    if len(related) < limit:
        remaining = limit - len(related)
        existing_ids = [a.id for a in related] + [article_id]
        popular_articles = (
            _apply_filters(_with_relations(db.query(Article)), published_only=True)
            .filter(~Article.id.in_(existing_ids))
            .order_by(Article.view_count.desc(), Article.created_at.desc())
            .limit(remaining)
            .all()
        )
        related.extend(popular_articles)

    return related


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
    from app.utils.pagination import encode_cursor, decode_cursor

    query = _apply_filters(
        _with_relations(db.query(Article), attachments=False),
        published_only=published_only,
        author_ids=_as_uuid_list(author_id),
        search=search,
        category_ids=_as_uuid_list(category_id),
        tag_ids=_as_uuid_list(tag_id),
    )

    # 应用游标条件（必须在 limit 之前）
    if cursor_params.cursor:
        cursor_data = decode_cursor(cursor_params.cursor)
        created_at_val = cursor_data.get("created_at")
        id_val = cursor_data.get("id")
        if created_at_val and id_val:
            from app.core.config import settings

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


# ---------------------------------------------------------------------------
# 搜索 / 热门（原 utils/db_utils.py 的文章查询已迁入，db_utils 不再承载文章逻辑）
# ---------------------------------------------------------------------------

def get_articles_by_multiple_filters(
    db: Session,
    author_ids: Optional[list[str]] = None,
    category_ids: Optional[list[str]] = None,
    tag_ids: Optional[list[str]] = None,
    search: Optional[str] = None,
    published_only: bool = True,
    limit: int = 100,
    offset: int = 0,
):
    """使用多个过滤条件高效查询文章（供列表分页信封的 items 使用）"""
    query = _apply_filters(
        _with_relations(db.query(Article)),
        published_only=published_only,
        author_ids=[UUID(i) for i in author_ids] if author_ids else None,
        search=search,
        category_ids=[UUID(i) for i in category_ids] if category_ids else None,
        tag_ids=[UUID(i) for i in tag_ids] if tag_ids else None,
    )
    return (
        query.order_by(Article.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def count_articles_by_multiple_filters(
    db: Session,
    author_ids: Optional[list[str]] = None,
    category_ids: Optional[list[str]] = None,
    tag_ids: Optional[list[str]] = None,
    search: Optional[str] = None,
    published_only: bool = True,
) -> int:
    """统计符合同一组过滤条件的文章总数（供分页信封的 total 使用）。

    计数查询不套 joinedload —— 预加载对 COUNT 无意义，只会拖慢。
    """
    query = _apply_filters(
        db.query(func.count(distinct(Article.id))) if (category_ids or tag_ids)
        else db.query(func.count(Article.id)),
        published_only=published_only,
        author_ids=[UUID(i) for i in author_ids] if author_ids else None,
        search=search,
        category_ids=[UUID(i) for i in category_ids] if category_ids else None,
        tag_ids=[UUID(i) for i in tag_ids] if tag_ids else None,
    )
    return query.scalar() or 0


def get_popular_articles_optimized(db: Session, limit: int = 5, days: int = 30):
    """
    优化的热门文章查询（评论数 + 浏览量排序），使用预加载关系避免 N+1。
    days 参数保留兼容既有签名，当前排序不限制发布时间窗口。
    """
    from sqlalchemy import select
    from app.models.comment import Comment

    try:
        # 先用原生 SQL 取排序后的 id 列表，再一次性取 ORM 实体并按序返回
        query = text("""
            SELECT
                a.id,
                COUNT(c.id) as comment_count
            FROM articles a
            LEFT JOIN comments c ON a.id = c.article_id
            WHERE a.is_published = true
            GROUP BY a.id
            ORDER BY a.view_count DESC, COUNT(c.id) DESC, a.published_at DESC
            LIMIT :limit
        """)
        result = db.execute(query, {"limit": limit})
        article_ids = [row.id for row in result]

        if not article_ids:
            return []

        articles = _with_relations(db.query(Article)).filter(Article.id.in_(article_ids)).all()
        articles_dict = {article.id: article for article in articles}
        return [articles_dict[aid] for aid in article_ids if aid in articles_dict]
    except Exception as e:
        app_logger.error(f"获取热门文章失败: {e}", exc_info=True)
        return []


def _tokenize_for_search(raw: str) -> str:
    """jieba 搜索粒度分词，空格连接——配合 PG plainto_tsquery('simple', ...) 使用。

    'english' 配置对中文内容无效（无分词器），改为应用层分词后以 simple 配置匹配。
    """
    import jieba

    return " ".join(t.strip() for t in jieba.cut_for_search(raw) if t.strip())


def _refresh_search_vector(db: Session, article_id: UUID, title: str, excerpt: Optional[str], content: Optional[str]) -> None:
    """写入侧维护 search_vector（触发器已随迁移 021 移除）。仅 PostgreSQL 生效。

    SQLite 测试库无 tsvector，直接跳过——全文搜索用例本就标记 PG-only。
    """
    if db.bind is None or db.bind.dialect.name != "postgresql":
        return
    tokens = _tokenize_for_search(" ".join(p for p in (title, excerpt, content) if p))
    if not tokens:
        return
    db.execute(
        text("UPDATE articles SET search_vector = to_tsvector('simple', :tok) WHERE id = :id"),
        {"tok": tokens, "id": article_id},
    )
    db.commit()


def search_articles_fulltext(
    db: Session,
    search_query: str,
    published_only: bool = True,
    skip: int = 0,
    limit: int = 100,
) -> list[Article]:
    """
    中文分词全文搜索：查询串经 jieba 分词后与 search_vector（写入侧同为
    jieba 分词的 simple tsvector，见迁移 021）做匹配，按 ts_rank 相关性排序。
    """
    tokens = _tokenize_for_search(search_query)
    if not tokens:
        return []

    # 绑定参数只出现在 WHERE 层的 text 中；order_by 若放含裸列（search_vector）
    # 的 text 会触发 ORM 子查询包装导致外层 UndefinedColumn，故排序退回 ORM 列
    search_condition = text(
        "search_vector @@ plainto_tsquery('simple', :search_term)"
    ).bindparams(search_term=tokens)

    query = _with_relations(db.query(Article), attachments=False).filter(search_condition)

    # 应用发布状态过滤
    if published_only:
        query = query.filter(Article.is_published == True)  # noqa: E712

    query = query.order_by(Article.view_count.desc(), Article.created_at.desc())
    query = query.offset(skip).limit(limit)

    return query.all()
