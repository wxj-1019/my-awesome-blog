"""add writing sessions

Revision ID: 015
Revises: 014
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "writing_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("article_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("stage", sa.String(length=32), nullable=False, server_default="clarifying"),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="active"),
        sa.Column("requirements_summary", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("outline", sa.Text(), nullable=False, server_default=""),
        sa.Column("draft", sa.Text(), nullable=False, server_default=""),
        sa.Column("messages", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("suggestions", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("revisions", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["article_id"], ["articles.id"], ondelete="SET NULL"),
    )
    op.create_index("idx_writing_sessions_user_id", "writing_sessions", ["user_id"])
    op.create_index("idx_writing_sessions_article_id", "writing_sessions", ["article_id"])
    op.create_index("idx_writing_sessions_stage", "writing_sessions", ["stage"])
    op.create_index("idx_writing_sessions_status", "writing_sessions", ["status"])
    op.create_index(
        "idx_writing_sessions_user_status_updated",
        "writing_sessions",
        ["user_id", "status", "updated_at"],
    )


def downgrade():
    op.drop_table("writing_sessions")
