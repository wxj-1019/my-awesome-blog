"""相关文章推荐（加权评分版）测试：/api/v1/articles/{id}/related

覆盖：多 tag 重叠排序正确、候选池为空回退旧逻辑、不包含自身、未发布不出现。
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.models.article import Article
from app.models.category import Category
from app.models.tag import Tag
from app.models.user import User


@pytest.fixture
def author(test_session):
    user = User(
        tenant_id=uuid.uuid4(),
        username=f"rel-author-{uuid.uuid4().hex[:8]}",
        email=f"rel-{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="hashed_password",
        is_active=True,
    )
    test_session.add(user)
    test_session.commit()
    return user


def _days_ago(n: int) -> datetime:
    """naive UTC（SQLite DateTime 存 naive，评分侧统一 replace 时区）"""
    return datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=n)


def _make_article(session, user, title, slug, *, published=True, view_count=0,
                  published_at=None, excerpt=""):
    article = Article(
        title=title,
        slug=slug,
        content=f"{title} 的正文内容，用于相关文章推荐测试。",
        excerpt=excerpt,
        is_published=published,
        view_count=view_count,
        author_id=user.id,
        published_at=published_at,
    )
    session.add(article)
    session.commit()
    return article


def _related_ids(client, article) -> list[str]:
    resp = client.get(f"/api/v1/articles/related/{article.id}")
    assert resp.status_code == 200
    return [item["id"] for item in resp.json()]


def test_related_multi_tag_overlap_ordering(client, test_session, author):
    """多 tag 重叠排序正确：tag 全重叠 > 部分重叠；同分按 view_count、published_at 降序。

    所有文章共用 excerpt「统一摘要内容」，让关键词加分对每个候选一致，
    排序差异完全由 tag/分类/新鲜度因子决定，断言确定：
      B(6+2+k) > C(3+2+k) > D(0+2+k+近30天) = E(3+0+k)，D/E 同分同 view_count，
      published_at 降序 → D（1 天前）在 E（40 天前）前。
    """
    t1 = Tag(name=f"tag1-{uuid.uuid4().hex[:6]}", slug=f"tag1-{uuid.uuid4().hex[:6]}")
    t2 = Tag(name=f"tag2-{uuid.uuid4().hex[:6]}", slug=f"tag2-{uuid.uuid4().hex[:6]}")
    c1 = Category(name=f"Cat1-{uuid.uuid4().hex[:6]}", slug=f"cat1-{uuid.uuid4().hex[:6]}")
    c2 = Category(name=f"Cat2-{uuid.uuid4().hex[:6]}", slug=f"cat2-{uuid.uuid4().hex[:6]}")
    test_session.add_all([t1, t2, c1, c2])
    test_session.commit()

    article_a = _make_article(test_session, author, "Alpha Guide", f"a-{uuid.uuid4().hex[:8]}",
                              excerpt="统一摘要内容")
    for tag in (t1, t2):
        article_a.tags.append(tag)
    article_a.categories.append(c1)
    test_session.commit()

    article_b = _make_article(test_session, author, "Beta Guide", f"b-{uuid.uuid4().hex[:8]}",
                              view_count=10, published_at=_days_ago(40), excerpt="统一摘要内容")
    for tag in (t1, t2):  # 与 A 共享全部 2 个 tag → 最高分
        article_b.tags.append(tag)
    article_b.categories.append(c1)
    test_session.commit()

    article_c = _make_article(test_session, author, "Gamma Guide", f"c-{uuid.uuid4().hex[:8]}",
                              view_count=1000, published_at=_days_ago(40), excerpt="统一摘要内容")
    article_c.tags.append(t1)  # 共享 1 个 tag
    article_c.categories.append(c1)
    test_session.commit()

    article_d = _make_article(test_session, author, "Delta Guide", f"d-{uuid.uuid4().hex[:8]}",
                              view_count=1000, published_at=_days_ago(1), excerpt="统一摘要内容")
    article_d.categories.append(c1)  # 无共享 tag，仅同分类 + 近 30 天
    test_session.commit()

    article_e = _make_article(test_session, author, "Echo Guide", f"e-{uuid.uuid4().hex[:8]}",
                              view_count=1000, published_at=_days_ago(40), excerpt="统一摘要内容")
    article_e.tags.append(t1)  # 共享 1 个 tag，不同分类，老文章
    article_e.categories.append(c2)
    test_session.commit()

    # 同 tag 草稿：view_count 再高也不得出现
    article_f = _make_article(test_session, author, "Foxtrot Guide", f"f-{uuid.uuid4().hex[:8]}",
                              published=False, view_count=999999,
                              published_at=_days_ago(1), excerpt="统一摘要内容")
    article_f.tags.append(t1)
    test_session.commit()

    ids = _related_ids(client, article_a)
    assert ids == [str(article_b.id), str(article_c.id), str(article_d.id), str(article_e.id)]
    # 不包含自身
    assert str(article_a.id) not in ids
    # 未发布不出现
    assert str(article_f.id) not in ids


def test_related_fallback_when_no_overlap(client, test_session, author):
    """候选池为空（无共享 tag、无同分类）→ 回退旧逻辑：全站热门补充，保证有推荐"""
    hot = _make_article(test_session, author, "Hot Story", f"hot-{uuid.uuid4().hex[:8]}",
                        view_count=500)
    warm = _make_article(test_session, author, "Warm Story", f"warm-{uuid.uuid4().hex[:8]}",
                         view_count=100)
    lonely = _make_article(test_session, author, "Lonely Story", f"lonely-{uuid.uuid4().hex[:8]}")

    ids = _related_ids(client, lonely)
    assert ids == [str(hot.id), str(warm.id)]  # 旧逻辑按 view_count 降序
    assert str(lonely.id) not in ids


def test_related_fallback_when_same_category_only_self(client, test_session, author):
    """有分类但同分类只有自己、无 tag → 候选池空 → 回退热门补充"""
    category = Category(name=f"Solo-{uuid.uuid4().hex[:6]}", slug=f"solo-{uuid.uuid4().hex[:6]}")
    test_session.add(category)
    test_session.commit()

    main = _make_article(test_session, author, "Main Story", f"main-{uuid.uuid4().hex[:8]}")
    main.categories.append(category)
    test_session.commit()

    hot = _make_article(test_session, author, "Popular Story", f"pop-{uuid.uuid4().hex[:8]}",
                        view_count=300)

    ids = _related_ids(client, main)
    assert ids == [str(hot.id)]
    assert str(main.id) not in ids


def test_related_sql_count_within_budget(client, test_session, author):
    """性能预算：评分主路径单请求 SQL 条数 ≤4（实际 2 条：原文 + 候选池）"""
    from sqlalchemy import event

    t1 = Tag(name=f"sqltag-{uuid.uuid4().hex[:6]}", slug=f"sqltag-{uuid.uuid4().hex[:6]}")
    test_session.add(t1)
    test_session.commit()

    source = _make_article(test_session, author, "SQL Story", f"sql-{uuid.uuid4().hex[:8]}")
    source.tags.append(t1)
    test_session.commit()
    for i in range(3):
        cand = _make_article(test_session, author, f"Cand {i}", f"cand-{uuid.uuid4().hex[:8]}")
        cand.tags.append(t1)
        test_session.commit()

    engine = test_session.get_bind()
    stmt_count = {"n": 0}

    def _count(conn, cursor, statement, parameters, context, executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            stmt_count["n"] += 1

    event.listen(engine, "before_cursor_execute", _count)
    try:
        resp = client.get(f"/api/v1/articles/related/{source.id}")
    finally:
        event.remove(engine, "before_cursor_execute", _count)

    assert resp.status_code == 200
    assert stmt_count["n"] <= 4


def test_related_response_structure_unchanged(client, test_session, author):
    """响应结构保持 ArticleWithAuthor 列表（前端零改动）"""
    source = _make_article(test_session, author, "Source Story", f"src-{uuid.uuid4().hex[:8]}")
    # 一篇其他文章作为推荐候选（无需引用返回值）
    _make_article(test_session, author, "Other Story", f"other-{uuid.uuid4().hex[:8]}")

    resp = client.get(f"/api/v1/articles/related/{source.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list) and len(data) >= 1
    assert set(data[0].keys()) >= {"id", "title", "slug", "author"}
