"""add guest nickname to messages and comments

Revision ID: 018
Revises: 017
Create Date: 2026-08-05

Changes:
- messages.author_id 改为可空（游客留言不关联用户）
- messages 新增 nickname 列（游客昵称）
- comments.author_id 改为可空（游客评论不关联用户）
- comments 新增 nickname 列（游客昵称）

对齐 app/models/message.py 与 app/models/comment.py：
游客发布留言/评论时 author_id 为 NULL，展示昵称取 nickname（默认「匿名游客」）。
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade():
    """留言/评论支持游客发布：author_id 可空 + 新增 nickname"""
    # messages
    op.alter_column(
        "messages",
        "author_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )
    op.add_column("messages", sa.Column("nickname", sa.String(length=50), nullable=True))

    # comments
    op.alter_column(
        "comments",
        "author_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )
    op.add_column("comments", sa.Column("nickname", sa.String(length=50), nullable=True))


def downgrade():
    """回滚：恢复 author_id 非空并移除 nickname"""
    # comments
    op.drop_column("comments", "nickname")
    op.alter_column(
        "comments",
        "author_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )

    # messages
    op.drop_column("messages", "nickname")
    op.alter_column(
        "messages",
        "author_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
