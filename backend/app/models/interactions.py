"""用户互动模型：文章点赞 / 收藏 / 关注作者。

三张表均为"主体+客体"唯一约束的开关型记录：存在即生效，删除即取消。
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, func
from app.core.database import Base
from app.core.types import UUIDType


class ArticleLike(Base):
    __tablename__ = "article_likes"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    article_id = Column(UUIDType, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("article_id", "user_id", name="uq_article_likes_article_user"),
    )


class ArticleBookmark(Base):
    __tablename__ = "article_bookmarks"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    article_id = Column(UUIDType, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("article_id", "user_id", name="uq_article_bookmarks_article_user"),
    )


class UserFollow(Base):
    __tablename__ = "user_follows"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    follower_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_user_follows_pair"),
        CheckConstraint("follower_id != following_id", name="ck_user_follows_not_self"),
    )
