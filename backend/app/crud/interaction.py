"""互动 CRUD：点赞 / 收藏 / 关注的开关型操作。

记录存在即生效、删除即取消；返回布尔表示操作后的状态。
"""

import uuid
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.article import Article
from app.models.interactions import ArticleBookmark, ArticleLike, UserFollow


def _toggle(db: Session, model, filter_expr, **new_row) -> bool:
    """通用开关：记录存在则删除（返回 False），否则插入（返回 True）"""
    existing = db.query(model).filter(filter_expr).first()
    if existing:
        db.delete(existing)
        db.commit()
        return False
    db.add(model(id=uuid.uuid4(), **new_row))
    db.commit()
    return True


def toggle_article_like(db: Session, article_id: UUID, user_id: UUID) -> bool:
    return _toggle(
        db, ArticleLike,
        (ArticleLike.article_id == article_id) & (ArticleLike.user_id == user_id),
        article_id=article_id, user_id=user_id,
    )


def is_article_liked(db: Session, article_id: UUID, user_id: UUID) -> bool:
    return db.query(ArticleLike).filter(
        ArticleLike.article_id == article_id, ArticleLike.user_id == user_id
    ).first() is not None


def toggle_article_bookmark(db: Session, article_id: UUID, user_id: UUID) -> bool:
    return _toggle(
        db, ArticleBookmark,
        (ArticleBookmark.article_id == article_id) & (ArticleBookmark.user_id == user_id),
        article_id=article_id, user_id=user_id,
    )


def is_article_bookmarked(db: Session, article_id: UUID, user_id: UUID) -> bool:
    return db.query(ArticleBookmark).filter(
        ArticleBookmark.article_id == article_id, ArticleBookmark.user_id == user_id
    ).first() is not None


def toggle_follow(db: Session, follower_id: UUID, following_id: UUID) -> bool:
    return _toggle(
        db, UserFollow,
        (UserFollow.follower_id == follower_id) & (UserFollow.following_id == following_id),
        follower_id=follower_id, following_id=following_id,
    )


def is_following(db: Session, follower_id: UUID, following_id: UUID) -> bool:
    return db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id, UserFollow.following_id == following_id
    ).first() is not None


def article_exists(db: Session, article_id: UUID) -> bool:
    return db.query(Article.id).filter(Article.id == article_id).first() is not None
