"""slug 详情端点回归测试：验证 crud 导出完整（曾因 __init__ 缺导出线上 500）。"""
import uuid

from fastapi import status

from app.models.article import Article
from app.models.user import User


def _seed(test_session) -> None:
    user = User(
        tenant_id=uuid.uuid4(),
        username="slug_author",
        email="slug-author@example.com",
        hashed_password="x",
        is_active=True,
    )
    test_session.add(user)
    test_session.commit()
    test_session.add(Article(
        title="Slug 端点冒烟文章",
        slug="slug-smoke",
        content="正文内容" * 50,
        excerpt="摘要",
        is_published=True,
        author_id=user.id,
    ))
    test_session.commit()


def test_read_article_by_slug(client, test_session):
    """GET /articles/slug/{slug} 应返回 200 并带文章数据（附件字段存在）。"""
    _seed(test_session)
    resp = client.get("/api/v1/articles/slug/slug-smoke")
    assert resp.status_code == status.HTTP_200_OK, resp.text
    data = resp.json()
    assert data["title"] == "Slug 端点冒烟文章"
    assert data["slug"] == "slug-smoke"
    assert "attachments" in data  # 附件字段随 ArticleWithAuthor 返回
