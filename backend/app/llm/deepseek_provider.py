"""
DeepSeek LLM Provider
DeepSeek API 兼容 OpenAI 格式
"""

import httpx
from typing import AsyncIterator
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings
from app.utils.logger import app_logger
from .base import (
    LLMProvider,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatStreamChunk,
    build_openai_payload,
    parse_openai_response,
)


class DeepSeekProvider(LLMProvider):
    """
    DeepSeek LLM 提供商
    """

    def __init__(self, api_key: str, base_url: str, model: str):
        super().__init__(api_key, base_url, model)
        self.timeout = settings.LLM_TIMEOUT

    @retry(
        stop=stop_after_attempt(settings.LLM_MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    )
    async def chat(self, request: ChatCompletionRequest) -> ChatCompletionResponse:
        """
        同步聊天接口
        """
        if not self.api_key:
            raise ValueError("DeepSeek API key is not configured")

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

        # Fix model name - remove provider prefix if present
        model_name = request.model or self.model
        if model_name and '_' in model_name:
            # Handle cases like "deepseek_deepseek-chat" -> "deepseek-chat"
            parts = model_name.split('_')
            if len(parts) >= 2 and parts[0].lower() in ['deepseek', 'glm', 'qwen']:
                model_name = '_'.join(parts[1:])

        payload = build_openai_payload(request, model_name, stream=False)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f'{self.base_url}/chat/completions',
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

                return self._parse_response(data, request.model or self.model)

        except httpx.HTTPStatusError as e:
            app_logger.error(f"DeepSeek API error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.RequestError as e:
            app_logger.error(f"DeepSeek request error: {e}")
            raise
        except Exception as e:
            app_logger.error(f"DeepSeek chat error: {e}")
            raise

    async def stream_chat(
        self,
        request: ChatCompletionRequest
    ) -> AsyncIterator[ChatStreamChunk]:
        """
        流式聊天接口
        """
        if not self.api_key:
            raise ValueError("DeepSeek API key is not configured")

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

        # Fix model name - remove provider prefix if present
        model_name = request.model or self.model
        app_logger.info(f"DeepSeek stream - Raw model: request.model={request.model}, self.model={self.model}, using={model_name}")

        if model_name and '_' in model_name:
            # Handle cases like "deepseek_deepseek-chat" -> "deepseek-chat"
            parts = model_name.split('_')
            if len(parts) >= 2 and parts[0].lower() in ['deepseek', 'glm', 'qwen']:
                model_name = '_'.join(parts[1:])

        app_logger.info(f"DeepSeek stream - Final model_name: {model_name}")

        payload = build_openai_payload(request, model_name, stream=True)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    'POST',
                    f'{self.base_url}/chat/completions',
                    headers=headers,
                    json=payload
                ) as response:
                    # Check status before iterating
                    if response.status_code >= 400:
                        error_content = await response.aread()
                        error_text = error_content.decode('utf-8', errors='replace')
                        app_logger.error(f"DeepSeek stream API error: {response.status_code} - {error_text}")
                        response.raise_for_status()

                    async for line in response.aiter_lines():
                        if line.startswith('data: '):
                            data_str = line[6:]
                            if data_str == '[DONE]':
                                break
                            try:
                                import json
                                data = json.loads(data_str)
                                chunk = self._parse_stream_chunk(data)
                                if chunk:
                                    yield chunk
                            except json.JSONDecodeError:
                                continue

        except httpx.HTTPStatusError as e:
            app_logger.error(f"DeepSeek stream API error: {e.response.status_code}")
            raise
        except httpx.RequestError as e:
            app_logger.error(f"DeepSeek stream request error: {e}")
            raise
        except Exception as e:
            app_logger.error(f"DeepSeek stream chat error: {e}")
            raise

    def _parse_response(self, data: dict, model: str) -> ChatCompletionResponse:
        """解析API响应（含 tool_calls，共用 OpenAI 兼容解析）"""
        return parse_openai_response(data, model)

    def _parse_stream_chunk(self, data: dict) -> ChatStreamChunk:
        """
        解析流式响应数据块
        """
        if not data.get('choices'):
            return None

        delta = data['choices'][0].get('delta', {})
        content = delta.get('content', '')
        finish_reason = data['choices'][0].get('finish_reason')

        return ChatStreamChunk(
            content=content,
            finish_reason=finish_reason
        )

    def get_model_name(self) -> str:
        return self.model

    def get_provider_name(self) -> str:
        return 'deepseek'
