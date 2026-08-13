"""文章附件（article_attachments）功能测试：创建带附件 / 全量替换 / 清空"""
import uuid
from fastapi import status

from app.models.user import User


def _create_author(test_session) -> User:
    user = User(
        tenant_id=uuid.uuid4(),
        username="attach_author",
        email="attach-author@example.com",
        hashed_password="hashed_password",
        is_active=True,
    )
    test_session.add(user)
    test_session.commit()
    return user


def test_create_article_with_attachments(client, test_session):
    """创建带附件的文章：视频（读者可见）+ 文档（仅作者参考）"""
    _create_author(test_session)

    resp = client.post("/api/v1/articles/", json={
        "title": "附件测试文章",
        "slug": "attach-test-article",
        "content": "这是一篇带附件的测试文章，内容超过一百字。这是一篇带附件的测试文章，内容超过一百字。这是一篇带附件的测试文章，内容超过一百字。",
        "excerpt": "附件测试摘要",
        "is_published": True,
        "attachments": [
            {
                "name": "demo.mp4",
                "url": "https://cdn.example.com/uploads/articles/demo.mp4",
                "media_type": "video",
                "mime_type": "video/mp4",
                "file_size": 1024 * 1024 * 5,
                "is_reference": False,
                "sort_order": 0,
            },
            {
                "name": "notes.pdf",
                "url": "https://cdn.example.com/uploads/articles/notes.pdf",
                "media_type": "file",
                "mime_type": "application/pdf",
                "file_size": 2048,
                "is_reference": True,
                "sort_order": 1,
            },
        ],
    })
    assert resp.status_code == status.HTTP_200_OK, resp.text
    article_id = resp.json()["id"]

    # 详情应带两个附件
    detail = client.get(f"/api/v1/articles/{article_id}")
    assert detail.status_code == status.HTTP_200_OK
    attachments = detail.json().get("attachments")
    assert attachments is not None, "详情响应缺少 attachments 字段"
    assert len(attachments) == 2
    video = next(a for a in attachments if a["media_type"] == "video")
    assert video["name"] == "demo.mp4"
    assert video["is_reference"] is False
    ref = next(a for a in attachments if a["media_type"] == "file")
    assert ref["is_reference"] is True


def test_update_article_attachments_replace(client, test_session):
    """更新文章：attachments 全量替换（旧附件删除，新附件写入）"""
    _create_author(test_session)

    resp = client.post("/api/v1/articles/", json={
        "title": "附件替换测试文章",
        "slug": "attach-replace-test",
        "content": "这是一篇附件替换测试文章，内容超过一百字。这是一篇附件替换测试文章，内容超过一百字。这是一篇附件替换测试文章，内容超过一百字。",
        "is_published": True,
        "attachments": [
            {
                "name": "old.mp4",
                "url": "https://cdn.example.com/old.mp4",
                "media_type": "video",
                "is_reference": False,
                "sort_order": 0,
            }
        ],
    })
    assert resp.status_code == status.HTTP_200_OK, resp.text
    article_id = resp.json()["id"]

    # 全量替换为两个新附件
    resp = client.put(f"/api/v1/articles/{article_id}", json={
        "attachments": [
            {
                "name": "new-a.pdf",
                "url": "https://cdn.example.com/new-a.pdf",
                "media_type": "file",
                "is_reference": False,
                "sort_order": 0,
            },
            {
                "name": "new-b.mp3",
                "url": "https://cdn.example.com/new-b.mp3",
                "media_type": "audio",
                "is_reference": True,
                "sort_order": 1,
            },
        ],
    })
    assert resp.status_code == status.HTTP_200_OK, resp.text

    detail = client.get(f"/api/v1/articles/{article_id}")
    attachments = detail.json().get("attachments") or []
    assert len(attachments) == 2
    names = sorted(a["name"] for a in attachments)
    assert names == ["new-a.pdf", "new-b.mp3"]


def test_update_article_attachments_clear(client, test_session):
    """更新文章：传空数组清空附件"""
    _create_author(test_session)

    resp = client.post("/api/v1/articles/", json={
        "title": "附件清空测试文章",
        "slug": "attach-clear-test",
        "content": "这是一篇附件清空测试文章，内容超过一百字。这是一篇附件清空测试文章，内容超过一百字。这是一篇附件清空测试文章，内容超过一百字。",
        "is_published": True,
        "attachments": [
            {
                "name": "tmp.mp4",
                "url": "https://cdn.example.com/tmp.mp4",
                "media_type": "video",
                "is_reference": False,
                "sort_order": 0,
            }
        ],
    })
    assert resp.status_code == status.HTTP_200_OK, resp.text
    article_id = resp.json()["id"]

    resp = client.put(f"/api/v1/articles/{article_id}", json={"attachments": []})
    assert resp.status_code == status.HTTP_200_OK, resp.text

    detail = client.get(f"/api/v1/articles/{article_id}")
    attachments = detail.json().get("attachments") or []
    assert attachments == []
