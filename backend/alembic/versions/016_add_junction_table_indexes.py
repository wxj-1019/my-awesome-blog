"""add indexes on article junction tables

Revision ID: 016
Revises: 015

按分类/标签筛选文章时使用 ArticleCategory.category_id / ArticleTag.tag_id
做 join 过滤，但关联表主键是 (article_id, category_id) 复合主键，
category_id / tag_id 不在最左前缀，筛选走全表扫描。补充单列索引。
"""
from alembic import op

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "ix_article_categories_category_id",
        "article_categories",
        ["category_id"],
    )
    op.create_index(
        "ix_article_tags_tag_id",
        "article_tags",
        ["tag_id"],
    )


def downgrade():
    op.drop_index("ix_article_tags_tag_id", table_name="article_tags")
    op.drop_index("ix_article_categories_category_id", table_name="article_categories")
