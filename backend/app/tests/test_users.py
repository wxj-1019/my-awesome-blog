"""
用户接口测试。

conftest 的 override_auth 把当前用户固定为超级管理员 testadmin，
因此本文件覆盖的是管理员视角下的用户管理，以及 /me 系列自助操作。
密码相关用例走真实的 bcrypt 校验路径（core.security 已将其卸载到线程池）。
"""
import uuid

import pytest
from fastapi import status

from app.models.user import User


@pytest.fixture
def current_user(test_session):
    """conftest 注入的当前登录用户。"""
    user = test_session.query(User).filter(User.username == "testadmin").first()
    assert user is not None
    return user


def test_read_current_user(client, current_user):
    """/me 返回当前登录用户，且不泄露密码哈希。"""
    response = client.get("/api/v1/users/me")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["username"] == current_user.username
    assert "hashed_password" not in data, "响应不应包含密码哈希"
    assert "password" not in data


def test_update_current_user_profile(client):
    """/me 可更新资料字段。"""
    response = client.put(
        "/api/v1/users/me",
        json={"full_name": "改过的名字", "bio": "新的简介"},
    )
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["full_name"] == "改过的名字"
    assert data["bio"] == "新的简介"


def test_create_user_rejects_duplicate_username(client, current_user):
    """用户名唯一：重复注册应被拒绝而不是写入第二条。"""
    response = client.post(
        "/api/v1/users/",
        json={
            "username": current_user.username,
            "email": "another-address@example.com",
            "password": "SomeStrongPass123",
        },
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "username" in response.text.lower()


def test_create_user_rejects_duplicate_email(client, current_user):
    """邮箱唯一：同样应被拒绝。"""
    response = client.post(
        "/api/v1/users/",
        json={
            "username": "brand_new_name",
            "email": current_user.email,
            "password": "SomeStrongPass123",
        },
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "email" in response.text.lower()


def test_create_user_then_fetch_by_id(client):
    """创建用户后可按 id 取回，且默认不是超级管理员。"""
    created = client.post(
        "/api/v1/users/",
        json={
            "username": "normal_user",
            "email": "normal@example.com",
            "password": "SomeStrongPass123",
        },
    )
    assert created.status_code == status.HTTP_200_OK, created.text

    user_id = created.json()["id"]
    fetched = client.get(f"/api/v1/users/{user_id}")
    assert fetched.status_code == status.HTTP_200_OK
    assert fetched.json()["username"] == "normal_user"
    assert fetched.json()["is_superuser"] is False, "新建用户不应默认拥有管理员权限"


def test_get_missing_user_returns_404(client):
    """不存在的用户返回 404（路径参数用合法 UUID，避免被 422 拦下）。"""
    response = client.get(f"/api/v1/users/{uuid.uuid4()}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_password_rejects_wrong_current_password(client):
    """改密码必须校验原密码，避免会话被劫持后可直接改密。"""
    response = client.put(
        "/api/v1/users/me/password",
        json={
            "current_password": "definitely-not-the-password",
            "new_password": "BrandNewPass456",
        },
    )
    assert response.status_code in (
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_422_UNPROCESSABLE_ENTITY,
    ), response.text


def test_list_users_returns_current_user(client, current_user):
    """管理员可列出用户。"""
    response = client.get("/api/v1/users/")
    assert response.status_code == status.HTTP_200_OK

    usernames = [u["username"] for u in response.json()]
    assert current_user.username in usernames
