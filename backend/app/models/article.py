from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, BigInteger, Index, func, select
from sqlalchemy.orm import column_property, relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType
from app.models.comment import Comment


class Article(Base):
    __tablename__ = "articles"

    # 添加复合索引以优化常用查询
    __table_args__ = (
        Index('idx_article_published_created', 'is_published', 'created_at'),  # 按发布状态和时间查询
        Index('idx_article_author_published', 'author_id', 'is_published'),   # 按作者和发布状态查询
        Index('idx_article_published_featured', 'is_published', 'is_featured', 'created_at'),  # 精选文章查询
        Index('idx_article_published_pinned', 'is_published', 'is_pinned', 'published_at'),    # 置顶文章查询
    )

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    # 真实评论计数（排除软删除评论）：相关子查询走 ix_comments_article_id 索引，
    # 替代 schema 中恒为 0 的幽灵字段；序列化 ArticleWithAuthor 时自动带出。
    # correlate_except(Comment)：子查询自身 FROM comments，绝不能被相关掉——
    # 否则以 comments 为主表的查询会因 FROM 全部被相关而报 auto-correlation 错误
    comments_count = column_property(
        select(func.count(1))
        .where(Comment.article_id == id, Comment.is_deleted == False)  # noqa: E712
        .correlate_except(Comment)
        .scalar_subquery()
    )
    title = Column(String(200), nullable=False, index=True)  # 添加索引以加快搜索
    slug = Column(String(200), unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(String(500), index=True)  # 添加索引以加快搜索
    cover_image = Column(String(255))
    is_published = Column(Boolean, default=False, index=True)  # 添加索引以加快过滤
    published_at = Column(DateTime(timezone=True), index=True)  # 添加索引以加快按时间排序
    view_count = Column(Integer, default=0, index=True)  # 添加索引以加快排序
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)  # 添加索引以加快按时间排序
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # 新增字段
    read_time = Column(Integer, index=True)  # 阅读时长（分钟），添加索引以加快排序
    featured_image_id = Column(UUIDType, ForeignKey("images.id"))
    is_featured = Column(Boolean, default=False, index=True)  # 添加索引以加快过滤
    is_pinned = Column(Boolean, default=False, index=True)  # 添加索引以加快过滤
    meta_title = Column(String(200))
    meta_description = Column(Text, index=True)  # 添加索引以加快搜索

    # Foreign keys
    author_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)  # 添加索引以加快JOIN操作
    featured_image = relationship("Image", foreign_keys=[featured_image_id])

    # Relationships
    author = relationship("User", back_populates="articles")
    comments = relationship("Comment", back_populates="article", cascade="all, delete-orphan")
    attachments = relationship("ArticleAttachment", back_populates="article", cascade="all, delete-orphan", order_by="ArticleAttachment.sort_order")
    categories = relationship("Category", secondary="article_categories", back_populates="articles", overlaps="article_categories")
    tags = relationship("Tag", secondary="article_tags", back_populates="articles", overlaps="article_tags")
    article_categories = relationship("ArticleCategory", back_populates="article", cascade="all, delete-orphan", overlaps="categories")
    article_tags = relationship("ArticleTag", back_populates="article", cascade="all, delete-orphan", overlaps="tags")