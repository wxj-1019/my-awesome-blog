"""图片生成 API（火山方舟文生图，后端代理，key 不出后端）"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.dependencies import get_current_user_optional
from app.models.user import User
from app.schemas.image_gen import ImageGenRequest, ImageGenResponse
from app.services import image_gen_service
from app.utils.logger import app_logger
from app.utils.rate_limit import image_gen_rate_limit

router = APIRouter()


@router.post("/generate", response_model=ImageGenResponse)
@image_gen_rate_limit
async def generate_image(
    request: Request,
    *,
    gen_request: ImageGenRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> ImageGenResponse:
    """文生图：代理调用火山方舟 images/generations，返回图片 URL 列表。

    游客可用（仅后台管理需要登录）；成本敏感，按 IP 限流。
    """
    operator = current_user.username if current_user else "游客"
    app_logger.info(
        f"Image gen by user={operator} size={gen_request.size} count={gen_request.count}"
    )
    try:
        return await image_gen_service.generate_images(gen_request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
