"""
LLM Service
LLM 服务层，处理业务逻辑
"""

from typing import List, Optional
from fastapi import HTTPException, status
from app.llm import (
    get_llm_provider,
    LLMProviderFactory,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatStreamChunk,
    ChatMessage
)
from app.llm.deepseek_provider import EmptyStreamError
from app.schemas.llm import (
    LLMChatRequest,
    LLMChatResponse,
    LLMMessageResponse,
    LLMUsage,
    LLMModelInfo,
    LLMModelsResponse
)
from app.core.config import settings
from app.utils.logger import app_logger


class LLMService:
    """
    LLM 服务类
    """

    def __init__(self):
        pass

    async def chat(self, request: LLMChatRequest) -> LLMChatResponse:
        """
        普通聊天接口

        Args:
            request: 聊天请求

        Returns:
            LLMChatResponse: 聊天响应
        """
        try:
            provider = get_llm_provider(request.provider)
            if provider is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"LLM provider not found or not configured: {request.provider or 'default'}"
                )

            messages = request.messages
            if request.message:
                messages = [ChatMessage(role="user", content=request.message)]

            chat_request = ChatCompletionRequest(
                messages=messages,
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                top_p=request.top_p,
                stream=False
            )

            response = await provider.chat(chat_request)

            return LLMChatResponse(
                message=LLMMessageResponse(
                    role=response.message.role,
                    content=response.message.content
                ),
                model=response.model,
                provider=provider.get_provider_name(),
                usage=LLMUsage(**response.usage.dict()) if response.usage else None
            )

        except ValueError as e:
            app_logger.error(f"LLM service error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            app_logger.error(f"LLM chat error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process chat request"
            )

    async def stream_chat(self, request: LLMChatRequest):
        """
        流式聊天接口

        Args:
            request: 聊天请求

        Yields:
            str: SSE 格式的流式响应
        """
        try:
            provider = get_llm_provider(request.provider)
            if provider is None:
                error_msg = f"LLM provider not found or not configured: {request.provider or 'default'}"
                yield f"data: {self._format_sse_error(error_msg)}\n\n"
                return

            messages = request.messages
            if request.message:
                messages = [ChatMessage(role="user", content=request.message)]

            chat_request = ChatCompletionRequest(
                messages=messages,
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                top_p=request.top_p,
                stream=request.stream if request.stream is not None else True
            )

            async for chunk in provider.stream_chat(chat_request):
                if chunk.content:
                    yield f"data: {self._format_sse_chunk(chunk)}\n\n"

            yield "data: [DONE]\n\n"

        except ValueError as e:
            app_logger.error(f"LLM stream service error: {e}")
            yield f"data: {self._format_sse_error(str(e))}\n\n"
        except EmptyStreamError as e:
            # 上游空流/重试耗尽：给出用户可读的提示，而非技术性错误
            app_logger.error(f"LLM stream empty upstream: {e}")
            yield f"data: {self._format_sse_error('AI 解读服务暂时繁忙，请稍后重试')}\n\n"
        except Exception as e:
            app_logger.error(f"LLM stream chat error: {e}")
            yield f"data: {self._format_sse_error('Failed to process stream chat request')}\n\n"

    def _format_sse_chunk(self, chunk: ChatStreamChunk) -> str:
        """
        格式化 SSE 数据块
        """
        import json
        data = {
            "content": chunk.content,
            "finish_reason": chunk.finish_reason
        }
        return json.dumps(data, ensure_ascii=False)

    def _format_sse_error(self, message: str) -> str:
        """
        格式化 SSE 错误
        """
        import json
        data = {
            "error": True,
            "message": message
        }
        return json.dumps(data, ensure_ascii=False)

    async def get_available_models(self) -> LLMModelsResponse:
        """
        获取可用的 LLM 模型列表

        Returns:
            LLMModelsResponse: 可用模型列表
        """
        try:
            providers = LLMProviderFactory.list_providers()
            models = []

            for provider_name in providers:
                provider = LLMProviderFactory.create(provider_name)
                is_available = provider is not None

                model_info = LLMModelInfo(
                    provider=provider_name,
                    name=provider.get_model_name() if provider else "",
                    display_name=self._get_display_name(provider_name),
                    is_available=is_available
                )
                models.append(model_info)

            return LLMModelsResponse(
                models=models,
                default_provider=settings.LLM_DEFAULT_MODEL.lower()
            )

        except Exception as e:
            app_logger.error(f"Failed to get available models: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve available models"
            )

    def _get_display_name(self, provider_name: str) -> str:
        """
        获取提供商显示名称
        """
        display_names = {
            'deepseek': 'DeepSeek',
            'glm': '智谱 GLM',
            'qwen': '通义千问'
        }
        return display_names.get(provider_name, provider_name.capitalize())


llm_service = LLMService()
