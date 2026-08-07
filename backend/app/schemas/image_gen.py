"""图片/视频生成（RunningHub 异步工作流）请求/响应 schema"""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

# 生成类型：图片 / 视频
GenType = Literal["image", "video"]

# 任务状态（RunningHub：pending → running → success | fail）
TaskStatus = Literal["pending", "running", "success", "fail"]


class ImageGenTaskRequest(BaseModel):
    """创建生成任务请求"""

    type: GenType = Field(default="image", description="生成类型：image（图片）| video（视频）")
    prompt: str = Field(..., min_length=1, max_length=1000, description="描述提示词（中文/英文均可）")
    # 工作流额外输入（如负面词、尺寸、参考图等），键名依工作流而定
    workflow_inputs: Optional[Dict[str, str]] = Field(None, description="工作流额外输入参数（可选）")
    # 图片模型标识（仅 type=image 生效；视频走 RUNNINGHUB_VIDEO_ENDPOINT 固定端点）
    model: str = Field(default="rhart-image-g-2-official", description="图片生成模型标识")
    # 图片生成模式：text 文生图 / image 图生图（配合 image_urls 使用）
    mode: Literal["text", "image"] = Field(default="text", description="图片生成模式")
    # 图生图参考图 URL 列表（mode=image 时必填，RunningHub 键名为 imageUrls）
    image_urls: Optional[List[str]] = Field(None, description="图生图参考图 URL 列表（可选）")


class ImageGenTaskResponse(BaseModel):
    """创建任务响应"""

    task_id: str = Field(..., description="RunningHub 任务 id")


class ImageGenStatusResponse(BaseModel):
    """任务状态查询响应"""

    task_id: str = Field(..., description="任务 id")
    status: TaskStatus = Field(..., description="任务状态")
    images: List[str] = Field(default_factory=list, description="生成图片 URL（status=success 且为图片时）")
    video_url: Optional[str] = Field(None, description="生成视频 URL（status=success 且为视频时）")
    fail_reason: Optional[str] = Field(None, description="失败原因（status=fail 时）")


class RunningHubAccountResponse(BaseModel):
    """RunningHub 账户信息响应（余额/RH 币/运行中任务数）"""

    remain_coins: str = Field(..., description="RH 币数量")
    current_task_counts: str = Field(..., description="当前正在运行任务数量")
    remain_money: Optional[str] = Field(None, description="钱包余额")
    currency: Optional[str] = Field(None, description="钱包货币单位")
    api_type: str = Field(..., description="API 类型（NORMAL/SHARED 等）")
