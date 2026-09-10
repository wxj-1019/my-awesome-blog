"""OSS 上传模块 API 测试（该模块此前零覆盖，顺带补冒烟测试）

覆盖：
- DELETE /oss/delete 权限：匿名 401 / 普通用户 403 / 超级管理员可删除
- POST /oss/upload、/oss/batch-upload 冒烟（OSS 已由 conftest 全局 mock）
"""
import uuid

import pytest
from fastapi import status

from app.core.dependencies import get_current_active_user, get_current_superuser
from app.main import app


@pytest.fixture
def normal_user_override(test_session):
    """将认证依赖覆盖为普通（非超管）用户，用于权限测试"""
    from app.models.user import User

    normal_user = User(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        username="normaluser",
        email="normal@example.com",
        full_name="Normal User",
        is_active=True,
        is_superuser=False,
    )
    normal_user.hashed_password = "fakehash"
    test_session.add(normal_user)
    test_session.commit()
    test_session.refresh(normal_user)

    async def _get_normal_user():
        return normal_user

    # 只覆盖 active_user，并移除 conftest 对 superuser 的覆盖，
    # 让 get_current_superuser 真实逻辑运行：普通用户 → 403
    app.dependency_overrides[get_current_active_user] = _get_normal_user
    app.dependency_overrides.pop(get_current_superuser, None)
    yield normal_user
    app.dependency_overrides.pop(get_current_active_user, None)


@pytest.fixture
def anonymous():
    """移除认证覆盖，模拟匿名调用"""
    app.dependency_overrides.pop(get_current_active_user, None)
    app.dependency_overrides.pop(get_current_superuser, None)
    yield
    # conftest 的 override_auth 为函数级 autouse，后续用例会自动恢复


def _png_bytes() -> bytes:
    """用 PIL 生成真实的 1x1 PNG（端点会用 PIL 校验图片格式）"""
    import io

    from PIL import Image as PILImage

    buf = io.BytesIO()
    PILImage.new("RGB", (1, 1), color="red").save(buf, format="PNG")
    return buf.getvalue()


class TestDeleteFile:
    def test_anonymous_delete_returns_401(self, client, anonymous):
        response = client.delete(
            "/api/v1/oss/delete",
            params={"file_url": "https://mock-oss.example.com/images/a.jpg"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_normal_user_delete_returns_403(self, client, normal_user_override):
        response = client.delete(
            "/api/v1/oss/delete",
            params={"file_url": "https://mock-oss.example.com/images/a.jpg"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_superuser_delete_success(self, client, monkeypatch):
        """conftest 默认注入超管；mock delete_file 返回 True 表示删除成功"""
        monkeypatch.setattr(
            "app.api.v1.endpoints.oss_upload.oss_service.delete_file",
            lambda url: True,
        )
        file_url = "https://mock-oss.example.com/images/a.jpg"
        response = client.delete(
            "/api/v1/oss/delete",
            params={"file_url": file_url},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["deleted"] is True
        assert data["file_url"] == file_url


class TestUploadSmoke:
    def test_upload_smoke(self, client):
        """冒烟：上传接口在 mock OSS 下可正常走完流程"""
        response = client.post(
            "/api/v1/oss/upload",
            files={"file": ("smoke.png", _png_bytes(), "image/png")},
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["file_url"]

    def test_batch_upload_smoke(self, client, monkeypatch):
        """冒烟：批量上传接口在 mock OSS 下可正常走完流程"""
        # conftest 只 mock 了 upload_file/delete_file，批量接口需单独 mock
        monkeypatch.setattr(
            "app.api.v1.endpoints.oss_upload.oss_service.upload_multiple_files",
            lambda files_data, folder: ["https://mock-oss.example.com/images/m.png"] * len(files_data),
        )
        response = client.post(
            "/api/v1/oss/batch-upload",
            files=[
                ("files", ("a.png", _png_bytes(), "image/png")),
                ("files", ("b.png", _png_bytes(), "image/png")),
            ],
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["file_count"] == 2
