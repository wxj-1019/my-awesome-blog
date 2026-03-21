"""
LLM API Endpoints
提供 LLM 对话相关的 API 接口
"""

from fastapi import APIRouter, Depends, status, Request
from app.exceptions import LLMServiceException, ServiceUnavailableException
from fastapi.responses import StreamingResponse
from app.services.llm_service import llm_service
from app.schemas.llm import (
    LLMChatRequest,
    LLMChatResponse,
    LLMModelsResponse
)
from app.utils.logger import app_logger
from app.utils.rate_limit import llm_chat_rate_limit

router = APIRouter()


@router.post("/chat", response_model=LLMChatResponse, status_code=status.HTTP_200_OK)
@llm_chat_rate_limit
async def chat(
    request: Request,
    *,
    chat_request: LLMChatRequest,
) -> LLMChatResponse:
    """
    LLM 聊天接口

    - **messages**: 消息列表，包含对话历史
    - **provider**: 可选，指定 LLM 提供商
    - **model**: 可选，指定模型名称
    - **temperature**: 温度参数，控制随机性 (0.0-2.0)
    - **max_tokens**: 最大生成 token 数
    - **top_p**: 核采样参数 (0.0-1.0)
    """
    app_logger.info(f"LLM chat request with provider: {chat_request.provider or 'default'}")
    response = await llm_service.chat(chat_request)
    return response


@router.post("/chat/stream")
@llm_chat_rate_limit
async def stream_chat(
    request: Request,
    *,
    chat_request: LLMChatRequest,
):
    """
    LLM 流式聊天接口

    使用 SSE (Server-Sent Events) 格式返回流式响应

    - **messages**: 消息列表，包含对话历史
    - **provider**: 可选，指定 LLM 提供商
    - **model**: 可选，指定模型名称
    - **temperature**: 温度参数，控制随机性 (0.0-2.0)
    - **max_tokens**: 最大生成 token 数
    - **top_p**: 核采样参数 (0.0-1.0)

    响应格式:
    - data: {"content": "增量内容", "finish_reason": null}
    - data: {"content": "更多内容", "finish_reason": null}
    - data: [DONE]
    """
    app_logger.info(f"LLM stream chat request with provider: {chat_request.provider or 'default'}")

    async def generate():
        async for chunk in llm_service.stream_chat(chat_request):
            yield chunk

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/models", response_model=LLMModelsResponse, status_code=status.HTTP_200_OK)
async def get_models() -> LLMModelsResponse:
    """
    获取可用的 LLM 模型列表

    返回所有已配置且可用的 LLM 提供商和模型信息
    """
    response = await llm_service.get_available_models()
    return response
