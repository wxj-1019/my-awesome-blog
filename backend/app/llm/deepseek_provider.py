"""
DeepSeek LLM Provider
DeepSeek API 兼容 OpenAI 格式
"""

import httpx
from typing import AsyncIterator
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, RetryError
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


class EmptyStreamError(RuntimeError):
    """上游返回 200 但流内容为空（中转站间歇性异常），用于触发重试。"""


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

    @retry(
        stop=stop_after_attempt(settings.LLM_MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(
            (httpx.HTTPStatusError, httpx.RequestError, EmptyStreamError)
        ),
    )
    async def _stream_once(
        self,
        request: ChatCompletionRequest,
        model_name: str,
        headers: dict,
    ) -> list:
        """单次流式请求：完整读取并返回 chunk 列表。

        抽成独立 async 函数以便 tenacity 重试生效（async generator 无法被
        @retry 重试——异常发生在迭代时而非调用时）。551/5xx/网络错误会在
        读取阶段抛出，由装饰器按指数退避重试整个请求。

        另处理上游「200 但空流」的间歇性异常（中转站常见）：读完流后若
        未收到任何内容 chunk，抛 EmptyStreamError 触发重试。
        """
        payload = build_openai_payload(request, model_name, stream=True)
        chunks: list = []
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
                            # 只累积有实际内容的块（content 为空如 role 块不计数）
                            if chunk and chunk.content:
                                chunks.append(chunk)
                        except json.JSONDecodeError:
                            continue
        if not chunks:
            app_logger.warning("DeepSeek stream returned empty content, will retry")
            raise EmptyStreamError("DeepSeek stream returned empty content")
        return chunks

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

        try:
            chunks = await self._stream_once(request, model_name, headers)
            for chunk in chunks:
                yield chunk

        except RetryError as e:
            # 重试耗尽（上游持续空流/5xx）：转成 EmptyStreamError 供上层给出友好提示
            app_logger.error(f"DeepSeek stream retry exhausted: {e}")
            raise EmptyStreamError("上游 AI 服务持续无响应，请稍后重试") from e
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
        # DeepSeek v4 部分 chunk（如 role 帧/结束帧）会显式返回 content: null，
        # delta.get('content', '') 此时返回 None 而非默认空串，需兜底为 ''。
        content = delta.get('content') or ''
        finish_reason = data['choices'][0].get('finish_reason')

        return ChatStreamChunk(
            content=content,
            finish_reason=finish_reason
        )

    def get_model_name(self) -> str:
        return self.model

    def get_provider_name(self) -> str:
        return 'deepseek'
