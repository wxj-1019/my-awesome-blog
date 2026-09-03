"""add comment reply and ordering indexes

Revision ID: 020
Revises: 019
Create Date: 2026-09-04

Changes:
- Create index on comments.parent_id（回复树查询 WHERE parent_id = ? 此前全表扫描）
- Create index on comments.created_at（评论列表 ORDER BY created_at）

同时将 DB 已有但模型缺失的索引（article_id / author_id / is_deleted /
deleted_at）在 app/models/comment.py、app/models/article.py 模型侧补
index=True 对齐，避免 alembic autogenerate 误删既有索引。
"""

from alembic import op

revision = "020"
down_revision = "019"
branch_labels = None
depends_on = None


def upgrade():
    """为 comments 表补充回复树与排序索引"""
    op.create_index("ix_comments_parent_id", "comments", ["parent_id"])
    op.create_index("ix_comments_created_at", "comments", ["created_at"])


def downgrade():
    op.drop_index("ix_comments_created_at", table_name="comments")
    op.drop_index("ix_comments_parent_id", table_name="comments")
