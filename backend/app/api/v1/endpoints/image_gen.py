"""图片/视频生成 API（RunningHub 异步工作流，后端代理，key 不出后端）

- POST /image-gen/tasks/image  创建文生图任务（限流 6/min）
- POST /image-gen/tasks/video  创建文生视频任务（限流 2/min，更耗算力）
- GET  /image-gen/tasks/{id}   查询任务状态与结果（前端轮询）
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.dependencies import get_current_user_optional
from app.models.user import User
from app.schemas.image_gen import (
    ImageGenStatusResponse,
    ImageGenTaskRequest,
    ImageGenTaskResponse,
)
from app.services import image_gen_service
from app.utils.logger import app_logger
from app.utils.rate_limit import image_gen_rate_limit, video_gen_rate_limit

router = APIRouter()


async def _create_task(
    request: Request,
    *,
    task_request: ImageGenTaskRequest,
    current_user: Optional[User],
) -> ImageGenTaskResponse:
    """创建 RunningHub 生成任务（图片/视频共用逻辑）"""
    operator = current_user.username if current_user else "游客"
    app_logger.info(
        f"Gen task by user={operator} type={task_request.type} prompt_len={len(task_request.prompt)}"
    )
    try:
        return await image_gen_service.create_task(task_request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.post("/tasks/image", response_model=ImageGenTaskResponse)
@image_gen_rate_limit
async def create_image_task(
    request: Request,
    *,
    task_request: ImageGenTaskRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> ImageGenTaskResponse:
    """创建文生图任务，返回 task_id 供前端轮询。"""
    # 强制类型为图片，防止经此端点以 video 类型绕过视频限流
    task_request.type = "image"
    return await _create_task(
        request, task_request=task_request, current_user=current_user
    )


@router.post("/tasks/video", response_model=ImageGenTaskResponse)
@video_gen_rate_limit
async def create_video_task(
    request: Request,
    *,
    task_request: ImageGenTaskRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> ImageGenTaskResponse:
    """创建文生视频任务，返回 task_id 供前端轮询。"""
    task_request.type = "video"
    return await _create_task(
        request, task_request=task_request, current_user=current_user
    )


@router.get("/tasks/{task_id}", response_model=ImageGenStatusResponse)
async def get_task_status(
    task_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> ImageGenStatusResponse:
    """查询生成任务状态（pending/running/success/fail）与结果，前端轮询。"""
    try:
        return await image_gen_service.get_task_status(task_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
