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
