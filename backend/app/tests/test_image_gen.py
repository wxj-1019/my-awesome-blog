"""图片生成（火山方舟文生图）测试：service 与 endpoint"""

import httpx
import pytest

from app.core.config import settings
from app.schemas.image_gen import ImageGenRequest
from app.services.image_gen_service import generate_images


class FakeResponse:
    def __init__(self, status_code: int, json_data: object, text: str = ""):
        self.status_code = status_code
        self._json = json_data
        self._text = text

    def json(self):
        return self._json

    @property
    def text(self) -> str:
        return self._text or str(self._json)


class FakeAsyncClient:
    """模拟 httpx.AsyncClient：固定返回预设响应"""

    def __init__(self, *args, **kwargs):
        self._response = FakeResponse(200, {"data": [{"url": "https://cdn.example.com/img.png"}]})
        self.request_kwargs = None

    def set_response(self, resp: FakeResponse):
        self._response = resp
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def post(self, *args, **kwargs):
        self.request_kwargs = kwargs
        return self._response


def make_request(**overrides) -> ImageGenRequest:
    base = {"prompt": "月光下的湖泊", "size": "1024x1024", "count": 1}
    base.update(overrides)
    return ImageGenRequest(**base)


class TestImageGenService:
    async def test_no_key_raises(self, monkeypatch):
        monkeypatch.setattr(settings, "ARK_API_KEY", "")
        with pytest.raises(ValueError, match="未配置"):
            await generate_images(make_request())

    async def test_success_returns_urls(self, monkeypatch):
        monkeypatch.setattr(settings, "ARK_API_KEY", "test-key")
        monkeypatch.setattr(settings, "ARK_IMAGE_MODEL", "test-model")
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await generate_images(make_request(count=2))
        assert len(resp.images) == 1
        assert resp.images[0].url == "https://cdn.example.com/img.png"
        assert resp.model == "test-model"
        # 请求体包含关键字段
        body = fake.request_kwargs["json"]
        assert body["model"] == "test-model"
        assert body["prompt"] == "月光下的湖泊"
        assert body["response_format"] == "url"
        # Bearer 鉴权
        assert fake.request_kwargs["headers"]["Authorization"] == "Bearer test-key"

    async def test_non_200_raises(self, monkeypatch):
        monkeypatch.setattr(settings, "ARK_API_KEY", "test-key")
        fake = FakeAsyncClient().set_response(
            FakeResponse(400, {"message": "invalid prompt"}, text="bad request")
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        with pytest.raises(ValueError, match="HTTP 400"):
            await generate_images(make_request())

    async def test_empty_data_raises(self, monkeypatch):
        monkeypatch.setattr(settings, "ARK_API_KEY", "test-key")
        fake = FakeAsyncClient().set_response(FakeResponse(200, {"data": []}))
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        with pytest.raises(ValueError, match="为空"):
            await generate_images(make_request())


class TestImageGenOpenAI:
    """OpenAI 兼容中转分支（provider=openai）"""

    def setup_openai(self, monkeypatch):
        monkeypatch.setattr(settings, "OPENAI_IMAGE_BASE_URL", "https://relay.example.com/v1")
        monkeypatch.setattr(settings, "OPENAI_API_KEY", "sk-relay")
        monkeypatch.setattr(settings, "OPENAI_IMAGE_MODEL", "gpt-image-2")

    def make_openai_request(self, **overrides):
        base = {"prompt": "一只猫", "size": "1024x1024", "count": 1, "provider": "openai"}
        base.update(overrides)
        return ImageGenRequest(**base)

    async def test_openai_success_b64_to_data_url(self, monkeypatch):
        self.setup_openai(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(200, {"data": [{"b64_json": "QUJD"}]})  # base64("ABC")
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await generate_images(self.make_openai_request())
        assert resp.model == "gpt-image-2"
        assert resp.images[0].url == "data:image/png;base64,QUJD"
        body = fake.request_kwargs["json"]
        assert body["model"] == "gpt-image-2"
        assert body["n"] == 1
        assert body["response_format"] == "b64_json"
        assert fake.request_kwargs["headers"]["Authorization"] == "Bearer sk-relay"

    async def test_openai_no_config_raises(self, monkeypatch):
        monkeypatch.setattr(settings, "OPENAI_IMAGE_BASE_URL", "")
        monkeypatch.setattr(settings, "OPENAI_API_KEY", "")
        with pytest.raises(ValueError, match="未配置"):
            await generate_images(self.make_openai_request())

    async def test_openai_non_200_raises(self, monkeypatch):
        self.setup_openai(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(404, {"error": {"message": "Not found"}}, text="Not found")
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)
        with pytest.raises(ValueError, match="HTTP 404"):
            await generate_images(self.make_openai_request())

    async def test_openai_empty_data_raises(self, monkeypatch):
        self.setup_openai(monkeypatch)
        fake = FakeAsyncClient().set_response(FakeResponse(200, {"data": []}))
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)
        with pytest.raises(ValueError, match="为空"):
            await generate_images(self.make_openai_request())


class TestImageGenEndpoint:
    def test_generate_success(self, client, monkeypatch):
        monkeypatch.setattr(settings, "ARK_API_KEY", "test-key")
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = client.post(
            "/api/v1/image-gen/generate",
            json={"prompt": "一只猫", "size": "1024x1024", "count": 1},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["images"][0]["url"] == "https://cdn.example.com/img.png"
        assert body["model"]

    def test_generate_no_key_400(self, client, monkeypatch):
        monkeypatch.setattr(settings, "ARK_API_KEY", "")

        resp = client.post(
            "/api/v1/image-gen/generate",
            json={"prompt": "一只猫", "size": "1024x1024", "count": 1},
        )
        assert resp.status_code == 400
        # 项目自定义异常处理器：错误体为 {"error": {"message": ...}}
        assert "未配置" in resp.json()["error"]["message"]

    def test_generate_invalid_prompt_422(self, client, monkeypatch):
        monkeypatch.setattr(settings, "ARK_API_KEY", "test-key")

        # 空 prompt 触发 Pydantic 校验
        resp = client.post(
            "/api/v1/image-gen/generate",
            json={"prompt": "", "size": "1024x1024", "count": 1},
        )
        assert resp.status_code == 422

    def test_generate_image_public_without_login(self, client):
        """游客可调用生图接口（无 token），由 IP 限流保护"""
        response = client.post(
            "/api/v1/image-gen/generate",
            json={"prompt": "一只猫", "size": "1024x1024", "count": 1},
        )
        assert response.status_code != 401  # 服务/配置层错误可接受，认证层必须放行

