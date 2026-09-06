"""add article likes / bookmarks and user follows

Revision ID: 022
Revises: 021
Create Date: 2026-09-06

Changes:
- article_likes：文章点赞（article_id + user_id 唯一，防重复点赞）
- article_bookmarks：文章收藏（同构唯一约束）
- user_follows：关注作者（follower → following 唯一，反向索引供粉丝查询）

配套详情页点赞/收藏/关注按钮的真实化（此前为纯本地 state 假交互），
Article.likes_count 同步改为 column_property 真实计数。
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "022"
down_revision = "021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "article_likes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("article_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("articles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("article_id", "user_id", name="uq_article_likes_article_user"),
    )
    op.create_index("ix_article_likes_user_id", "article_likes", ["user_id"])

    op.create_table(
        "article_bookmarks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("article_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("articles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("article_id", "user_id", name="uq_article_bookmarks_article_user"),
    )
    op.create_index("ix_article_bookmarks_user_id", "article_bookmarks", ["user_id"])

    op.create_table(
        "user_follows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("follower_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("following_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("follower_id", "following_id", name="uq_user_follows_pair"),
        sa.CheckConstraint("follower_id != following_id", name="ck_user_follows_not_self"),
    )
    op.create_index("ix_user_follows_following_id", "user_follows", ["following_id"])


def downgrade() -> None:
    op.drop_table("user_follows")
    op.drop_table("article_bookmarks")
    op.drop_table("article_likes")
