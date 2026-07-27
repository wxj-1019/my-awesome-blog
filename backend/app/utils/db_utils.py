"""数据库查询优化工具"""

from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, func, distinct
from typing import List, Optional, Type, Any
from app.models.article import Article
from app.models.user import User
from app.models.comment import Comment
from app.models.category import Category
from app.models.tag import Tag
from app.utils.logger import app_logger


def optimize_article_query(db: Session, include_author: bool = True, include_categories: bool = True, include_tags: bool = True, include_comments: bool = False):
    """
    优化的文章查询，预加载常用的关系数据以避免N+1查询问题
    """
    query = db.query(Article)
    
    options = []
    if include_author:
        options.append(joinedload(Article.author))
    if include_categories:
        options.append(joinedload(Article.categories))
    if include_tags:
        options.append(joinedload(Article.tags))
    if include_comments:
        options.append(selectinload(Article.comments))
    
    for option in options:
        query = query.options(option)
    
    return query


def bulk_delete_articles(db: Session, article_ids: List[str]) -> int:
    """
    批量删除文章，提高删除效率
    """
    from sqlalchemy import delete
    from app.models.article import Article
    
    stmt = delete(Article).where(Article.id.in_(article_ids))
    result = db.execute(stmt)
    db.commit()
    
    return result.rowcount


def get_popular_articles_optimized(db: Session, limit: int = 5, days: int = 30):
    """
    优化的热门文章查询，使用预加载关系避免N+1问题
    """
    from datetime import datetime, timedelta
    from sqlalchemy import text
    from app.models.article_category import ArticleCategory
    from app.models.article_tag import ArticleTag

    try:
        # 使用原生SQL查询优化性能 - 只要求已发布，不限制发布时间
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
        
        app_logger.info(f"Popular articles query: limit={limit}")
        result = db.execute(query, {"limit": limit})
        
        # 将结果转换为Article对象，并预加载关系数据
        articles = []
        rows = list(result)
        app_logger.info(f"SQL query returned {len(rows)} rows")
        
        if rows:
            # 直接从结果中获取UUID对象
            article_ids = [row.id for row in rows]
            
            # 一次性获取所有文章及其关系数据，避免N+1查询
            articles = (
                db.query(Article)
                .options(
                    joinedload(Article.author),
                    joinedload(Article.categories),
                    joinedload(Article.tags)
                )
                .filter(Article.id.in_(article_ids))
                .all()
            )
            
            # 按查询结果的顺序排序
            articles_dict = {article.id: article for article in articles}
            ordered_articles = []
            for row in rows:
                if row.id in articles_dict:
                    ordered_articles.append(articles_dict[row.id])

            return ordered_articles
        
        return articles
    except Exception as e:
        app_logger.error(f"获取热门文章失败: {e}", exc_info=True)
        return []


def get_user_article_stats_batch(db: Session, user_ids: List[str]):
    """
    批量获取多个用户的文章统计信息
    """
    from sqlalchemy import func
    
    # 查询每个用户的文章数量和总浏览量
    stats_query = db.query(
        Article.author_id,
        func.count(Article.id).label('article_count'),
        func.sum(Article.view_count).label('total_views')
    ).filter(
        Article.author_id.in_(user_ids),
        Article.is_published == True
    ).group_by(Article.author_id).all()
    
    # 转换为字典格式便于查找
    stats_dict = {
        str(row.author_id): {
            'article_count': row.article_count or 0,
            'total_views': row.total_views or 0
        } 
        for row in stats_query
    }
    
    # 查询评论数量
    comment_stats_query = db.query(
        Comment.author_id,
        func.count(Comment.id).label('comment_count')
    ).filter(
        Comment.author_id.in_(user_ids)
    ).group_by(Comment.author_id).all()
    
    # 合并评论统计数据
    for row in comment_stats_query:
        user_id = str(row.author_id)
        if user_id in stats_dict:
            stats_dict[user_id]['comment_count'] = row.comment_count or 0
        else:
            stats_dict[user_id] = {
                'article_count': 0,
                'total_views': 0,
                'comment_count': row.comment_count or 0
            }
    
    return stats_dict


def _apply_article_filters(
    query,
    author_ids: Optional[List[str]] = None,
    category_ids: Optional[List[str]] = None,
    tag_ids: Optional[List[str]] = None,
    search: Optional[str] = None,
    published_only: bool = True,
):
    """
    把过滤条件套用到已有的文章查询上。

    抽出来给「取列表」与「取总数」共用，避免两处过滤逻辑漂移
    —— 一旦漂移，total 与实际返回的数据就对不上，翻页会出现空页。
    """
    conditions = []

    if published_only:
        conditions.append(Article.is_published == True)

    if author_ids:
        from uuid import UUID
        author_uuids = [UUID(id) for id in author_ids]
        conditions.append(Article.author_id.in_(author_uuids))

    if category_ids:
        from app.models.article_category import ArticleCategory
        from uuid import UUID
        category_uuids = [UUID(id) for id in category_ids]
        query = query.join(ArticleCategory).filter(ArticleCategory.category_id.in_(category_uuids))

    if tag_ids:
        from app.models.article_tag import ArticleTag
        from uuid import UUID
        tag_uuids = [UUID(id) for id in tag_ids]
        query = query.join(ArticleTag).filter(ArticleTag.tag_id.in_(tag_uuids))

    if search:
        search_pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Article.title.ilike(search_pattern),
                Article.content.ilike(search_pattern),
                Article.excerpt.ilike(search_pattern),
            )
        )

    if conditions:
        query = query.filter(and_(*conditions))

    return query


def get_articles_by_multiple_filters(
    db: Session,
    author_ids: Optional[List[str]] = None,
    category_ids: Optional[List[str]] = None,
    tag_ids: Optional[List[str]] = None,
    search: Optional[str] = None,
    published_only: bool = True,
    limit: int = 100,
    offset: int = 0
):
    """
    使用多个过滤条件高效查询文章
    """
    query = _apply_article_filters(
        optimize_article_query(db),
        author_ids=author_ids,
        category_ids=category_ids,
        tag_ids=tag_ids,
        search=search,
        published_only=published_only,
    )

    # 应用排序和分页
    query = query.order_by(Article.created_at.desc()).offset(offset).limit(limit)

    return query.all()


def count_articles_by_multiple_filters(
    db: Session,
    author_ids: Optional[List[str]] = None,
    category_ids: Optional[List[str]] = None,
    tag_ids: Optional[List[str]] = None,
    search: Optional[str] = None,
    published_only: bool = True,
) -> int:
    """
    统计符合同一组过滤条件的文章总数（供分页信封的 total 使用）。

    两点注意：
    1. 计数查询不套 joinedload —— 预加载对 COUNT 无意义，只会拖慢。
    2. 按分类/标签过滤会 join 关联表造成行重复，故用 COUNT(DISTINCT article.id)。
    """
    query = _apply_article_filters(
        db.query(func.count(distinct(Article.id))),
        author_ids=author_ids,
        category_ids=category_ids,
        tag_ids=tag_ids,
        search=search,
        published_only=published_only,
    )
    return query.scalar() or 0


def get_efficient_user_list(db: Session, include_article_counts: bool = False):
    """
    高效获取用户列表，可选择包含文章计数
    """
    if include_article_counts:
        # 使用子查询获取文章计数，避免N+1问题
        from sqlalchemy.orm import aliased
        
        # 创建文章的别名用于子查询
        article_alias = aliased(Article)
        
        # 主查询获取用户信息，子查询获取文章计数
        users_with_counts = db.query(
            User,
            func.coalesce(func.count(article_alias.id), 0).label('article_count')
        ).outerjoin(
            article_alias, 
            and_(User.id == article_alias.author_id, article_alias.is_published == True)
        ).group_by(User.id).all()
        
        return users_with_counts
    else:
        return db.query(User).all()


def get_articles_with_aggregated_data(db: Session, limit: int = 10):
    """
    获取文章及其聚合数据（如评论数、点赞数等）
    """
    from app.models.comment import Comment
    from sqlalchemy import func
    
    # 查询文章及关联的评论数
    results = db.query(
        Article,
        func.count(Comment.id).label('comment_count')
    ).outerjoin(
        Comment, 
        and_(Article.id == Comment.article_id, Comment.is_approved == True)  # 假设有审核字段
    ).filter(
        Article.is_published == True
    ).group_by(
        Article.id
    ).order_by(
        Article.created_at.desc()
    ).limit(
        limit
    ).all()
    
    return results