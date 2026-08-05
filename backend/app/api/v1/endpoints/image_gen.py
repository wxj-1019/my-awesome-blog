"""图片生成 API（火山方舟文生图，后端代理，key 不出后端）"""

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.image_gen import ImageGenRequest, ImageGenResponse
from app.services import image_gen_service
from app.utils.logger import app_logger
from app.utils.rate_limit import llm_chat_rate_limit

router = APIRouter()


@router.post("/generate", response_model=ImageGenResponse)
@llm_chat_rate_limit
async def generate_image(
    request: Request,
    *,
    gen_request: ImageGenRequest,
    current_user: User = Depends(get_current_active_user),
) -> ImageGenResponse:
    """文生图：代理调用火山方舟 images/generations，返回图片 URL 列表。"""
    app_logger.info(
        f"Image gen by user={current_user.username} size={gen_request.size} count={gen_request.count}"
    )
    try:
        return await image_gen_service.generate_images(gen_request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
