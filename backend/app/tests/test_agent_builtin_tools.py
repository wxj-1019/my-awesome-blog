"""内置站内工具测试（走 SQLite 内存库，只用 ilike 查询，不依赖 PG 全文搜索）"""
from app.agent.tools.builtin import get_article_detail, get_site_stats, search_articles
from app.models import Article, User


def _create_article(db, title="Next.js 实战指南", slug="nextjs-guide", is_published=True):
    author = db.query(User).first()  # conftest 认证 mock 已持久化一个用户
    article = Article(
        title=title, slug=slug, content="这是一篇关于 Next.js App Router 的长文" * 10,
        excerpt="Next.js 入门到进阶", is_published=is_published, author_id=author.id,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


def test_search_articles_hit(client, test_session):
    _create_article(test_session)
    result = search_articles(test_session, query="Next.js")
    assert "Next.js 实战指南" in result
    assert "nextjs-guide" in result


def test_search_articles_miss(client, test_session):
    _create_article(test_session)
    assert "未找到" in search_articles(test_session, query="不存在的词xyz")


def test_search_articles_excludes_unpublished(client, test_session):
    _create_article(test_session, title="草稿", slug="draft-1", is_published=False)
    assert "未找到" in search_articles(test_session, query="草稿")


def test_get_article_detail(client, test_session):
    _create_article(test_session)
    result = get_article_detail(test_session, slug="nextjs-guide")
    assert "Next.js 实战指南" in result
    assert "正文" in result


def test_get_article_detail_not_found(client, test_session):
    assert "未找到" in get_article_detail(test_session, slug="no-such-slug")


def test_get_site_stats(client, test_session):
    _create_article(test_session)
    result = get_site_stats(test_session)
    assert "已发布文章 1 篇" in result


def test_search_articles_via_registry_execute(client, test_session):
    """经 ToolRegistry.execute 调用：bind 校验兼容 + 字符串 limit 容错"""
    from app.agent.tools.builtin import register_builtin_tools
    from app.agent.tools.registry import ToolRegistry

    _create_article(test_session)
    registry = register_builtin_tools(ToolRegistry())
    result = registry.execute(test_session, "search_articles", {"query": "Next.js", "limit": "3"})
    assert "Next.js 实战指南" in result
    # 非法 limit 落回默认值而不是抛异常
    result2 = registry.execute(test_session, "search_articles", {"query": "Next.js", "limit": "abc"})
    assert "Next.js 实战指南" in result2
    # 缺必填参数走「参数不合法」分支
    result3 = registry.execute(test_session, "search_articles", {})
    assert "参数不合法" in result3
