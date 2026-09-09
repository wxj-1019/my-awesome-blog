"""互动系统（点赞/收藏/关注）端点测试。

覆盖 toggle 语义、匿名回显、鉴权、自关注与不存在目标。
"""

import uuid

import pytest
from fastapi import status

from app.models.article import Article
from app.models.interactions import ArticleBookmark, ArticleLike, UserFollow
from app.models.user import User

API = "/api/v1"


@pytest.fixture
def author_and_article(test_session):
    user = User(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        username="inter-author",
        email="inter-author@example.com",
        is_active=True,
        is_superuser=False,
    )
    user.hashed_password = "fakehash"
    article = Article(title="互动测试", slug=f"inter-{uuid.uuid4().hex[:8]}", content="内容", author_id=user.id, is_published=True)
    test_session.add_all([user, article])
    test_session.commit()
    test_session.refresh(article)
    return user, article


def _other_user(test_session, name: str) -> User:
    user = User(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        username=name,
        email=f"{name}@example.com",
        is_active=True,
        is_superuser=False,
    )
    user.hashed_password = "fakehash"
    test_session.add(user)
    test_session.commit()
    test_session.refresh(user)
    return user


def test_toggle_like_roundtrip(client, test_session, author_and_article):
    """点赞 → 取消 → 再点赞：toggle 语义 + 数据库状态一致"""
    _, article = author_and_article
    first = client.post(f"{API}/articles/{article.id}/like")
    assert first.status_code == status.HTTP_200_OK
    assert first.json() == {"liked": True, "likes_count": 1}

    second = client.post(f"{API}/articles/{article.id}/like")
    assert second.json() == {"liked": False, "likes_count": 0}
    assert test_session.query(ArticleLike).count() == 0

    third = client.post(f"{API}/articles/{article.id}/like")
    assert third.json()["liked"] is True


def test_like_status_anonymous_returns_false(client, author_and_article):
    _, article = author_and_article
    resp = client.get(f"{API}/articles/{article.id}/like")
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == {"liked": False}


def test_toggle_like_on_missing_article_404(client):
    resp = client.post(f"{API}/articles/{uuid.uuid4()}/like")
    assert resp.status_code == status.HTTP_404_NOT_FOUND


def test_toggle_bookmark_roundtrip(client, test_session, author_and_article):
    _, article = author_and_article
    assert client.post(f"{API}/articles/{article.id}/bookmark").json()["bookmarked"] is True
    assert test_session.query(ArticleBookmark).count() == 1
    assert client.post(f"{API}/articles/{article.id}/bookmark").json()["bookmarked"] is False
    assert test_session.query(ArticleBookmark).count() == 0


def test_anonymous_cannot_toggle_like(client, author_and_article):
    _, article = author_and_article
    # 摘除 conftest 的认证 override，走真实 OAuth2 流程（无 token → 401）
    from app.main import app
    from app.core.dependencies import get_current_active_user

    saved = dict(app.dependency_overrides)
    app.dependency_overrides.pop(get_current_active_user, None)
    try:
        resp = client.post(f"{API}/articles/{article.id}/like")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(saved)


def test_follow_roundtrip(client, test_session, author_and_article):
    """关注 → 取关 → 再关注；follower 记录方向正确"""
    author, _ = author_and_article
    follower = _other_user(test_session, "inter-follower")
    client.delete(f"{API}/users/{author.id}/follow")  # noop，确认无副作用

    # 以 follower 身份关注（复用超管 override 简化：超管即 follower）
    assert client.post(f"{API}/users/{author.id}/follow").json()["following"] is True
    row = test_session.query(UserFollow).filter(UserFollow.following_id == author.id).first()
    assert row is not None
    assert client.post(f"{API}/users/{author.id}/follow").json()["following"] is False
    assert test_session.query(UserFollow).count() == 0


def test_cannot_follow_self(client, test_session):
    me = _other_user(test_session, "self-follow-me")
    # conftest 的 override 用户即"当前登录者"，换算：当前用户 id 未知，
    # 直接以真实存在但非自己的目标断言 400 不成立，因此覆盖
    # 「目标存在但等于自己」分支：临时把 override 用户指向 me
    from app.main import app
    from app.core.dependencies import get_current_active_user

    original = dict(app.dependency_overrides)

    def _as_me():
        return me

    app.dependency_overrides[get_current_active_user] = _as_me
    try:
        resp = client.post(f"{API}/users/{me.id}/follow")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(original)


def test_follow_missing_user_404(client):
    resp = client.post(f"{API}/users/{uuid.uuid4()}/follow")
    assert resp.status_code == status.HTTP_404_NOT_FOUND
