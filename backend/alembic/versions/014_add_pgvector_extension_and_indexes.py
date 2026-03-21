"""
Add pgvector extension and vector indexes for memory embeddings

Revision ID: 014
Revises: 013
Create Date: 2026-03-22

Changes:
- Install pgvector extension
- Modify memories.embedding column to use vector type
- Create vector indexes for similarity search
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade():
    """
    Upgrade database schema
    Install pgvector and create vector indexes
    """
    # Install pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    
    # Convert memories.embedding from text to vector(1536)
    # First, handle existing data - we need to drop and recreate the column
    # Note: This will lose existing embedding data if any exists
    
    # Check if there's existing data
    result = op.execute("SELECT COUNT(*) FROM memories WHERE embedding IS NOT NULL")
    count = result.scalar()
    
    if count > 0:
        # Backup existing data (optional - for production, consider a data migration)
        op.execute("""
            ALTER TABLE memories 
            ADD COLUMN embedding_backup TEXT
        """)
        op.execute("""
            UPDATE memories 
            SET embedding_backup = embedding 
            WHERE embedding IS NOT NULL
        """)
    
    # Drop existing embedding column
    op.drop_column('memories', 'embedding')
    
    # Add new embedding column with vector type
    op.execute("""
        ALTER TABLE memories 
        ADD COLUMN embedding vector(1536)
    """)
    
    # Create IVFFlat index for vector similarity search
    # IVFFlat is good for medium accuracy and fast build time
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_memory_embedding_ivfflat 
        ON memories 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """)
    
    # Alternative: HNSW index for higher accuracy (uncomment if needed)
    # op.execute("""
    #     CREATE INDEX IF NOT EXISTS idx_memory_embedding_hnsw 
    #     ON memories 
    #     USING hnsw (embedding vector_cosine_ops)
    # """)
    
    # Create partial index for active memories (not deleted)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_memory_embedding_active 
        ON memories 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
        WHERE is_deleted = false
    """)
    
    # Add comment
    op.execute("""
        COMMENT ON COLUMN memories.embedding IS 'Vector embedding (1536 dimensions) for semantic search using pgvector';
    """)
    
    # Create helper function for similarity search (optional)
    op.execute("""
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
    """)
    
    # Add comment for function
    op.execute("""
        COMMENT ON FUNCTION search_similar_memories IS 
        'Search for similar memories using cosine similarity on vector embeddings';
    """)


def downgrade():
    """
    Downgrade database schema
    Remove pgvector extension and vector indexes
    """
    # Drop function
    op.execute("DROP FUNCTION IF EXISTS search_similar_memories")
    
    # Drop vector indexes
    op.execute("DROP INDEX IF EXISTS idx_memory_embedding_active")
    op.execute("DROP INDEX IF EXISTS idx_memory_embedding_ivfflat")
    op.execute("DROP INDEX IF EXISTS idx_memory_embedding_hnsw")
    
    # Convert vector column back to text
    op.drop_column('memories', 'embedding')
    op.add_column(
        'memories',
        sa.Column('embedding', sa.Text(), nullable=True)
    )
    
    # Restore backup data if exists
    op.execute("""
        UPDATE memories 
        SET embedding = embedding_backup 
        WHERE embedding_backup IS NOT NULL
    """)
    op.drop_column('memories', 'embedding_backup')
    
    # Note: We don't drop the pgvector extension in downgrade
    # as it might be used by other parts of the system
