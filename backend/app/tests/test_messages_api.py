"""留言模块最小 API 测试"""
from fastapi import status


def _pop_optional_auth():
    """临时移除 optional 认证覆盖，模拟未登录游客"""
    from app.core.dependencies import get_current_user_optional
    from app.main import app
    app.dependency_overrides.pop(get_current_user_optional, None)


def test_list_messages_public(client):
    response = client.get("/api/v1/messages/", params={"limit": 10})
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_create_message(client):
    payload = {
        "content": "hello from test",
        "color": "#00D9FF",
        "is_danmaku": True,
    }
    response = client.post("/api/v1/messages/", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["content"] == "hello from test"
    assert "id" in data
    assert "author_id" in data


def test_create_message_as_guest(client):
    """游客可免登录发布留言，author_id 为空、昵称落库"""
    _pop_optional_auth()
    payload = {
        "content": "guest message",
        "nickname": "游客小王",
        "is_danmaku": True,
    }
    response = client.post("/api/v1/messages/", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["author_id"] is None
    assert data["nickname"] == "游客小王"


def test_create_message_as_guest_default_nickname(client):
    """游客未填昵称时后端默认「匿名游客」"""
    _pop_optional_auth()
    response = client.post(
        "/api/v1/messages/",
        json={"content": "anonymous guest", "is_danmaku": False},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["nickname"] == "匿名游客"


def test_like_message_without_login(client):
    """点赞/取消点赞无需登录"""
    _pop_optional_auth()
    create = client.post(
        "/api/v1/messages/",
        json={"content": "likeable", "is_danmaku": False},
    )
    assert create.status_code == status.HTTP_200_OK
    msg_id = create.json()["id"]

    like = client.post(f"/api/v1/messages/{msg_id}/like")
    assert like.status_code == status.HTTP_200_OK
    assert like.json()["likes"] == 1

    unlike = client.post(f"/api/v1/messages/{msg_id}/unlike")
    assert unlike.status_code == status.HTTP_200_OK


def test_list_includes_created_message(client):
    create = client.post(
        "/api/v1/messages/",
        json={"content": "visible msg", "is_danmaku": False},
    )
    assert create.status_code == status.HTTP_200_OK
    msg_id = create.json()["id"]

    listing = client.get("/api/v1/messages/", params={"limit": 50})
    assert listing.status_code == status.HTTP_200_OK
    ids = [m["id"] for m in listing.json()]
    assert msg_id in ids
