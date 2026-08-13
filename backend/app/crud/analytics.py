from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy import func, and_, or_, extract
from sqlalchemy.orm import Session
from app.models.article import Article
from app.models.user import User
from app.models.comment import Comment
from app.models.logs.audit_log import AuditLog


def get_article_growth_stats(db: Session, days: int = 30) -> Dict:
    """
    获取文章增长统计数据
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # 获取每天的文章创建数量
    daily_counts = db.query(
        func.date(Article.created_at).label('date'),
        func.count(Article.id).label('count')
    ).filter(
        Article.created_at >= start_date
    ).group_by(
        func.date(Article.created_at)
    ).order_by(
        func.date(Article.created_at)
    ).all()
    
    # 转换为字典格式
    growth_data = {
        "period_days": days,
        "total_articles": db.query(Article).count(),
        "daily_counts": [{"date": str(item.date), "count": item.count} for item in daily_counts]
    }
    
    return growth_data


def get_user_engagement_stats(db: Session, days: int = 30) -> Dict:
    """
    获取用户参与度统计数据
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # 获取每日活跃用户数
    daily_active_users = db.query(
        func.date(Article.created_at).label('date'),
        func.count(func.distinct(Article.author_id)).label('active_authors')
    ).filter(
        Article.created_at >= start_date
    ).group_by(
        func.date(Article.created_at)
    ).all()
    
    # 获取每日评论数
    daily_comments = db.query(
        func.date(Comment.created_at).label('date'),
        func.count(Comment.id).label('comment_count')
    ).filter(
        Comment.created_at >= start_date
    ).group_by(
        func.date(Comment.created_at)
    ).all()
    
    engagement_data = {
        "period_days": days,
        "total_users": db.query(User).count(),
        "total_articles": db.query(Article).count(),
        "total_comments": db.query(Comment).count(),
        "daily_active_authors": [{"date": str(item.date), "count": item.active_authors} for item in daily_active_users],
        "daily_comments": [{"date": str(item.date), "count": item.comment_count} for item in daily_comments]
    }
    
    return engagement_data


def get_top_authors_by_articles(db: Session, limit: int = 10) -> List[Dict]:
    """
    获取发布文章最多的作者
    """
    top_authors = db.query(
        User,
        func.count(Article.id).label('article_count')
    ).join(
        Article, User.id == Article.author_id
    ).filter(
        Article.is_published == True
    ).group_by(
        User.id
    ).order_by(
        func.count(Article.id).desc()
    ).limit(limit).all()
    
    return [{
        "user_id": str(author.id),
        "username": author.username,
        "full_name": author.full_name,
        "article_count": count
    } for author, count in top_authors]


def get_top_authors_by_views(db: Session, limit: int = 10) -> List[Dict]:
    """
    获取总浏览量最高的作者
    """
    top_authors = db.query(
        User,
        func.sum(Article.view_count).label('total_views')
    ).join(
        Article, User.id == Article.author_id
    ).filter(
        Article.is_published == True
    ).group_by(
        User.id
    ).having(
        func.sum(Article.view_count) > 0
    ).order_by(
        func.sum(Article.view_count).desc()
    ).limit(limit).all()
    
    return [{
        "user_id": str(author.id),
        "username": author.username,
        "full_name": author.full_name,
        "total_views": int(total_views or 0)
    } for author, total_views in top_authors]


def get_monthly_statistics(db: Session, months: int = 6) -> Dict:
    """
    获取月度统计信息
    """
    # 计算起始月份
    now = datetime.utcnow()
    start_date = now - timedelta(days=months*30)
    
    # 按月获取文章数
    monthly_articles = db.query(
        extract('year', Article.created_at).label('year'),
        extract('month', Article.created_at).label('month'),
        func.count(Article.id).label('article_count'),
        func.sum(Article.view_count).label('total_views')
    ).filter(
        Article.created_at >= start_date
    ).group_by(
        extract('year', Article.created_at),
        extract('month', Article.created_at)
    ).order_by(
        extract('year', Article.created_at),
        extract('month', Article.created_at)
    ).all()
    
    # 按月获取评论数
    monthly_comments = db.query(
        extract('year', Comment.created_at).label('year'),
        extract('month', Comment.created_at).label('month'),
        func.count(Comment.id).label('comment_count')
    ).filter(
        Comment.created_at >= start_date
    ).group_by(
        extract('year', Comment.created_at),
        extract('month', Comment.created_at)
    ).order_by(
        extract('year', Comment.created_at),
        extract('month', Comment.created_at)
    ).all()
    
    # 转换数据格式
    articles_by_month = {}
    for item in monthly_articles:
        key = f"{int(item.year)}-{int(item.month):02d}"
        articles_by_month[key] = {
            "articles": item.article_count,
            "views": int(item.total_views or 0)
        }
    
    comments_by_month = {}
    for item in monthly_comments:
        key = f"{int(item.year)}-{int(item.month):02d}"
        comments_by_month[key] = item.comment_count
    
    # 合并数据
    all_months = set(articles_by_month.keys()) | set(comments_by_month.keys())
    monthly_data = []
    
    for month in sorted(all_months):
        data = {
            "month": month,
            "articles": articles_by_month.get(month, {}).get("articles", 0),
            "views": articles_by_month.get(month, {}).get("views", 0),
            "comments": comments_by_month.get(month, 0)
        }
        monthly_data.append(data)
    
    return {
        "period_months": months,
        "monthly_data": monthly_data
    }


def get_content_insights(db: Session) -> Dict:
    """
    获取内容洞察数据
    """
    # 获取平均阅读时间
    avg_reading_time = db.query(
        func.avg(Article.read_time)
    ).filter(
        Article.is_published == True,
        Article.read_time.isnot(None)
    ).scalar()
    
    # 获取最受欢迎的类别
    from app.models.article_category import ArticleCategory
    from app.models.category import Category
    
    top_categories = db.query(
        Category.name,
        func.count(ArticleCategory.article_id).label('article_count')
    ).join(
        ArticleCategory, Category.id == ArticleCategory.category_id
    ).join(
        Article, ArticleCategory.article_id == Article.id
    ).filter(
        Article.is_published == True
    ).group_by(
        Category.id, Category.name
    ).order_by(
        func.count(ArticleCategory.article_id).desc()
    ).limit(10).all()
    
    # 获取最活跃的标签
    from app.models.article_tag import ArticleTag
    from app.models.tag import Tag
    
    top_tags = db.query(
        Tag.name,
        func.count(ArticleTag.article_id).label('article_count')
    ).join(
        ArticleTag, Tag.id == ArticleTag.tag_id
    ).join(
        Article, ArticleTag.article_id == Article.id
    ).filter(
        Article.is_published == True
    ).group_by(
        Tag.id, Tag.name
    ).order_by(
        func.count(ArticleTag.article_id).desc()
    ).limit(10).all()
    
    return {
        "avg_reading_time": float(avg_reading_time or 0),
        "top_categories": [{"name": name, "count": count} for name, count in top_categories],
        "top_tags": [{"name": name, "count": count} for name, count in top_tags]
    }