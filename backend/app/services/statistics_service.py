from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta, timezone
from typing import Dict, List
from app.models.article import Article
from app.models.category import Category
from app.models.tag import Tag
from app.models.comment import Comment
from app.models.user import User
from app.models.friend_link import FriendLink
from app.models.portfolio import Portfolio
from app.models.timeline_event import TimelineEvent
from app.models.subscription import Subscription
from app.crud.category import get_categories_with_article_count
from app.crud.tag import get_tags_with_article_count


class StatisticsService:
    @staticmethod
    def get_website_statistics(db: Session) -> Dict:
        """
        获取网站综合统计数据
        """
        # 文章统计
        total_articles = db.query(func.count(Article.id)).scalar()
        published_articles = db.query(func.count(Article.id)).filter(
            Article.is_published == True
        ).scalar()
        draft_articles = total_articles - published_articles

        # 分类统计
        total_categories = db.query(func.count(Category.id)).scalar()

        # 标签统计
        total_tags = db.query(func.count(Tag.id)).scalar()

        # 评论统计
        total_comments = db.query(func.count(Comment.id)).scalar()

        # 用户统计
        total_users = db.query(func.count(User.id)).scalar()
        active_users = db.query(func.count(User.id)).filter(
            User.is_active == True
        ).scalar()

        return {
            "articles": {
                "total": total_articles,
                "published": published_articles,
                "draft": draft_articles
            },
            "categories": {
                "total": total_categories
            },
            "tags": {
                "total": total_tags
            },
            "comments": {
                "total": total_comments
            },
            "users": {
                "total": total_users,
                "active": active_users
            }
        }

    @staticmethod
    def get_view_statistics(db: Session) -> Dict:
        """
        获取浏览量统计
        """
        # 总浏览量
        total_views = db.query(func.sum(Article.view_count)).scalar() or 0

        # 今日浏览量
        today = datetime.now(timezone.utc).date()
        today_views = db.query(func.sum(Article.view_count)).filter(
            func.date(Article.updated_at) == today
        ).scalar() or 0

        # 本周浏览量
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        week_views = db.query(func.sum(Article.view_count)).filter(
            Article.updated_at >= week_ago
        ).scalar() or 0

        # 本月浏览量
        month_ago = datetime.now(timezone.utc) - timedelta(days=30)
        month_views = db.query(func.sum(Article.view_count)).filter(
            Article.updated_at >= month_ago
        ).scalar() or 0

        return {
            "total": total_views,
            "today": today_views,
            "this_week": week_views,
            "this_month": month_views
        }

    @staticmethod
    def get_category_statistics(db: Session) -> List[Dict]:
        """
        获取分类统计（包含文章数量和浏览量）
        """
        # 使用优化的查询方法
        categories = get_categories_with_article_count(db)
        
        result = []
        for category in categories:
            # 获取该分类下文章的总浏览量
            view_count = db.query(func.sum(Article.view_count)).join(
                Article.categories
            ).filter(Category.id == category.id).scalar() or 0
            
            result.append({
                "id": category.id,
                "name": category.name,
                "slug": category.slug,
                "article_count": getattr(category, 'article_count', 0),
                "view_count": view_count
            })
        
        return result

    @staticmethod
    def get_tag_statistics(db: Session, limit: int = 50) -> List[Dict]:
        """
        获取标签统计（按文章数量排序）
        """
        # 使用优化的查询方法
        tags = get_tags_with_article_count(db, limit)
        
        result = []
        for tag in tags:
            # 获取该标签下文章的总浏览量
            view_count = db.query(func.sum(Article.view_count)).join(
                Article.tags
            ).filter(Tag.id == tag.id).scalar() or 0
            
            result.append({
                "id": tag.id,
                "name": tag.name,
                "slug": tag.slug,
                "article_count": getattr(tag, 'article_count', 0),
                "view_count": view_count
            })
        
        return result

    @staticmethod
    def get_author_statistics(db: Session) -> List[Dict]:
        """
        获取作者统计
        """
        from app.crud.user import get_authors_with_article_count
        
        authors = get_authors_with_article_count(db)
        
        result = []
        for author in authors:
            # 获取作者文章的总浏览量
            view_count = db.query(func.sum(Article.view_count)).filter(
                Article.author_id == author.id
            ).scalar() or 0
            
            result.append({
                "id": author.id,
                "username": author.username,
                "full_name": author.full_name,
                "article_count": getattr(author, 'article_count', 0),
                "view_count": view_count
            })
        
        return result

    @staticmethod
    def get_popular_articles(db: Session, limit: int = 5, days: int = 30) -> List[Dict]:
        """
        获取热门文章统计
        """
        from app.crud.article import get_popular_articles as get_popular
        
        articles = get_popular(db, limit, days)
        
        result = []
        for article in articles:
            result.append({
                "id": article.id,
                "title": article.title,
                "slug": article.slug,
                "view_count": article.view_count,
                "comment_count": len(article.comments) if hasattr(article, 'comments') else 0,
                "published_at": article.published_at
            })
        
        return result

    @staticmethod
    def get_engagement_statistics(db: Session) -> Dict:
        """
        获取用户参与度统计
        """
        # 平均评论数
        avg_comments_per_article = db.query(func.avg(func.count(Comment.id))).join(
            Article, Comment.article_id == Article.id
        ).filter(Article.is_published == True).scalar() or 0

        # 最受欢迎的文章（评论最多）
        most_commented_article = db.query(
            Article, func.count(Comment.id).label('comment_count')
        ).join(Comment, Comment.article_id == Article.id).filter(
            Article.is_published == True
        ).group_by(Article.id).order_by(func.count(Comment.id).desc()).first()

        # 平均阅读时间
        avg_read_time = db.query(func.avg(Article.read_time)).filter(
            Article.is_published == True, Article.read_time.isnot(None)
        ).scalar()

        return {
            "avg_comments_per_article": round(float(avg_comments_per_article), 2) if avg_comments_per_article else 0,
            "most_commented_article": {
                "id": most_commented_article[0].id if most_commented_article else None,
                "title": most_commented_article[0].title if most_commented_article else None,
                "comment_count": most_commented_article[1] if most_commented_article else 0
            } if most_commented_article else None,
            "avg_read_time": round(float(avg_read_time), 2) if avg_read_time else 0
        }

    @staticmethod
    def get_growth_statistics(db: Session, days: int = 30) -> Dict:
        """
        获取增长统计
        """
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # 每日新增文章数
        daily_articles = db.query(
            func.date(Article.created_at).label('date'),
            func.count(Article.id).label('count')
        ).filter(
            Article.created_at >= start_date,
            Article.is_published == True
        ).group_by(func.date(Article.created_at)).order_by(func.date(Article.created_at)).all()
        
        # 每日新增用户数
        daily_users = db.query(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('count')
        ).filter(
            User.created_at >= start_date
        ).group_by(func.date(User.created_at)).order_by(func.date(User.created_at)).all()
        
        # 每日新增评论数
        daily_comments = db.query(
            func.date(Comment.created_at).label('date'),
            func.count(Comment.id).label('count')
        ).filter(
            Comment.created_at >= start_date
        ).group_by(func.date(Comment.created_at)).order_by(func.date(Comment.created_at)).all()
        
        return {
            "daily_articles": [{"date": str(row.date), "count": row.count} for row in daily_articles],
            "daily_users": [{"date": str(row.date), "count": row.count} for row in daily_users],
            "daily_comments": [{"date": str(row.date), "count": row.count} for row in daily_comments]
        }

    @staticmethod
    def get_content_statistics(db: Session) -> Dict:
        """
        获取内容统计
        """
        # 文章平均长度
        avg_content_length = db.query(func.avg(func.length(Article.content))).filter(
            Article.is_published == True
        ).scalar()
        
        # 平均文章标题长度
        avg_title_length = db.query(func.avg(func.length(Article.title))).filter(
            Article.is_published == True
        ).scalar()
        
        # 按月统计文章发布情况
        monthly_stats = db.query(
            func.extract('year', Article.published_at).label('year'),
            func.extract('month', Article.published_at).label('month'),
            func.count(Article.id).label('count')
        ).filter(
            Article.is_published == True,
            Article.published_at.isnot(None)
        ).group_by(
            func.extract('year', Article.published_at),
            func.extract('month', Article.published_at)
        ).order_by(
            func.extract('year', Article.published_at).desc(),
            func.extract('month', Article.published_at).desc()
        ).all()
        
        return {
            "avg_content_length": round(float(avg_content_length), 2) if avg_content_length else 0,
            "avg_title_length": round(float(avg_title_length), 2) if avg_title_length else 0,
            "monthly_publication_stats": [
                {
                    "year": int(row.year),
                    "month": int(row.month),
                    "count": row.count
                } for row in monthly_stats
            ]
        }
    @staticmethod
    def get_general_statistics(db: Session) -> Dict:
        """
        获取通用网站统计（与测试期望格式一致）
        """
        total_articles = db.query(func.count(Article.id)).scalar()
        total_comments = db.query(func.count(Comment.id)).scalar()
        total_categories = db.query(func.count(Category.id)).scalar()
        total_tags = db.query(func.count(Tag.id)).scalar()
        total_users = db.query(func.count(User.id)).scalar()
        total_views = db.query(func.sum(Article.view_count)).scalar() or 0
        total_friend_links = db.query(func.count(FriendLink.id)).scalar()

        recent_signups = db.query(User).order_by(User.created_at.desc()).limit(5).all()
        recent_articles = db.query(Article).order_by(Article.created_at.desc()).limit(5).all()

        return {
            "total_users": total_users,
            "total_articles": total_articles,
            "total_comments": total_comments,
            "total_categories": total_categories,
            "total_tags": total_tags,
            "total_views": int(total_views),
            "total_friend_links": total_friend_links,
            "recent_signups": [
                {"id": str(u.id), "username": u.username, "created_at": u.created_at.isoformat() if u.created_at else None}
                for u in recent_signups
            ],
            "recent_articles": [
                {"id": str(a.id), "title": a.title, "created_at": a.created_at.isoformat() if a.created_at else None}
                for a in recent_articles
            ],
        }

    @staticmethod
    def get_article_statistics(db: Session) -> Dict:
        """
        获取文章统计（与测试期望格式一致）
        """
        total_articles = db.query(func.count(Article.id)).scalar()
        published_articles = db.query(func.count(Article.id)).filter(
            Article.is_published == True
        ).scalar()
        draft_articles = total_articles - published_articles

        top_viewed = db.query(Article).filter(
            Article.is_published == True
        ).order_by(Article.view_count.desc()).limit(5).all()

        recent = db.query(Article).order_by(Article.created_at.desc()).limit(5).all()

        categories = get_categories_with_article_count(db)
        articles_by_category = [
            {
                "id": str(c.id),
                "name": c.name,
                "article_count": getattr(c, "article_count", 0)
            }
            for c in categories
        ]

        monthly = db.query(
            func.extract('year', Article.created_at).label('year'),
            func.extract('month', Article.created_at).label('month'),
            func.count(Article.id).label('count')
        ).group_by(
            func.extract('year', Article.created_at),
            func.extract('month', Article.created_at)
        ).order_by(
            func.extract('year', Article.created_at).desc(),
            func.extract('month', Article.created_at).desc()
        ).all()

        return {
            "total_articles": total_articles,
            "published_articles": published_articles,
            "draft_articles": draft_articles,
            "top_viewed_articles": [
                {"id": str(a.id), "title": a.title, "view_count": a.view_count}
                for a in top_viewed
            ],
            "recent_articles": [
                {"id": str(a.id), "title": a.title, "created_at": a.created_at.isoformat() if a.created_at else None}
                for a in recent
            ],
            "articles_by_category": articles_by_category,
            "monthly_article_counts": [
                {"year": int(row.year), "month": int(row.month), "count": row.count}
                for row in monthly
            ],
        }

    @staticmethod
    def get_user_statistics(db: Session) -> Dict:
        """
        获取用户统计（与测试期望格式一致）
        """
        total_users = db.query(func.count(User.id)).scalar()
        active_users = db.query(func.count(User.id)).filter(
            User.is_active == True
        ).scalar()

        recent_registrations = db.query(User).order_by(User.created_at.desc()).limit(5).all()

        # 最近 30 天每日新增用户
        start_date = datetime.now(timezone.utc) - timedelta(days=30)
        daily_users = db.query(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('count')
        ).filter(
            User.created_at >= start_date
        ).group_by(func.date(User.created_at)).order_by(func.date(User.created_at)).all()

        return {
            "total_users": total_users,
            "active_users": active_users,
            "recent_registrations": [
                {"id": str(u.id), "username": u.username, "created_at": u.created_at.isoformat() if u.created_at else None}
                for u in recent_registrations
            ],
            "user_growth": [
                {"date": str(row.date), "count": row.count}
                for row in daily_users
            ],
        }
