import os

import pytest


# 全文搜索依赖 PostgreSQL 的 tsvector，SQLite 测试环境无法运行
pytestmark = pytest.mark.skipif(
    "sqlite" in os.environ.get("DATABASE_URL", "").lower(),
    reason="SQLite 不支持 PostgreSQL 全文搜索"
)


def test_fulltext_search_articles(client, db):
    """测试全文搜索功能"""
    pass


def test_fulltext_search_with_unpublished_articles(client, db):
    """测试全文搜索是否正确处理已发布和未发布的文章"""
    pass


def test_fulltext_search_empty_query(client):
    """测试空查询的处理"""
    pass


def test_fulltext_search_special_characters(client, db):
    """测试包含特殊字符的搜索查询"""
    pass
