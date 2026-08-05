"""图片生成服务：后端代理调用火山方舟文生图 API（key 不出后端）。

调用方需登录 + 限流；失败统一抛 ValueError，由端点层转 HTTP 400。
"""

import httpx

from app.core.config import settings
from app.schemas.image_gen import GeneratedImage, ImageGenRequest, ImageGenResponse
from app.utils.logger import app_logger

# 文生图耗时较长，超时放宽到 60s
_HTTP_TIMEOUT = 60.0


async def generate_images(request: ImageGenRequest) -> ImageGenResponse:
    """调用火山方舟 images/generations 生成图片"""
    key = settings.ARK_API_KEY.strip()
    if not key:
        app_logger.warning("图片生成服务未配置：ARK_API_KEY 为空")
        raise ValueError("图片生成服务未配置，请联系管理员")

    model = (request.model or "").strip() or settings.ARK_IMAGE_MODEL
    base_url = (settings.ARK_API_BASE or "https://ark.cn-beijing.volces.com/api/v3").rstrip("/")
    url = f"{base_url}/images/generations"

    payload = {
        "model": model,
        "prompt": request.prompt.strip(),
        "size": request.size,
        "count": request.count,
        "response_format": "url",
        "watermark": False,
    }

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {key}"},
            )
    except httpx.HTTPError as e:
        app_logger.warning(f"火山方舟文生图请求失败：{e}")
        raise ValueError(f"图片生成服务请求失败：{e}") from e

    if resp.status_code != 200:
        detail = _extract_error(resp)
        app_logger.warning(f"火山方舟返回 {resp.status_code}: {detail}")
        raise ValueError(f"图片生成失败（HTTP {resp.status_code}）{detail}")

    data = resp.json().get("data", [])
    images = [
        GeneratedImage(url=item["url"], size=request.size)
        for item in data
        if isinstance(item, dict) and item.get("url")
    ]
    if not images:
        raise ValueError("图片生成返回为空，请稍后重试")

    return ImageGenResponse(images=images, model=model)


def _extract_error(resp: httpx.Response) -> str:
    """从错误响应中提取可读信息（方舟错误体通常含 message/error.message）"""
    try:
        body = resp.json()
    except Exception:
        return resp.text[:200]
    if isinstance(body, dict):
        for key in ("message", "error"):
            val = body.get(key)
            if isinstance(val, str) and val:
                return val
            if isinstance(val, dict) and val.get("message"):
                return val["message"]
    return resp.text[:200]
