"""
Add soft delete fields to conversations and memories tables

Revision ID: 013
Revises: 012
Create Date: 2026-03-22

Changes:
- Add deleted_at, is_deleted columns to conversations table
- Add deleted_at, is_deleted columns to memories table
- Create indexes for soft delete queries
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade():
    """
    Upgrade database schema
    Add soft delete fields to conversations and memories tables
    """
    # Add soft delete fields to conversations table
    op.add_column(
        'conversations',
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'conversations',
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false')
    )
    
    # Create indexes for conversations soft delete queries
    op.create_index(
        'idx_conversation_deleted_at',
        'conversations',
        ['deleted_at']
    )
    op.create_index(
        'idx_conversation_is_deleted',
        'conversations',
        ['is_deleted']
    )
    op.create_index(
        'idx_conversation_active',
        'conversations',
        ['is_deleted', 'tenant_id', 'user_id']
    )
    
    # Add soft delete fields to memories table
    op.add_column(
        'memories',
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'memories',
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false')
    )
    
    # Create indexes for memories soft delete queries
    op.create_index(
        'idx_memory_deleted_at',
        'memories',
        ['deleted_at']
    )
    op.create_index(
        'idx_memory_is_deleted',
        'memories',
        ['is_deleted']
    )
    op.create_index(
        'idx_memory_active',
        'memories',
        ['is_deleted', 'tenant_id', 'user_id']
    )
    
    # Add comment to document the fields
    op.execute("""
        COMMENT ON COLUMN conversations.deleted_at IS 'Soft delete timestamp - when the record was soft deleted';
    """)
    op.execute("""
        COMMENT ON COLUMN conversations.is_deleted IS 'Soft delete flag - true if the record is soft deleted';
    """)
    op.execute("""
        COMMENT ON COLUMN memories.deleted_at IS 'Soft delete timestamp - when the record was soft deleted';
    """)
    op.execute("""
        COMMENT ON COLUMN memories.is_deleted IS 'Soft delete flag - true if the record is soft deleted';
    """)


def downgrade():
    """
    Downgrade database schema
    Remove soft delete fields from conversations and memories tables
    """
    # Drop indexes for memories
    op.drop_index('idx_memory_active', table_name='memories')
    op.drop_index('idx_memory_is_deleted', table_name='memories')
    op.drop_index('idx_memory_deleted_at', table_name='memories')
    
    # Drop columns from memories
    op.drop_column('memories', 'is_deleted')
    op.drop_column('memories', 'deleted_at')
    
    # Drop indexes for conversations
    op.drop_index('idx_conversation_active', table_name='conversations')
    op.drop_index('idx_conversation_is_deleted', table_name='conversations')
    op.drop_index('idx_conversation_deleted_at', table_name='conversations')
    
    # Drop columns from conversations
    op.drop_column('conversations', 'is_deleted')
    op.drop_column('conversations', 'deleted_at')
