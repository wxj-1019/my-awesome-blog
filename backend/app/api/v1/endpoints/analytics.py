from typing import Any, Dict, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.database import get_db
from app.core.dependencies import get_current_superuser
from app import crud
from app.models.user import User
from app.models.article import Article
from app.models.comment import Comment

router = APIRouter()


@router.get("/growth-stats", response_model=Dict)
def get_growth_stats(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)  # Only superusers can access analytics
) -> Any:
    """
    获取增长统计数据
    """
    stats = crud.get_article_growth_stats(db, days=days)
    return stats


@router.get("/engagement-stats", response_model=Dict)
def get_engagement_stats(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)  # Only superusers can access analytics
) -> Any:
    """
    获取用户参与度统计数据
    """
    stats = crud.get_user_engagement_stats(db, days=days)
    return stats


@router.get("/top-authors-by-articles", response_model=List[Dict])
def get_top_authors_by_articles(
    limit: int = Query(10, ge=1, le=50, description="Number of top authors to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)  # Only superusers can access analytics
) -> Any:
    """
    获取发布文章最多的作者
    """
    authors = crud.get_top_authors_by_articles(db, limit=limit)
    return authors


@router.get("/top-authors-by-views", response_model=List[Dict])
def get_top_authors_by_views(
    limit: int = Query(10, ge=1, le=50, description="Number of top authors to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)  # Only superusers can access analytics
) -> Any:
    """
    获取总浏览量最高的作者
    """
    authors = crud.get_top_authors_by_views(db, limit=limit)
    return authors


@router.get("/monthly-stats", response_model=Dict)
def get_monthly_stats(
    months: int = Query(6, ge=1, le=24, description="Number of months to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)  # Only superusers can access analytics
) -> Any:
    """
    获取月度统计信息
    """
    stats = crud.get_monthly_statistics(db, months=months)
    return stats


@router.get("/content-insights", response_model=Dict)
def get_content_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)  # Only superusers can access analytics
) -> Any:
    """
    获取内容洞察数据
    """
    insights = crud.get_content_insights(db)
    return insights


@router.get("/dashboard-summary", response_model=Dict)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)  # Only superusers can access analytics
) -> Any:
    """
    获取仪表板摘要信息
    """
    # 获取各种统计数据
    total_articles = db.query(Article).filter(Article.is_published == True).count()
    total_users = db.query(User).count()
    total_comments = db.query(Comment).count()
    total_views = db.query(func.sum(Article.view_count)).scalar() or 0
    
    # 获取最近一周的数据
    last_week = datetime.utcnow() - timedelta(days=7)
    new_articles = db.query(Article).filter(Article.created_at >= last_week).count()
    new_users = db.query(User).filter(User.created_at >= last_week).count()
    new_comments = db.query(Comment).filter(Comment.created_at >= last_week).count()
    
    # 获取热门文章
    from sqlalchemy import desc
    top_articles = db.query(Article).filter(
        Article.is_published == True
    ).order_by(
        desc(Article.view_count)
    ).limit(5).all()
    
    summary = {
        "total_articles": total_articles,
        "total_users": total_users,
        "total_comments": total_comments,
        "total_views": total_views,
        "new_articles_last_week": new_articles,
        "new_users_last_week": new_users,
        "new_comments_last_week": new_comments,
        "top_articles": [
            {
                "id": str(article.id),
                "title": article.title,
                "view_count": article.view_count,
                "created_at": article.created_at
            } for article in top_articles
        ]
    }
    
    return summary