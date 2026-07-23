"""评论模块最小 API 测试"""
import uuid

import pytest
from fastapi import status

from app.models.article import Article
from app.models.user import User


@pytest.fixture
def published_article(test_session):
    author = test_session.query(User).filter(User.username == "testadmin").first()
    assert author is not None
    article = Article(
        id=uuid.uuid4(),
        title="Comment Host Article",
        slug=f"comment-host-{uuid.uuid4().hex[:8]}",
        content="body for comments",
        is_published=True,
        author_id=author.id,
    )
    test_session.add(article)
    test_session.commit()
    test_session.refresh(article)
    return article


def test_list_comments_by_article(client, published_article):
    response = client.get(
        "/api/v1/comments/",
        params={"article_id": str(published_article.id)},
    )
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_list_comments_without_filter_as_admin(client):
    """conftest 将 optional 认证也注入超管：无筛选可列出全部"""
    response = client.get("/api/v1/comments/")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_create_comment(client, published_article):
    payload = {
        "content": "Nice article!",
        "article_id": str(published_article.id),
    }
    response = client.post("/api/v1/comments/", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["content"] == "Nice article!"
    assert data["article_id"] == str(published_article.id)
