"""留言模块最小 API 测试"""
from fastapi import status


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
