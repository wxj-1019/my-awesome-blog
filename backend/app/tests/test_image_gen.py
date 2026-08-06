"""图片/视频生成（RunningHub OpenAPI v2 标准模型 API）测试：service 与 endpoint"""

import httpx
import pytest

from app.core.config import settings
from app.schemas.image_gen import ImageGenTaskRequest
from app.services.image_gen_service import create_task, get_account_info, get_task_status


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
    """模拟 httpx.AsyncClient：按动作返回预设响应，并记录请求参数"""

    def __init__(self, *args, **kwargs):
        self._response = FakeResponse(200, {"taskId": "task-123", "status": "QUEUED"})
        self.request_url = None
        self.request_kwargs = None

    def set_response(self, resp: FakeResponse):
        self._response = resp
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def post(self, url, **kwargs):
        self.request_url = url
        self.request_kwargs = kwargs
        return self._response


def setup_runninghub(monkeypatch):
    """配置最小可用的 RunningHub 凭据（标准模型端点）"""
    monkeypatch.setattr(settings, "RUNNINGHUB_API_KEY", "rh-test-key")
    monkeypatch.setattr(settings, "RUNNINGHUB_BASE_URL", "https://www.runninghub.cn/openapi/v2")
    monkeypatch.setattr(settings, "RUNNINGHUB_IMAGE_ENDPOINT", "rhart-image-g-2-official/text-to-image")
    monkeypatch.setattr(settings, "RUNNINGHUB_VIDEO_ENDPOINT", "rhart-video-v3.1-fast/text-to-video")
    monkeypatch.setattr(
        settings, "RUNNINGHUB_ACCOUNT_URL", "https://www.runninghub.cn/uc/openapi/accountStatus"
    )


def make_request(**overrides) -> ImageGenTaskRequest:
    base = {"type": "image", "prompt": "月光下的湖泊"}
    base.update(overrides)
    return ImageGenTaskRequest(**base)


class TestCreateTask:
    async def test_no_key_raises(self, monkeypatch):
        monkeypatch.setattr(settings, "RUNNINGHUB_API_KEY", "")
        with pytest.raises(ValueError, match="未配置"):
            await create_task(make_request())

    async def test_no_endpoint_raises(self, monkeypatch):
        setup_runninghub(monkeypatch)
        monkeypatch.setattr(settings, "RUNNINGHUB_IMAGE_ENDPOINT", "")
        with pytest.raises(ValueError, match="模型端点"):
            await create_task(make_request())

    async def test_success_returns_task_id(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await create_task(make_request())
        assert resp.task_id == "task-123"
        # 提交到标准模型端点，Bearer 鉴权，body 为模型参数
        assert fake.request_url.endswith("/rhart-image-g-2-official/text-to-image")
        assert fake.request_kwargs["json"] == {"prompt": "月光下的湖泊"}
        assert fake.request_kwargs["headers"]["Authorization"] == "Bearer rh-test-key"

    async def test_video_uses_video_endpoint(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        await create_task(make_request(type="video", prompt="海鸥飞过灯塔"))
        assert fake.request_url.endswith("/rhart-video-v3.1-fast/text-to-video")
        assert fake.request_kwargs["json"] == {"prompt": "海鸥飞过灯塔"}

    async def test_workflow_extra_inputs_merged(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        await create_task(
            make_request(workflow_inputs={"aspectRatio": "9:16", "resolution": "1k"})
        )
        assert fake.request_kwargs["json"] == {
            "prompt": "月光下的湖泊",
            "aspectRatio": "9:16",
            "resolution": "1k",
        }

    async def test_error_code_raises(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(200, {"taskId": "", "status": "", "errorCode": "1014", "errorMessage": "Access Denied"})
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        with pytest.raises(ValueError, match="Access Denied"):
            await create_task(make_request())

    async def test_missing_task_id_raises(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(FakeResponse(200, {"taskId": "", "status": ""}))
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        with pytest.raises(ValueError, match="异常"):
            await create_task(make_request())


class TestGetTaskStatus:
    async def test_queued_running(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(200, {"taskId": "t1", "status": "QUEUED"})
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "running"
        assert resp.images == []
        assert resp.video_url is None
        # 轮询走 POST /query
        assert fake.request_url.endswith("/query")
        assert fake.request_kwargs["json"] == {"taskId": "t1"}

    async def test_success_images_results(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {
                    "taskId": "t1",
                    "status": "SUCCESS",
                    "results": [
                        {"url": "https://cdn.example.com/a.png", "outputType": "png"},
                        {"url": "https://cdn.example.com/b.png", "outputType": "png"},
                    ],
                },
            )
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "success"
        assert resp.images == ["https://cdn.example.com/a.png", "https://cdn.example.com/b.png"]
        assert resp.video_url is None

    async def test_success_video_results(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {
                    "taskId": "t1",
                    "status": "SUCCESS",
                    "results": [
                        {"url": "https://cdn.example.com/clip.mp4", "outputType": "video"}
                    ],
                },
            )
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "success"
        assert resp.images == []
        assert resp.video_url == "https://cdn.example.com/clip.mp4"

    async def test_failed_returns_reason(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {
                    "taskId": "t1",
                    "status": "FAILED",
                    "failedReason": {"msg": "审核未通过"},
                },
            )
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "fail"
        assert resp.fail_reason == "{'msg': '审核未通过'}"

    async def test_cancel_returns_fail(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(200, {"taskId": "t1", "status": "CANCEL"})
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "fail"


class TestImageGenEndpoint:
    def test_create_image_task_success(self, client, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = client.post(
            "/api/v1/image-gen/tasks/image",
            json={"type": "image", "prompt": "一只猫"},
        )
        assert resp.status_code == 200
        assert resp.json()["task_id"] == "task-123"

    def test_create_video_task_success(self, client, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = client.post(
            "/api/v1/image-gen/tasks/video",
            json={"type": "video", "prompt": "海鸥飞过灯塔"},
        )
        assert resp.status_code == 200
        assert resp.json()["task_id"] == "task-123"

    def test_create_image_forces_type_image(self, client, monkeypatch):
        """即使请求体 type=video，经 /tasks/image 端点也被强制为 image（防绕过视频限流）"""
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = client.post(
            "/api/v1/image-gen/tasks/image",
            json={"type": "video", "prompt": "试图绕过的请求"},
        )
        assert resp.status_code == 200
        # 图片端点应打到文生图模型
        assert fake.request_url.endswith("/rhart-image-g-2-official/text-to-image")

    def test_get_task_status(self, client, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {
                    "taskId": "t1",
                    "status": "SUCCESS",
                    "results": [{"url": "https://cdn.example.com/a.png", "outputType": "png"}],
                },
            )
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = client.get("/api/v1/image-gen/tasks/t1")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "success"
        assert body["images"] == ["https://cdn.example.com/a.png"]

    def test_create_no_key_400(self, client, monkeypatch):
        monkeypatch.setattr(settings, "RUNNINGHUB_API_KEY", "")

        resp = client.post(
            "/api/v1/image-gen/tasks/image",
            json={"type": "image", "prompt": "一只猫"},
        )
        assert resp.status_code == 400
        # 项目自定义异常处理器：错误体为 {"error": {"message": ...}}
        assert "未配置" in resp.json()["error"]["message"]

    def test_create_empty_prompt_422(self, client, monkeypatch):
        setup_runninghub(monkeypatch)

        resp = client.post(
            "/api/v1/image-gen/tasks/image",
            json={"type": "image", "prompt": ""},
        )
        assert resp.status_code == 422

    def test_tasks_public_without_login(self, client):
        """游客可调用生成接口（无 token），由 IP 限流保护"""
        response = client.post(
            "/api/v1/image-gen/tasks/image",
            json={"type": "image", "prompt": "一只猫"},
        )
        assert response.status_code != 401  # 服务/配置层错误可接受，认证层必须放行


class TestAccountInfo:
    async def test_account_success(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {
                    "code": 0,
                    "msg": "success",
                    "data": {
                        "remainCoins": "622",
                        "currentTaskCounts": "0",
                        "remainMoney": "178.56",
                        "currency": "CNY",
                        "apiType": "SHARED",
                    },
                },
            )
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_account_info()
        assert resp.remain_coins == "622"
        assert resp.current_task_counts == "0"
        assert resp.remain_money == "178.56"
        assert resp.currency == "CNY"
        assert resp.api_type == "SHARED"
        # 账户接口：POST + Bearer + body 携带 apikey
        assert fake.request_url.endswith("/uc/openapi/accountStatus")
        assert fake.request_kwargs["json"] == {"apikey": "rh-test-key"}
        assert fake.request_kwargs["headers"]["Authorization"] == "Bearer rh-test-key"

    async def test_account_missing_fields_default(self, monkeypatch):
        """remainMoney/currency 可空时兜底"""
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(200, {"code": 0, "data": {"remainCoins": "10", "currentTaskCounts": "1"}})
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_account_info()
        assert resp.remain_coins == "10"
        assert resp.current_task_counts == "1"
        assert resp.remain_money is None
        assert resp.currency is None
        assert resp.api_type == "UNKNOWN"

    async def test_account_non_zero_code_raises(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(200, {"code": 1001, "msg": "TOKEN_INVALID"})
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        with pytest.raises(ValueError, match="TOKEN_INVALID"):
            await get_account_info()

    def test_account_endpoint_success(self, client, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {
                    "code": 0,
                    "data": {
                        "remainCoins": "622",
                        "currentTaskCounts": "0",
                        "remainMoney": "178.56",
                        "currency": "CNY",
                        "apiType": "SHARED",
                    },
                },
            )
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = client.get("/api/v1/image-gen/account")
        assert resp.status_code == 200
        body = resp.json()
        assert body["remain_coins"] == "622"
        assert body["api_type"] == "SHARED"

    def test_account_no_key_400(self, client, monkeypatch):
        monkeypatch.setattr(settings, "RUNNINGHUB_API_KEY", "")
        resp = client.get("/api/v1/image-gen/account")
        assert resp.status_code == 400
        assert "未配置" in resp.json()["error"]["message"]
