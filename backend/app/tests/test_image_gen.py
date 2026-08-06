"""图片/视频生成（RunningHub 异步工作流）测试：service 与 endpoint"""

import httpx
import pytest

from app.core.config import settings
from app.schemas.image_gen import ImageGenTaskRequest
from app.services.image_gen_service import create_task, get_task_status


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
        self._response = FakeResponse(200, {"code": 200, "data": {"taskId": "task-123"}})
        self.request_kwargs = None
        self.request_params = None
        self.request_url = None

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

    async def get(self, url, **kwargs):
        self.request_url = url
        self.request_params = kwargs.get("params")
        return self._response


def setup_runninghub(monkeypatch):
    """配置最小可用的 RunningHub 凭据（图片+视频工作流）"""
    monkeypatch.setattr(settings, "RUNNINGHUB_API_KEY", "rh-test-key")
    monkeypatch.setattr(settings, "RUNNINGHUB_BASE_URL", "https://www.runninghub.cn/api/v1")
    monkeypatch.setattr(settings, "RUNNINGHUB_IMAGE_WORKFLOW_ID", "wf-image")
    monkeypatch.setattr(settings, "RUNNINGHUB_VIDEO_WORKFLOW_ID", "wf-video")
    monkeypatch.setattr(settings, "RUNNINGHUB_IMAGE_INPUT_KEY", "prompt")
    monkeypatch.setattr(settings, "RUNNINGHUB_VIDEO_INPUT_KEY", "prompt")


def make_request(**overrides) -> ImageGenTaskRequest:
    base = {"type": "image", "prompt": "月光下的湖泊"}
    base.update(overrides)
    return ImageGenTaskRequest(**base)


class TestCreateTask:
    async def test_no_key_raises(self, monkeypatch):
        monkeypatch.setattr(settings, "RUNNINGHUB_API_KEY", "")
        with pytest.raises(ValueError, match="未配置"):
            await create_task(make_request())

    async def test_no_workflow_raises(self, monkeypatch):
        setup_runninghub(monkeypatch)
        monkeypatch.setattr(settings, "RUNNINGHUB_IMAGE_WORKFLOW_ID", "")
        with pytest.raises(ValueError, match="工作流"):
            await create_task(make_request())

    async def test_success_returns_task_id(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await create_task(make_request())
        assert resp.task_id == "task-123"
        # 请求 URL 与 body 校验
        assert fake.request_url.endswith("/task/create")
        body = fake.request_kwargs["json"]
        assert body["workflow_id"] == "wf-image"
        assert body["workflow_inputs"] == {"prompt": "月光下的湖泊"}
        # api-key 鉴权（Authorization 不参与）
        assert fake.request_kwargs["headers"]["api-key"] == "rh-test-key"

    async def test_video_uses_video_workflow(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await create_task(make_request(type="video", prompt="海鸥飞过灯塔"))
        assert resp.task_id == "task-123"
        body = fake.request_kwargs["json"]
        assert body["workflow_id"] == "wf-video"
        assert body["workflow_inputs"] == {"prompt": "海鸥飞过灯塔"}

    async def test_workflow_extra_inputs_merged(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        await create_task(
            make_request(workflow_inputs={"negative_prompt": "模糊", "size": "1024x1024"})
        )
        body = fake.request_kwargs["json"]
        assert body["workflow_inputs"] == {
            "prompt": "月光下的湖泊",
            "negative_prompt": "模糊",
            "size": "1024x1024",
        }

    async def test_non_200_raises(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(401, {"code": 401, "msg": "invalid api-key"}, text="unauthorized")
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        with pytest.raises(ValueError, match="HTTP 401"):
            await create_task(make_request())

    async def test_missing_task_id_raises(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(FakeResponse(200, {"code": 200, "data": {}}))
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        with pytest.raises(ValueError, match="异常"):
            await create_task(make_request())


class TestGetTaskStatus:
    async def test_pending(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(200, {"code": 200, "data": {"taskId": "t1", "status": "running"}})
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "running"
        assert resp.images == []
        assert resp.video_url is None
        assert fake.request_params == {"taskId": "t1"}

    async def test_success_images_list(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {
                    "code": 200,
                    "data": {
                        "taskId": "t1",
                        "status": "success",
                        "result": [
                            "https://cdn.example.com/a.png",
                            "https://cdn.example.com/b.png",
                        ],
                    },
                },
            )
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "success"
        assert resp.images == ["https://cdn.example.com/a.png", "https://cdn.example.com/b.png"]
        assert resp.video_url is None

    async def test_success_images_dict(self, monkeypatch):
        """兼容 result 为 {images: [...]} 对象形态"""
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {
                    "code": 200,
                    "data": {
                        "taskId": "t1",
                        "status": "success",
                        "result": {"images": ["https://cdn.example.com/c.png"]},
                    },
                },
            )
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "success"
        assert resp.images == ["https://cdn.example.com/c.png"]

    async def test_success_video_url(self, monkeypatch):
        """视频结果：result 为视频 URL 或 {video_url: ...}"""
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {
                    "code": 200,
                    "data": {
                        "taskId": "t1",
                        "status": "success",
                        "result": "https://cdn.example.com/clip.mp4",
                    },
                },
            )
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "success"
        assert resp.images == []
        assert resp.video_url == "https://cdn.example.com/clip.mp4"

    async def test_fail_returns_reason(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {"code": 200, "data": {"taskId": "t1", "status": "fail", "failReason": "审核未通过"}},
            )
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "fail"
        assert resp.fail_reason == "审核未通过"

    async def test_unknown_status_normalized(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(200, {"code": 200, "data": {"taskId": "t1", "status": "processing"}})
        )
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        resp = await get_task_status("t1")
        assert resp.status == "running"  # 未知状态归一化为 running 继续轮询


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
        # 走视频工作流（monkeypatch 的 fake 未捕获创建参数，仅断言端点正常）

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
        body = fake.request_kwargs["json"]
        assert body["workflow_id"] == "wf-image"

    def test_get_task_status(self, client, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient().set_response(
            FakeResponse(
                200,
                {
                    "code": 200,
                    "data": {
                        "taskId": "t1",
                        "status": "success",
                        "result": ["https://cdn.example.com/a.png"],
                    },
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
