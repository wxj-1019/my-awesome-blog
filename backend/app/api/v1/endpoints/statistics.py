from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.statistics import WebsiteStatistics, ArticleStatistics, StatisticsResponse
from app.services.statistics_service import StatisticsService
from app.models.user import User
from app.models.article import Article
from app.models.comment import Comment

router = APIRouter()


@router.get("/general", response_model=dict)
def get_general_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get general website statistics
    """
    stats = StatisticsService.get_general_statistics(db)
    return stats


@router.get("/articles", response_model=dict)
def get_article_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get article-related statistics
    """
    stats = StatisticsService.get_article_statistics(db)
    return stats


@router.get("/users", response_model=dict)
def get_user_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get user-related statistics
    """
    stats = StatisticsService.get_user_statistics(db)
    return stats


@router.get("/website", response_model=WebsiteStatistics)
def get_website_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get website statistics
    """
    stats = StatisticsService.get_website_statistics(db)
    return stats


@router.get("/articles/popular", response_model=list[ArticleStatistics])
def get_popular_articles_statistics(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get popular articles statistics
    """
    stats = StatisticsService.get_popular_articles(db, limit=limit)
    return stats


@router.get("/growth", response_model=dict)
def get_growth_statistics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get growth statistics for the last N days
    """
    stats = StatisticsService.get_growth_statistics(db, days=days)
    return stats


@router.get("/content", response_model=dict)
def get_content_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get content statistics
    """
    stats = StatisticsService.get_content_statistics(db)
    return stats


@router.get("/overview", response_model=StatisticsResponse)
def get_statistics_overview(
    article_limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get comprehensive statistics overview
    """
    website_stats = StatisticsService.get_website_statistics(db)
    article_stats = StatisticsService.get_popular_articles(db, limit=article_limit)

    return StatisticsResponse(
        website=website_stats,
        articles=article_stats
    )


@router.get("/public/overview", response_model=dict)
def get_public_statistics_overview(
    db: Session = Depends(get_db)
) -> Any:
    """
    获取公开的网站统计数据（无需认证）
    仅返回聚合数据，用于首页展示
    """
    # 基础统计
    total_articles = db.query(func.count(Article.id)).filter(Article.is_published == True).scalar() or 0
    total_views = db.query(func.sum(Article.view_count)).filter(Article.is_published == True).scalar() or 0
    total_comments = db.query(func.count(Comment.id)).scalar() or 0

    # 月度文章发布统计（最近6个月）
    six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
    monthly_stats = db.query(
        func.extract('year', Article.published_at).label('year'),
        func.extract('month', Article.published_at).label('month'),
        func.count(Article.id).label('articles'),
        func.sum(Article.view_count).label('views')
    ).filter(
        Article.is_published == True,
        Article.published_at >= six_months_ago,
        Article.published_at.isnot(None)
    ).group_by(
        func.extract('year', Article.published_at),
        func.extract('month', Article.published_at)
    ).order_by(
        func.extract('year', Article.published_at),
        func.extract('month', Article.published_at)
    ).all()

    # 最近7天每日新增文章和评论（用于周活跃度展示）
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    daily_articles = db.query(
        func.date(Article.created_at).label('date'),
        func.count(Article.id).label('count')
    ).filter(
        Article.created_at >= seven_days_ago,
        Article.is_published == True
    ).group_by(func.date(Article.created_at)).order_by(func.date(Article.created_at)).all()

    daily_comments = db.query(
        func.date(Comment.created_at).label('date'),
        func.count(Comment.id).label('count')
    ).filter(
        Comment.created_at >= seven_days_ago
    ).group_by(func.date(Comment.created_at)).order_by(func.date(Comment.created_at)).all()

    return {
        "total_articles": total_articles,
        "total_views": int(total_views),
        "total_comments": total_comments,
        "monthly_stats": [
            {
                "year": int(row.year),
                "month": int(row.month),
                "articles": row.articles,
                "views": int(row.views or 0)
            }
            for row in monthly_stats
        ],
        "daily_articles": [
            {"date": str(row.date), "count": row.count}
            for row in daily_articles
        ],
        "daily_comments": [
            {"date": str(row.date), "count": row.count}
            for row in daily_comments
        ]
    }
