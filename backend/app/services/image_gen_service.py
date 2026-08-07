"""图片/视频生成服务：后端代理调用 RunningHub OpenAPI v2 标准模型 API（key 不出后端）。

模式（官方 SDK 协议，已验证）：
1. 提交：POST {base}/{endpoint}，header `Authorization: Bearer`，body 为模型参数
   → 响应 {taskId, status: "QUEUED"|"CREATE"|"RUNNING"|"SUCCESS"|"FAILED"|"CANCEL"}
2. 轮询：POST {base}/query，body {"taskId": "..."} 直到终态
   → SUCCESS：results[] 含 url/outputType/text；FAILED/CANCEL：failedReason
失败统一抛 ValueError，由端点层转 HTTP 400。
"""

from typing import Any, Dict, List

import httpx

from app.core.config import settings
from app.schemas.image_gen import (
    ImageGenStatusResponse,
    ImageGenTaskRequest,
    ImageGenTaskResponse,
    RunningHubAccountResponse,
)
from app.utils.logger import app_logger

# 任务创建/状态查询超时
_HTTP_TIMEOUT = 30.0

# 非终态：继续轮询；终态：SUCCESS 成功，FAILED/CANCEL 失败
_NON_TERMINAL = {"QUEUED", "CREATE", "RUNNING", "PENDING"}
_TERMINAL_FAIL = {"FAILED", "CANCEL", "CANCELLED", "ERROR"}


def _config_or_raise() -> str:
    """校验并返回 RunningHub API Key；缺失抛 ValueError"""
    key = settings.RUNNINGHUB_API_KEY.strip()
    if not key:
        app_logger.warning("图片/视频生成服务未配置：RUNNINGHUB_API_KEY 为空")
        raise ValueError("生成服务未配置，请联系管理员")
    return key


def _endpoint_for_video() -> str:
    """取视频模型端点（走配置端点），缺失抛 ValueError"""
    endpoint = settings.RUNNINGHUB_VIDEO_ENDPOINT.strip()
    if not endpoint:
        app_logger.warning("生成服务未配置：视频模型端点为空")
        raise ValueError("生成服务未配置（模型端点），请联系管理员")
    return endpoint.lstrip("/")


def _image_endpoint_for(model: str, mode: str) -> str:
    """按模型与模式拼图片端点（{model}/text-to-image 或 {model}/image-to-image）"""
    model = model.strip()
    if not model:
        app_logger.warning("图片生成服务未配置：模型为空")
        raise ValueError("生成服务未配置（模型），请联系管理员")
    task = "image-to-image" if mode == "image" else "text-to-image"
    return f"{model}/{task}"


async def create_task(request: ImageGenTaskRequest) -> ImageGenTaskResponse:
    """提交 RunningHub 标准模型任务，返回 task_id"""
    key = _config_or_raise()
    # 图片端点按 (model, mode) 动态拼接；视频保持配置端点
    endpoint = (
        _image_endpoint_for(request.model, request.mode)
        if request.type == "image"
        else _endpoint_for_video()
    )
    base_url = (settings.RUNNINGHUB_BASE_URL or "https://www.runninghub.cn/openapi/v2").rstrip("/")

    # 工作流额外输入可覆盖默认参数（如 resolution/quality/duration），prompt 始终为提示词
    payload: Dict[str, Any] = {"prompt": request.prompt.strip()}
    if request.workflow_inputs:
        payload.update(request.workflow_inputs)
    if request.type == "image" and request.image_urls:
        payload["imageUrls"] = request.image_urls

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.post(
                f"{base_url}/{endpoint}",
                json=payload,
                headers={"Authorization": f"Bearer {key}"},
            )
    except httpx.HTTPError as e:
        app_logger.warning(f"RunningHub 提交任务失败：{e}")
        raise ValueError(f"生成服务请求失败：{e}") from e

    body = _parse_body(resp, action="提交任务")
    # 官方响应平铺结构：{taskId, status, results, errorCode, errorMessage}
    task_id = body.get("taskId") or body.get("task_id")
    if not task_id:
        app_logger.warning(f"RunningHub 提交任务响应缺 taskId：{body}")
        raise ValueError("生成服务返回异常，请稍后重试")

    app_logger.info(f"RunningHub 任务已提交 type={request.type} task_id={task_id}")
    return ImageGenTaskResponse(task_id=str(task_id))


async def get_task_status(task_id: str) -> ImageGenStatusResponse:
    """查询 RunningHub 任务状态（POST /query），解析图片/视频结果"""
    key = _config_or_raise()
    base_url = (settings.RUNNINGHUB_BASE_URL or "https://www.runninghub.cn/openapi/v2").rstrip("/")

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.post(
                f"{base_url}/query",
                json={"taskId": task_id},
                headers={"Authorization": f"Bearer {key}"},
            )
    except httpx.HTTPError as e:
        app_logger.warning(f"RunningHub 查询任务失败：{e}")
        raise ValueError(f"生成服务请求失败：{e}") from e

    body = _parse_body(resp, action="查询任务")
    # 官方响应平铺结构：{taskId, status, results, failedReason, errorCode, errorMessage}
    status = str(body.get("status") or "running").upper()

    # 失败
    if status in _TERMINAL_FAIL:
        reason = (
            body.get("failedReason")
            or body.get("failReason")
            or body.get("fail_reason")
            or body.get("reason")
        )
        return ImageGenStatusResponse(
            task_id=task_id,
            status="fail",
            fail_reason=str(reason) or "任务失败，请重试",
        )

    # 成功：results[] 含 url/outputType/text
    if status == "SUCCESS":
        results = body.get("results") or []
        images, video_urls = _parse_results(results)
        return ImageGenStatusResponse(
            task_id=task_id,
            status="success",
            images=images,
            video_url=video_urls[0] if video_urls else None,
        )

    # 非终态（QUEUED/CREATE/RUNNING 等）统一为 running 继续轮询
    return ImageGenStatusResponse(task_id=task_id, status="running")


async def get_account_info() -> RunningHubAccountResponse:
    """查询 RunningHub 账户信息（RH 币/余额/运行中任务数/API 类型）"""
    key = _config_or_raise()
    account_url = (
        settings.RUNNINGHUB_ACCOUNT_URL
        or "https://www.runninghub.cn/uc/openapi/accountStatus"
    )

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.post(
                account_url,
                json={"apikey": key},
                headers={"Authorization": f"Bearer {key}"},
            )
    except httpx.HTTPError as e:
        app_logger.warning(f"RunningHub 查询账户失败：{e}")
        raise ValueError(f"生成服务请求失败：{e}") from e

    try:
        body = resp.json()
    except Exception:
        raise ValueError(f"生成服务响应异常（HTTP {resp.status_code}）") from None

    # 账户接口：{code, msg, data:{remainCoins,currentTaskCounts,remainMoney,currency,apiType}}
    if resp.status_code != 200 or not isinstance(body, dict):
        app_logger.warning(f"RunningHub 查询账户失败：{resp.status_code} {body}")
        raise ValueError(f"生成服务调用失败（HTTP {resp.status_code}）")
    code = body.get("code")
    if code not in (0, 200):
        msg = body.get("msg") or body.get("message") or ""
        app_logger.warning(f"RunningHub 查询账户失败：code={code} {msg}")
        raise ValueError(f"生成服务调用失败（{msg or code}）")

    data = body.get("data") or {}
    account = RunningHubAccountResponse(
        remain_coins=str(data.get("remainCoins") or data.get("remain_coins") or "0"),
        current_task_counts=str(data.get("currentTaskCounts") or data.get("current_task_counts") or "0"),
        remain_money=data.get("remainMoney") or data.get("remain_money"),
        currency=data.get("currency"),
        api_type=str(data.get("apiType") or data.get("api_type") or "UNKNOWN"),
    )
    app_logger.info(
        f"RunningHub 账户查询成功 coins={account.remain_coins} running={account.current_task_counts}"
    )
    return account


def _parse_body(resp: httpx.Response, action: str) -> Dict[str, Any]:
    """校验响应并解析 JSON body（标准模型 API：错误经 errorCode/errorMessage 表达）"""
    try:
        body = resp.json()
    except Exception:
        raise ValueError(f"生成服务响应异常（HTTP {resp.status_code}）") from None

    if isinstance(body, dict):
        error_code = body.get("errorCode") or body.get("error_code")
        error_message = body.get("errorMessage") or body.get("error_message")
        if error_code:
            app_logger.warning(f"RunningHub {action}失败：{error_code} {error_message}")
            raise ValueError(f"生成服务调用失败（{error_message or error_code}）")

    if resp.status_code != 200 or not isinstance(body, dict):
        app_logger.warning(f"RunningHub {action}失败：{resp.status_code} {body}")
        raise ValueError(f"生成服务调用失败（HTTP {resp.status_code}）")

    return body


def _parse_results(results: Any) -> tuple[List[str], List[str]]:
    """把任务 results 解析为 (图片 URL 列表, 视频 URL 列表)

    官方响应：results 为 [{url, outputType, text, ...}]。
    兼容旧工作流形态：字符串 URL / 纯数组 / {images:[...]} / {video_url:...}。
    """
    images: List[str] = []
    videos: List[str] = []

    if not isinstance(results, list):
        if isinstance(results, str):
            _classify_url(results, images, videos)
        elif isinstance(results, dict):
            _parse_dict(results, images, videos)
        return images, videos

    for item in results:
        if isinstance(item, str):
            _classify_url(item, images, videos)
        elif isinstance(item, dict):
            # 官方字段：url + outputType（image/video/png/mp4 等）
            url = item.get("url") or item.get("outputUrl") or item.get("image_url") or item.get("video_url")
            if not url:
                continue
            output_type = str(item.get("outputType") or item.get("type") or "").lower()
            if "video" in output_type or url.lower().endswith((".mp4", ".webm", ".mov", ".avi", ".m3u8")):
                videos.append(str(url))
            else:
                images.append(str(url))

    return images, videos


def _parse_dict(data: Dict[str, Any], images: List[str], videos: List[str]) -> None:
    """兼容 result 为对象形态：{images:[...]} / {video_url:...} / {url:...}"""
    for key in ("images", "image_urls", "image", "img"):
        val = data.get(key)
        if isinstance(val, list):
            for v in val:
                if isinstance(v, str):
                    images.append(v)
        elif isinstance(val, str) and val:
            images.append(val)
    for key in ("video_url", "video", "videos", "url"):
        val = data.get(key)
        if isinstance(val, str) and val:
            videos.append(val)
        elif isinstance(val, list):
            for v in val:
                if isinstance(v, str) and v:
                    videos.append(v)
                    break


def _classify_url(url: str, images: List[str], videos: List[str]) -> None:
    """按 URL 后缀粗判图片/视频；未知后缀默认按图片"""
    lower = url.lower()
    if any(lower.endswith(ext) for ext in (".mp4", ".webm", ".mov", ".avi", ".m3u8")):
        videos.append(url)
    else:
        images.append(url)
