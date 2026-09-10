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


def test_create_comment_as_guest(client, published_article):
    """游客可免登录发表评论，author_id 为空、昵称落库"""
    from app.core.dependencies import get_current_user_optional
    from app.main import app
    app.dependency_overrides.pop(get_current_user_optional, None)

    payload = {
        "content": "Guest comment",
        "article_id": str(published_article.id),
        "nickname": "游客小李",
    }
    response = client.post("/api/v1/comments/", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["author_id"] is None
    assert data["nickname"] == "游客小李"


def test_create_comment_as_guest_default_nickname(client, published_article):
    """游客未填昵称时后端默认「匿名游客」"""
    from app.core.dependencies import get_current_user_optional
    from app.main import app
    app.dependency_overrides.pop(get_current_user_optional, None)

    response = client.post(
        "/api/v1/comments/",
        json={"content": "Anonymous comment", "article_id": str(published_article.id)},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["nickname"] == "匿名游客"


@pytest.fixture
def article_with_mixed_comments(client, published_article, test_session):
    """同一文章下造一条已审核 + 一条未审核评论"""
    from app.models.comment import Comment

    r_approved = client.post(
        "/api/v1/comments/",
        json={"content": "已通过评论", "article_id": str(published_article.id)},
    )
    assert r_approved.status_code == status.HTTP_200_OK
    r_pending = client.post(
        "/api/v1/comments/",
        json={"content": "待审核评论", "article_id": str(published_article.id)},
    )
    assert r_pending.status_code == status.HTTP_200_OK

    approved_comment = test_session.query(Comment).filter(
        Comment.id == uuid.UUID(r_approved.json()["id"])
    ).first()
    approved_comment.is_approved = True
    test_session.commit()
    return {
        "approved_id": r_approved.json()["id"],
        "pending_id": r_pending.json()["id"],
    }


def test_anonymous_approved_false_still_only_approved(
    client, published_article, article_with_mixed_comments
):
    """回归：匿名用户带 ?approved=false 也只能看到已审核评论"""
    from app.core.dependencies import get_current_user_optional
    from app.main import app

    app.dependency_overrides.pop(get_current_user_optional, None)

    response = client.get(
        "/api/v1/comments/",
        params={"article_id": str(published_article.id), "approved": "false"},
    )
    assert response.status_code == status.HTTP_200_OK
    returned_ids = [c["id"] for c in response.json()]
    assert article_with_mixed_comments["approved_id"] in returned_ids
    assert article_with_mixed_comments["pending_id"] not in returned_ids


def test_superuser_approved_false_sees_pending(
    client, published_article, article_with_mixed_comments
):
    """conftest 注入超管：approved=false 应能列出未审核评论"""
    response = client.get(
        "/api/v1/comments/",
        params={"article_id": str(published_article.id), "approved": "false"},
    )
    assert response.status_code == status.HTTP_200_OK
    returned_ids = [c["id"] for c in response.json()]
    assert article_with_mixed_comments["pending_id"] in returned_ids
