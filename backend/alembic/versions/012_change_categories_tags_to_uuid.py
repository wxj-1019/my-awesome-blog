"""change categories and tags id to uuid

Revision ID: 012
Revises: 011
Create Date: 2026-02-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid


revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table('article_categories')
    op.drop_table('article_tags')
    
    op.execute('DROP TABLE IF EXISTS categories')
    op.execute('DROP TABLE IF EXISTS tags')
    
    op.execute('''
        CREATE TABLE categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) NOT NULL UNIQUE,
            slug VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            color VARCHAR(7),
            icon VARCHAR(50),
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        )
    ''')
    
    op.execute('''
        CREATE TABLE tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) NOT NULL UNIQUE,
            slug VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            color VARCHAR(7),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ''')
    
    op.execute('''
        CREATE TABLE article_categories (
            article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            is_primary BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (article_id, category_id)
        )
    ''')
    
    op.execute('''
        CREATE TABLE article_tags (
            article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            PRIMARY KEY (article_id, tag_id)
        )
    ''')
    
    op.create_index('ix_categories_id', 'categories', ['id'])
    op.create_index('ix_tags_id', 'tags', ['id'])


def downgrade():
    op.drop_table('article_tags')
    op.drop_table('article_categories')
    op.drop_table('tags')
    op.drop_table('categories')
    
    op.execute('''
        CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            slug VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            color VARCHAR(7),
            icon VARCHAR(50),
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        )
    ''')
    
    op.execute('''
        CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            slug VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            color VARCHAR(7),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ''')
    
    op.execute('''
        CREATE TABLE article_categories (
            article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            is_primary BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (article_id, category_id)
        )
    ''')
    
    op.execute('''
        CREATE TABLE article_tags (
            article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            PRIMARY KEY (article_id, tag_id)
        )
    ''')
    
    op.create_index('ix_categories_id', 'categories', ['id'])
    op.create_index('ix_tags_id', 'tags', ['id'])
