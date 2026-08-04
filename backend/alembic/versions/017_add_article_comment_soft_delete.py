"""add soft delete fields to articles and comments

Revision ID: 017
Revises: 016
Create Date: 2026-08-04

Changes:
- Add is_deleted / deleted_at columns to articles table
- Add is_deleted / deleted_at columns to comments table
- Create indexes for soft delete queries

对齐 app/models/article.py 与 app/models/comment.py 的软删除字段，
与既有 conversations / memories（迁移 013）保持一致。
模型层默认 is_deleted=False，CRUD 在 include_deleted=False 时过滤已删除记录。
"""

from alembic import op
import sqlalchemy as sa

revision = "017"
down_revision = "016"
branch_labels = None
depends_on = None


def upgrade():
    """为 articles / comments 表补充软删除字段与索引"""
    # articles
    op.add_column(
        "articles",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "articles",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_articles_is_deleted", "articles", ["is_deleted"])
    op.create_index("ix_articles_deleted_at", "articles", ["deleted_at"])

    # comments
    op.add_column(
        "comments",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "comments",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_comments_is_deleted", "comments", ["is_deleted"])
    op.create_index("ix_comments_deleted_at", "comments", ["deleted_at"])


def downgrade():
    """回滚软删除字段"""
    # comments
    op.drop_index("ix_comments_deleted_at", table_name="comments")
    op.drop_index("ix_comments_is_deleted", table_name="comments")
    op.drop_column("comments", "deleted_at")
    op.drop_column("comments", "is_deleted")

    # articles
    op.drop_index("ix_articles_deleted_at", table_name="articles")
    op.drop_index("ix_articles_is_deleted", table_name="articles")
    op.drop_column("articles", "deleted_at")
    op.drop_column("articles", "is_deleted")
