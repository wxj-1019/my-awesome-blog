"""互动 CRUD：点赞 / 收藏 / 关注的开关型操作。

记录存在即生效、删除即取消；返回布尔表示操作后的状态。
并发 toggle 的 insert 撞唯一约束时按"已存在"处理（返回 False），避免 500。
"""

import uuid
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.article import Article
from app.models.interactions import ArticleBookmark, ArticleLike, UserFollow
from app.models.user import User


def _toggle(db: Session, model, filter_expr, **new_row) -> bool:
    """通用开关：记录存在则删除（返回 False），否则插入（返回 True）。

    先查后插非原子：并发双击时插入可能撞唯一约束，捕获后按"已存在"语义
    返回 False（第二次点击的意图正是取消）。
    """
    existing = db.query(model).filter(filter_expr).first()
    if existing:
        db.delete(existing)
        db.commit()
        return False
    try:
        db.add(model(id=uuid.uuid4(), **new_row))
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        return False


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


def user_exists(db: Session, user_id: UUID) -> bool:
    return db.query(User.id).filter(User.id == user_id).first() is not None
