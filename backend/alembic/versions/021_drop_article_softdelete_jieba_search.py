"""drop article soft-delete; switch fulltext search to jieba tokenization

Revision ID: 021
Revises: 020
Create Date: 2026-09-06

Changes:
- Articles 弃用软删除（产品决策：文章删除即硬删；comments 的软删除不受影响）：
  drop articles.is_deleted / deleted_at 及迁移 017 创建的索引
- 全文搜索从 'english' tsvector 触发器改为应用层 jieba 分词：
  - drop 触发器 trig_articles_search_vector_update / 函数 articles_search_vector_update
    （'english' 配置对中文内容基本无效，且 AI 工具侧已禁用该搜索路径）
  - 迁移内用 jieba（requirements 已含）按 cut_for_search 重填全部文章的
    search_vector，查询侧配合 plainto_tsquery('simple', ...) 使用
"""

import sqlalchemy as sa
from alembic import op

revision = "021"
down_revision = "020"
branch_labels = None
depends_on = None


def _refill_search_vector() -> None:
    """按 jieba 搜索粒度分词重填全部文章的 search_vector（'simple' 配置）"""
    import jieba

    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id, title, excerpt, content FROM articles")
    ).fetchall()
    for row in rows:
        raw = " ".join(part for part in (row.title, row.excerpt, row.content) if part)
        tokens = " ".join(t.strip() for t in jieba.cut_for_search(raw) if t.strip())
        if not tokens:
            continue
        conn.execute(
            sa.text("UPDATE articles SET search_vector = to_tsvector('simple', :tok) WHERE id = :id"),
            {"tok": tokens, "id": row.id},
        )


def upgrade() -> None:
    # 全文搜索：移除英文 tsvector 自动触发器，改为应用层 jieba 分词。
    # 生产库实际未执行过 006（列/触发器/GIN 均缺失，版本号被 stamp 到位），
    # 故此处全部用 IF EXISTS / IF NOT EXISTS 补齐列与索引。
    op.execute("DROP TRIGGER IF EXISTS trig_articles_search_vector_update ON articles;")
    op.execute("DROP FUNCTION IF EXISTS articles_search_vector_update();")
    op.execute("ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector;")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_articles_search_vector "
        "ON articles USING GIN (search_vector);"
    )
    _refill_search_vector()

    # 软删除：文章删除语义为硬删，移除列与索引（迁移 017 创建）
    op.drop_index("ix_articles_deleted_at", table_name="articles")
    op.drop_index("ix_articles_is_deleted", table_name="articles")
    op.drop_column("articles", "deleted_at")
    op.drop_column("articles", "is_deleted")


def downgrade() -> None:
    # 还原软删除列与索引
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

    # 还原英文 tsvector 触发器（与迁移 006 一致）
    op.execute("ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector;")
    op.execute(
        """
        CREATE OR REPLACE FUNCTION articles_search_vector_update() RETURNS trigger AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
                setweight(to_tsvector('english', coalesce(NEW.excerpt, '')), 'C');
            RETURN NEW;
        END
        $$ LANGUAGE 'plpgsql';
        """
    )
    op.execute(
        """
        CREATE TRIGGER trig_articles_search_vector_update
        BEFORE INSERT OR UPDATE ON articles
        FOR EACH ROW EXECUTE PROCEDURE articles_search_vector_update();
        """
    )
    op.execute("UPDATE articles SET search_vector = search_vector WHERE true;")
