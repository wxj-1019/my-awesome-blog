"""
评论接口测试。

注意：conftest 的 override_auth 把当前用户固定为超级管理员（testadmin），
因此「普通用户 vs 管理员」的权限差异无法在此覆盖，本文件聚焦于
在管理员身份下可验证的行为：创建、审批流转、层级回复、过滤与 404 语义。
"""
import uuid

import pytest
from fastapi import status

from app.models.article import Article
from app.models.comment import Comment
from app.models.user import User


@pytest.fixture
def author_and_article(test_session):
    """一个作者 + 一篇已发布文章，供评论挂载。"""
    user = test_session.query(User).filter(User.username == "testadmin").first()
    assert user is not None

    article = Article(
        title="被评论的文章",
        slug="commented-article",
        content="正文",
        excerpt="摘要",
        is_published=True,
        author_id=user.id,
    )
    test_session.add(article)
    test_session.commit()
    return user, article


def _mk_comment(test_session, article, user, content="一条评论", approved=False, parent_id=None):
    comment = Comment(
        content=content,
        article_id=article.id,
        author_id=user.id,
        is_approved=approved,
        parent_id=parent_id,
    )
    test_session.add(comment)
    test_session.commit()
    test_session.refresh(comment)
    return comment


def test_create_comment_defaults_to_unapproved(client, author_and_article):
    """新建评论默认不自动通过审核，避免未审内容直接公开。"""
    _, article = author_and_article

    response = client.post(
        "/api/v1/comments/",
        json={"content": "第一条评论", "article_id": str(article.id)},
    )
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["content"] == "第一条评论"
    assert data["is_approved"] is False, "新评论不应默认已审核"


def test_create_comment_rejects_empty_content(client, author_and_article):
    """空内容应被 schema 拦下，而不是写入数据库。"""
    _, article = author_and_article

    response = client.post(
        "/api/v1/comments/",
        json={"content": "", "article_id": str(article.id)},
    )
    assert response.status_code in (
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


def test_list_comments_filtered_by_article(client, test_session, author_and_article):
    """按 article_id 过滤时，只返回该文章下的评论。"""
    user, article = author_and_article

    other_article = Article(
        title="另一篇",
        slug="another-commented-article",
        content="c",
        excerpt="e",
        is_published=True,
        author_id=user.id,
    )
    test_session.add(other_article)
    test_session.commit()

    _mk_comment(test_session, article, user, "属于文章A", approved=True)
    _mk_comment(test_session, other_article, user, "属于文章B", approved=True)

    response = client.get("/api/v1/comments/", params={"article_id": str(article.id)})
    assert response.status_code == status.HTTP_200_OK

    contents = [c["content"] for c in response.json()]
    assert "属于文章A" in contents
    assert "属于文章B" not in contents


def test_approve_then_reject_comment(client, test_session, author_and_article):
    """审批流转：待审 → 通过 → 驳回。"""
    user, article = author_and_article
    comment = _mk_comment(test_session, article, user, approved=False)

    approved = client.post(f"/api/v1/comments/{comment.id}/approve")
    assert approved.status_code == status.HTTP_200_OK
    assert approved.json()["is_approved"] is True

    rejected = client.post(f"/api/v1/comments/{comment.id}/reject")
    assert rejected.status_code == status.HTTP_200_OK
    assert rejected.json()["is_approved"] is False


def test_comment_replies_are_nested_under_parent(client, test_session, author_and_article):
    """回复应能通过父评论的 /replies 取到，且不混入顶层列表的其它父级。"""
    user, article = author_and_article
    parent = _mk_comment(test_session, article, user, "父评论", approved=True)
    _mk_comment(test_session, article, user, "子回复", approved=True, parent_id=parent.id)

    response = client.get(f"/api/v1/comments/{parent.id}/replies")
    assert response.status_code == status.HTTP_200_OK

    replies = response.json()
    assert [r["content"] for r in replies] == ["子回复"]


def test_delete_comment_removes_it(client, test_session, author_and_article):
    """删除后再查应为 404。"""
    user, article = author_and_article
    comment = _mk_comment(test_session, article, user)
    comment_id = str(comment.id)

    deleted = client.delete(f"/api/v1/comments/{comment_id}")
    assert deleted.status_code == status.HTTP_200_OK

    assert client.get(f"/api/v1/comments/{comment_id}").status_code == status.HTTP_404_NOT_FOUND


def test_get_missing_comment_returns_404_not_422(client):
    """
    不存在的资源应返回 404。

    路径参数必须用合法 UUID —— 用 99999 会先被 FastAPI 的类型校验拦成 422，
    测不到真正的 404 分支（见 backend-rules §13.3）。
    """
    response = client.get(f"/api/v1/comments/{uuid.uuid4()}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_admin_can_list_all_comments_without_filter(client, test_session, author_and_article):
    """
    管理员不带过滤条件列出全部评论。

    回归点：该分支调用 crud.get_all_comments，而该函数一度未在 crud/__init__.py
    聚合导出，导致 AttributeError → 500（后台评论管理页因此打不开）。

    该路由用的是 get_current_user_optional，conftest 的全局绕过只覆盖了
    get_current_active_user / get_current_superuser，故此处需就地补上覆盖，
    否则 current_user 为 None，会走「必须提供过滤条件」的分支而测不到目标代码。
    """
    from app.main import app
    from app.core.dependencies import get_current_user_optional

    user, article = author_and_article
    _mk_comment(test_session, article, user, "待审评论", approved=False)
    _mk_comment(test_session, article, user, "已审评论", approved=True)

    async def _as_admin():
        return user

    app.dependency_overrides[get_current_user_optional] = _as_admin
    try:
        response = client.get("/api/v1/comments/")
    finally:
        app.dependency_overrides.pop(get_current_user_optional, None)

    assert response.status_code == status.HTTP_200_OK, response.text

    contents = [c["content"] for c in response.json()]
    assert "待审评论" in contents and "已审评论" in contents


def test_create_comment_on_missing_article_returns_404(client):
    """
    对不存在的文章发评论应返回 404。

    回归点：该分支使用了 HTTPException，而 comments.py 未导入它，
    命中时会抛 NameError 变成 500。
    """
    response = client.post(
        "/api/v1/comments/",
        json={"content": "评论到不存在的文章", "article_id": str(uuid.uuid4())},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text
