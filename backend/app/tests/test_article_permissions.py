"""文章模块权限与批量操作测试（重构安全网）

conftest.override_auth 是 autouse，会把所有认证依赖 override 成超管，
既有测试因此全部运行在"超管已登录"语境，权限矩阵与批量操作零覆盖——
而 git 历史里 batch ops / permission 恰好真实出过 bug（bc47d9f）。

本文件显式接管认证 override：
- anon_client：移除全部 override，走真实 OAuth2 流程（无 token → 401）
- normal_user_client：仅 override get_current_user / get_current_user_optional，
  让 get_current_active_user 与 get_current_superuser 的真实校验链生效
"""

import uuid

import pytest
from fastapi import status

from app.main import app
from app.core.dependencies import (
    get_current_active_user,
    get_current_superuser,
    get_current_user,
    get_current_user_optional,
)
from app.models.article import Article
from app.models.user import User

API = "/api/v1/articles"


def _make_user(session, username: str, is_superuser: bool = False) -> User:
    user = User(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        username=username,
        email=f"{username}@example.com",
        full_name=username,
        is_active=True,
        is_superuser=is_superuser,
    )
    user.hashed_password = "fakehash"
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _make_article(session, author_id, slug: str, published: bool = False) -> Article:
    article = Article(
        title=f"权限测试文章 {slug}",
        slug=slug,
        content="测试内容",
        author_id=author_id,
        is_published=published,
        published_at=None if not published else __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
    )
    session.add(article)
    session.commit()
    session.refresh(article)
    return article


def _swap_overrides(mapping: dict) -> dict:
    """替换认证 override 并返回保存的旧表，teardown 时恢复"""
    saved = dict(app.dependency_overrides)
    app.dependency_overrides.clear()
    app.dependency_overrides.update(saved)
    for dep in (get_current_active_user, get_current_superuser):
        app.dependency_overrides.pop(dep, None)
    app.dependency_overrides.update(mapping)
    return saved


@pytest.fixture
def normal_user(test_session):
    return _make_user(test_session, "plainuser")


@pytest.fixture
def other_user(test_session):
    return _make_user(test_session, "otheruser")


@pytest.fixture
def anon_client(client):
    """仅移除认证相关 override（get_db 等基础设施 override 必须保留），
    走真实 OAuth2 流程：无 token → 401"""
    saved = dict(app.dependency_overrides)
    for dep in (get_current_active_user, get_current_superuser, get_current_user_optional):
        app.dependency_overrides.pop(dep, None)
    yield client
    app.dependency_overrides.clear()
    app.dependency_overrides.update(saved)


@pytest.fixture
def normal_user_client(client, normal_user):
    """普通用户已登录：仅替换 get_current_user / get_current_user_optional，
    让 active/superuser 真实校验链生效（非超管访问超管端点 → 403）"""
    def _get_normal_user():
        return normal_user

    saved = _swap_overrides({get_current_user: _get_normal_user})
    app.dependency_overrides[get_current_user_optional] = _get_normal_user
    yield client
    app.dependency_overrides.clear()
    app.dependency_overrides.update(saved)


# ---------- 创建 ----------

def test_anonymous_cannot_create_article(anon_client):
    resp = anon_client.post(API, json={"title": "t", "slug": f"s-{uuid.uuid4().hex[:8]}", "content": "c"})
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


def test_logged_in_user_creates_article_as_author(normal_user_client, normal_user):
    resp = normal_user_client.post(
        API,
        json={"title": "我的文章", "slug": f"own-{uuid.uuid4().hex[:8]}", "content": "正文"},
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["author_id"] == str(normal_user.id)


# ---------- 更新 / 删除 ----------

def test_user_cannot_update_others_article(normal_user_client, test_session, other_user):
    article = _make_article(test_session, other_user.id, f"other-{uuid.uuid4().hex[:8]}")
    resp = normal_user_client.put(f"{API}/{article.id}", json={"title": "篡改"})
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_user_can_update_own_article(normal_user_client, normal_user, test_session):
    article = _make_article(test_session, normal_user.id, f"own-{uuid.uuid4().hex[:8]}")
    resp = normal_user_client.put(f"{API}/{article.id}", json={"title": "本人修改"})
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["title"] == "本人修改"


def test_user_cannot_delete_article(normal_user_client, normal_user, test_session):
    article = _make_article(test_session, normal_user.id, f"del-{uuid.uuid4().hex[:8]}")
    resp = normal_user_client.delete(f"{API}/{article.id}")
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_anonymous_cannot_delete_article(anon_client, test_session, other_user):
    article = _make_article(test_session, other_user.id, f"anon-del-{uuid.uuid4().hex[:8]}")
    resp = anon_client.delete(f"{API}/{article.id}")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ---------- 草稿可见性 ----------

def test_anonymous_cannot_view_draft(anon_client, test_session, other_user):
    draft = _make_article(test_session, other_user.id, f"draft-{uuid.uuid4().hex[:8]}", published=False)
    resp = anon_client.get(f"{API}/{draft.id}")
    assert resp.status_code == status.HTTP_404_NOT_FOUND


def test_author_can_view_own_draft(normal_user_client, normal_user, test_session):
    draft = _make_article(test_session, normal_user.id, f"mydraft-{uuid.uuid4().hex[:8]}", published=False)
    resp = normal_user_client.get(f"{API}/{draft.id}")
    assert resp.status_code == status.HTTP_200_OK


# ---------- 批量操作 ----------

def test_user_cannot_batch_delete(normal_user_client, test_session, other_user):
    article = _make_article(test_session, other_user.id, f"bd-{uuid.uuid4().hex[:8]}")
    resp = normal_user_client.post(f"{API}/batch/delete", json=[str(article.id)])
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_user_cannot_batch_featured(normal_user_client, test_session, other_user):
    article = _make_article(test_session, other_user.id, f"bf-{uuid.uuid4().hex[:8]}")
    resp = normal_user_client.post(
        f"{API}/batch/featured", json=[str(article.id)], params={"featured": True}
    )
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_superuser_batch_delete_removes_articles(client, test_session, normal_user, other_user):
    a1 = _make_article(test_session, normal_user.id, f"sd1-{uuid.uuid4().hex[:8]}")
    a2 = _make_article(test_session, other_user.id, f"sd2-{uuid.uuid4().hex[:8]}")
    ids = [a1.id, a2.id]  # 先缓存主键：endpoint 会硬删除行，expire 后访问属性将触发刷新错误
    resp = client.post(f"{API}/batch/delete", json=[str(i) for i in ids])
    assert resp.status_code == status.HTTP_200_OK
    test_session.expire_all()
    assert test_session.query(Article).filter(Article.id.in_(ids)).count() == 0


def test_superuser_batch_publish_crosses_ownership(client, test_session, normal_user, other_user):
    a1 = _make_article(test_session, normal_user.id, f"sp1-{uuid.uuid4().hex[:8]}", published=False)
    a2 = _make_article(test_session, other_user.id, f"sp2-{uuid.uuid4().hex[:8]}", published=False)
    resp = client.post(f"{API}/batch/publish", json=[str(a1.id), str(a2.id)], params={"publish": True})
    assert resp.status_code == status.HTTP_200_OK
    rows = test_session.query(Article).filter(Article.id.in_([a1.id, a2.id])).all()
    assert all(a.is_published for a in rows)


def test_user_batch_publish_filters_to_own_articles(normal_user_client, normal_user, test_session, other_user):
    own = _make_article(test_session, normal_user.id, f"up1-{uuid.uuid4().hex[:8]}", published=False)
    others = _make_article(test_session, other_user.id, f"up2-{uuid.uuid4().hex[:8]}", published=False)
    resp = normal_user_client.post(
        f"{API}/batch/publish", json=[str(own.id), str(others.id)], params={"publish": True}
    )
    assert resp.status_code == status.HTTP_200_OK
    test_session.expire_all()
    assert test_session.get(Article, own.id).is_published is True
    assert test_session.get(Article, others.id).is_published is False
