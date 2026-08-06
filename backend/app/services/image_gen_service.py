"""图片/视频生成服务：后端代理调用 RunningHub 异步工作流 API（key 不出后端）。

模式：创建任务（POST /task/create）→ 返回 task_id → 调用方轮询
GET /task/status 直到 success/fail。失败统一抛 ValueError，由端点层转 HTTP 400。
"""

from typing import Any, Dict

import httpx

from app.core.config import settings
from app.schemas.image_gen import (
    GenType,
    ImageGenStatusResponse,
    ImageGenTaskRequest,
    ImageGenTaskResponse,
)
from app.utils.logger import app_logger

# 任务创建/状态查询超时
_HTTP_TIMEOUT = 20.0


def _config_or_raise() -> str:
    """校验并返回 RunningHub 基础配置；缺配置抛 ValueError"""
    key = settings.RUNNINGHUB_API_KEY.strip()
    if not key:
        app_logger.warning("图片/视频生成服务未配置：RUNNINGHUB_API_KEY 为空")
        raise ValueError("生成服务未配置，请联系管理员")
    return key


def _workflow_id_for(gen_type: GenType) -> str:
    """按类型取工作流 id，缺失抛 ValueError"""
    wid = (
        settings.RUNNINGHUB_IMAGE_WORKFLOW_ID.strip()
        if gen_type == "image"
        else settings.RUNNINGHUB_VIDEO_WORKFLOW_ID.strip()
    )
    if not wid:
        app_logger.warning(f"生成服务未配置：{gen_type} 工作流 id 为空")
        raise ValueError("生成服务未配置（工作流），请联系管理员")
    return wid


def _input_key_for(gen_type: GenType) -> str:
    """按类型取工作流提示词输入参数名"""
    return (
        settings.RUNNINGHUB_IMAGE_INPUT_KEY.strip() or "prompt"
        if gen_type == "image"
        else settings.RUNNINGHUB_VIDEO_INPUT_KEY.strip() or "prompt"
    )


async def create_task(request: ImageGenTaskRequest) -> ImageGenTaskResponse:
    """创建 RunningHub 工作流任务，返回 task_id"""
    key = _config_or_raise()
    workflow_id = _workflow_id_for(request.type)
    input_key = _input_key_for(request.type)

    base_url = (settings.RUNNINGHUB_BASE_URL or "https://www.runninghub.cn/api/v1").rstrip("/")
    workflow_inputs: Dict[str, str] = {input_key: request.prompt.strip()}
    if request.workflow_inputs:
        workflow_inputs.update(request.workflow_inputs)

    payload = {"workflow_id": workflow_id, "workflow_inputs": workflow_inputs}

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.post(
                f"{base_url}/task/create",
                json=payload,
                headers={"api-key": key},
            )
    except httpx.HTTPError as e:
        app_logger.warning(f"RunningHub 创建任务失败：{e}")
        raise ValueError(f"生成服务请求失败：{e}") from e

    body = _parse_body(resp, action="创建任务")
    data = body.get("data") or {}
    task_id = data.get("taskId") or data.get("task_id")
    if not task_id:
        app_logger.warning(f"RunningHub 创建任务响应缺 taskId：{body}")
        raise ValueError("生成服务返回异常，请稍后重试")

    app_logger.info(f"RunningHub 任务已创建 type={request.type} task_id={task_id}")
    return ImageGenTaskResponse(task_id=str(task_id))


async def get_task_status(task_id: str) -> ImageGenStatusResponse:
    """查询 RunningHub 任务状态，解析图片/视频结果"""
    key = _config_or_raise()
    base_url = (settings.RUNNINGHUB_BASE_URL or "https://www.runninghub.cn/api/v1").rstrip("/")

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.get(
                f"{base_url}/task/status",
                params={"taskId": task_id},
                headers={"api-key": key},
            )
    except httpx.HTTPError as e:
        app_logger.warning(f"RunningHub 查询任务失败：{e}")
        raise ValueError(f"生成服务请求失败：{e}") from e

    body = _parse_body(resp, action="查询任务")
    data = body.get("data") or {}
    status = str(data.get("status") or "running").lower()
    if status not in ("pending", "running", "success", "fail"):
        status = "running"

    # 失败
    if status == "fail":
        reason = data.get("failReason") or data.get("fail_reason") or data.get("reason") or ""
        return ImageGenStatusResponse(
            task_id=task_id, status="fail", fail_reason=str(reason) or "任务失败，请重试"
        )

    # 成功：兼容解析 result（字符串 URL / 数组 / {images:[...]} / {video:[...]} / {video_url:...}）
    images: list[str] = []
    video_holder: dict = {}
    if status == "success":
        result = data.get("result")
        _parse_result(result, images, video_holder)

    return ImageGenStatusResponse(
        task_id=task_id,
        status=status,
        images=images,
        video_url=video_holder.get("video_url"),
    )


def _parse_body(resp: httpx.Response, action: str) -> Dict[str, Any]:
    """校验响应并解析 JSON body"""
    try:
        body = resp.json()
    except Exception:
        raise ValueError(f"生成服务响应异常（HTTP {resp.status_code}）") from None

    if resp.status_code != 200 or body.get("code") not in (200, 0):
        msg = ""
        if isinstance(body, dict):
            msg = body.get("msg") or body.get("message") or ""
        app_logger.warning(f"RunningHub {action}失败：{resp.status_code} {body}")
        raise ValueError(f"生成服务调用失败（HTTP {resp.status_code}）{msg}")

    return body


def _parse_result(result: Any, images: list[str], video_url_holder: dict) -> None:
    """把 RunningHub 工作流 result 解析为图片/视频 URL 列表。

    依工作流输出节点结构不同，兼容常见形态：
    - 字符串：单个 URL（可能是图片或视频，按后缀粗判）
    - 数组：[url, ...] 或 [{url|image|video|file_name|base64?}, ...]
    - 对象：{images: [...]} / {video: [...]} / {video_url: ...} / {image_url: ...}
    """
    if result is None:
        return

    if isinstance(result, str):
        _classify_url(result, images, video_url_holder)
        return

    if isinstance(result, list):
        for item in result:
            if isinstance(item, str):
                _classify_url(item, images, video_url_holder)
            elif isinstance(item, dict):
                _classify_dict_item(item, images, video_url_holder)
        return

    if isinstance(result, dict):
        for key in ("images", "image_urls", "image", "img"):
            val = result.get(key)
            if isinstance(val, list):
                for v in val:
                    if isinstance(v, str):
                        images.append(v)
            elif isinstance(val, str) and val:
                images.append(val)
        for key in ("video_url", "video", "videos", "url"):
            val = result.get(key)
            if isinstance(val, str) and val:
                video_url_holder["video_url"] = val
            elif isinstance(val, list):
                for v in val:
                    if isinstance(v, str) and v:
                        video_url_holder["video_url"] = v
                        break


def _classify_dict_item(item: Dict[str, Any], images: list[str], video_url_holder: dict) -> None:
    """单条结果对象：优先取 url/image/video 字段"""
    for key in ("url", "image", "image_url", "src", "file_name"):
        val = item.get(key)
        if isinstance(val, str) and val and not val.startswith("data:"):
            images.append(val)
            return
    for key in ("video", "video_url"):
        val = item.get(key)
        if isinstance(val, str) and val:
            video_url_holder["video_url"] = val
            return


def _classify_url(url: str, images: list[str], video_url_holder: dict) -> None:
    """按 URL 后缀粗判图片/视频；未知后缀默认按图片"""
    lower = url.lower()
    if any(lower.endswith(ext) for ext in (".mp4", ".webm", ".mov", ".avi", ".m3u8")):
        video_url_holder["video_url"] = url
    else:
        images.append(url)
