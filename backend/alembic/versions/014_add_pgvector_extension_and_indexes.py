"""
Add pgvector extension and vector indexes for memory embeddings

Revision ID: 014
Revises: 013
Create Date: 2026-03-22

Changes:
- Install pgvector extension (PostgreSQL only; skip gracefully if unavailable)
- Modify memories.embedding column to use vector type when extension exists
- Create vector indexes for similarity search
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def _is_postgresql() -> bool:
    bind = op.get_bind()
    return bind.dialect.name == "postgresql"


def _scalar_count(sql: str) -> int:
    """SQLAlchemy 2.x: op.execute 不再返回可用 Result，需用 connection.execute."""
    bind = op.get_bind()
    result = bind.execute(text(sql))
    value = result.scalar()
    return int(value or 0)


def upgrade() -> None:
    """Install pgvector and convert embedding column when possible."""
    if not _is_postgresql():
        # SQLite / 测试环境：不安装扩展，保持 text 列即可
        return

    bind = op.get_bind()

    # 扩展可能因权限/未安装而失败：不阻断后续业务表迁移策略
    try:
        bind.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    except Exception:
        # 无 pgvector 时跳过向量列转换，避免整条链卡死
        return

    # 检测 embedding 是否已是 vector 类型
    col_type = bind.execute(
        text(
            """
            SELECT data_type, udt_name
            FROM information_schema.columns
            WHERE table_name = 'memories' AND column_name = 'embedding'
            """
        )
    ).first()

    if col_type is None:
        # memories 表不存在时跳过
        return

    data_type, udt_name = col_type[0], col_type[1]
    already_vector = (udt_name or "").lower() == "vector" or "vector" in (data_type or "").lower()
    if already_vector:
        # 仅确保索引存在
        bind.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS idx_memory_embedding_ivfflat
                ON memories
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100)
                """
            )
        )
        return

    count = _scalar_count("SELECT COUNT(*) FROM memories WHERE embedding IS NOT NULL")

    if count > 0:
        bind.execute(text("ALTER TABLE memories ADD COLUMN IF NOT EXISTS embedding_backup TEXT"))
        bind.execute(
            text(
                """
                UPDATE memories
                SET embedding_backup = embedding
                WHERE embedding IS NOT NULL AND embedding_backup IS NULL
                """
            )
        )

    op.drop_column("memories", "embedding")
    bind.execute(text("ALTER TABLE memories ADD COLUMN embedding vector(1536)"))

    bind.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS idx_memory_embedding_ivfflat
            ON memories
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100)
            """
        )
    )

    # 部分索引依赖 is_deleted（013 已添加）
    bind.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS idx_memory_embedding_active
            ON memories
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100)
            WHERE is_deleted = false
            """
        )
    )

    bind.execute(
        text(
            """
            COMMENT ON COLUMN memories.embedding IS
            'Vector embedding (1536 dimensions) for semantic search using pgvector'
            """
        )
    )

    bind.execute(
        text(
            """
            CREATE OR REPLACE FUNCTION search_similar_memories(
                query_embedding vector(1536),
                match_threshold float,
                match_count int,
                p_tenant_id uuid,
                p_user_id uuid
            )
            RETURNS TABLE(
                id uuid,
                content text,
                memory_type varchar,
                importance float,
                similarity float
            )
            LANGUAGE plpgsql
            AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    m.id,
                    m.content,
                    m.memory_type,
                    m.importance,
                    1 - (m.embedding <=> query_embedding) AS similarity
                FROM memories m
                WHERE
                    m.is_deleted = false
                    AND m.tenant_id = p_tenant_id
                    AND m.user_id = p_user_id
                    AND m.embedding IS NOT NULL
                    AND 1 - (m.embedding <=> query_embedding) > match_threshold
                ORDER BY m.embedding <=> query_embedding
                LIMIT match_count;
            END;
            $$;
            """
        )
    )

    bind.execute(
        text(
            """
            COMMENT ON FUNCTION search_similar_memories IS
            'Search for similar memories using cosine similarity on vector embeddings'
            """
        )
    )


def downgrade() -> None:
    if not _is_postgresql():
        return

    bind = op.get_bind()
    bind.execute(text("DROP FUNCTION IF EXISTS search_similar_memories"))
    bind.execute(text("DROP INDEX IF EXISTS idx_memory_embedding_active"))
    bind.execute(text("DROP INDEX IF EXISTS idx_memory_embedding_ivfflat"))
    bind.execute(text("DROP INDEX IF EXISTS idx_memory_embedding_hnsw"))

    # 仅当当前是 vector 时回退为 text
    col = bind.execute(
        text(
            """
            SELECT udt_name FROM information_schema.columns
            WHERE table_name = 'memories' AND column_name = 'embedding'
            """
        )
    ).scalar()
    if col and str(col).lower() == "vector":
        op.drop_column("memories", "embedding")
        op.add_column("memories", sa.Column("embedding", sa.Text(), nullable=True))
        bind.execute(
            text(
                """
                UPDATE memories
                SET embedding = embedding_backup
                WHERE embedding_backup IS NOT NULL
                """
            )
        )
        # embedding_backup 可能不存在
        try:
            op.drop_column("memories", "embedding_backup")
        except Exception:
            pass
