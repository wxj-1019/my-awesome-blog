"""图片生成（火山方舟文生图）请求/响应 schema"""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

# 模型来源：火山方舟 / OpenAI 兼容中转
ImageGenProvider = Literal["ark", "openai"]


class ImageGenRequest(BaseModel):
    """文生图请求"""

    prompt: str = Field(..., min_length=1, max_length=1000, description="图片描述提示词（中文/英文均可）")
    size: str = Field(default="1024x1024", description="图片尺寸，如 1024x1024 / 1024x1536 / 1536x1024")
    count: int = Field(default=1, ge=1, le=4, description="生成张数（1-4）")
    provider: ImageGenProvider = Field(default="ark", description="模型来源：ark（火山方舟）| openai（OpenAI 兼容中转）")
    model: Optional[str] = Field(None, description="覆盖默认文生图模型（一般无需指定）")


class GeneratedImage(BaseModel):
    """一张生成结果图（url 为火山 CDN 临时地址）"""

    url: str = Field(..., description="生成图片 URL")
    size: str = Field(..., description="实际尺寸")


class ImageGenResponse(BaseModel):
    """文生图响应"""

    images: List[GeneratedImage] = Field(default_factory=list, description="生成结果列表")
    model: str = Field(..., description="实际使用的模型 id")
