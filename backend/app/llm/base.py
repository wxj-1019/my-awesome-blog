"""
LLM 抽象基类定义
"""

from abc import ABC, abstractmethod
from typing import List, Optional, AsyncIterator, Dict, Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """
    聊天消息模型
    """
    role: str = Field(..., description="角色: system, user, assistant")
    content: str = Field(..., description="消息内容")
    # 助手消息请求的工具调用（OpenAI 格式）
    tool_calls: Optional[List["ToolCall"]] = None
    # role="tool" 的消息回指哪一次调用
    tool_call_id: Optional[str] = None

    class Config:
        from_attributes = True


class ToolCall(BaseModel):
    """模型发起的一次工具调用（OpenAI 格式：arguments 为 JSON 字符串）"""
    id: str
    name: str
    arguments: str


class ToolDefinition(BaseModel):
    """向模型声明的工具（parameters 为 JSON Schema）"""
    name: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)


class ChatCompletionRequest(BaseModel):
    """
    聊天补全请求模型
    """
    messages: List[ChatMessage] = Field(..., description="消息列表")
    model: Optional[str] = Field(default=None, description="模型名称，不指定则使用默认模型")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="温度参数，控制随机性")
    max_tokens: Optional[int] = Field(default=None, description="最大生成token数")
    top_p: float = Field(default=1.0, ge=0.0, le=1.0, description="核采样参数")
    stream: bool = Field(default=False, description="是否启用流式响应")
    # 可用工具列表与选择策略（OpenAI 兼容）
    tools: Optional[List[ToolDefinition]] = None
    tool_choice: str = "auto"


class ChatCompletionResponse(BaseModel):
    """
    聊天补全响应模型
    """
    message: ChatMessage = Field(..., description="助手回复消息")
    model: str = Field(..., description="使用的模型名称")
    usage: Optional['Usage'] = Field(default=None, description="token使用情况")
    # 结束原因：stop / tool_calls / length ...
    finish_reason: Optional[str] = None


class Usage(BaseModel):
    """
    Token使用情况
    """
    prompt_tokens: int = Field(..., description="提示词token数")
    completion_tokens: int = Field(..., description="补全token数")
    total_tokens: int = Field(..., description="总token数")


class ChatStreamChunk(BaseModel):
    """
    流式响应数据块
    """
    content: str = Field(..., description="增量内容")
    finish_reason: Optional[str] = Field(default=None, description="结束原因")


class LLMProvider(ABC):
    """
    LLM提供商抽象基类
    所有具体的LLM提供商都需要实现此接口
    """

    def __init__(self, api_key: str, base_url: str, model: str):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model

    @abstractmethod
    async def chat(self, request: ChatCompletionRequest) -> ChatCompletionResponse:
        """
        同步聊天接口

        Args:
            request: 聊天请求

        Returns:
            ChatCompletionResponse: 聊天响应
        """
        pass

    @abstractmethod
    async def stream_chat(
        self,
        request: ChatCompletionRequest
    ) -> AsyncIterator[ChatStreamChunk]:
        """
        流式聊天接口

        Args:
            request: 聊天请求

        Yields:
            ChatStreamChunk: 流式响应数据块
        """
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        """
        获取当前使用的模型名称

        Returns:
            str: 模型名称
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """
        获取提供商名称

        Returns:
            str: 提供商名称
        """
        pass


def message_to_openai_dict(msg: ChatMessage) -> Dict[str, Any]:
    """把 ChatMessage 序列化为 OpenAI 消息格式（省略 None 字段）。"""
    data: Dict[str, Any] = {"role": msg.role, "content": msg.content}
    if msg.tool_calls:
        data["tool_calls"] = [
            {"id": tc.id, "type": "function",
             "function": {"name": tc.name, "arguments": tc.arguments}}
            for tc in msg.tool_calls
        ]
    if msg.tool_call_id:
        data["tool_call_id"] = msg.tool_call_id
    return data


def tools_to_openai_definitions(tools: List[ToolDefinition]) -> List[Dict[str, Any]]:
    """把 ToolDefinition 列表转为 OpenAI tools 参数格式。"""
    return [
        {"type": "function",
         "function": {"name": t.name, "description": t.description, "parameters": t.parameters}}
        for t in tools
    ]


def build_openai_payload(request: ChatCompletionRequest, model_name: str, stream: bool) -> Dict[str, Any]:
    """构建 OpenAI 兼容的 chat/completions 请求体（各 provider 共用）。"""
    payload: Dict[str, Any] = {
        "model": model_name,
        "messages": [message_to_openai_dict(m) for m in request.messages],
        "temperature": request.temperature,
        "top_p": request.top_p,
        "stream": stream,
    }
    if request.max_tokens:
        payload["max_tokens"] = request.max_tokens
    if request.tools:
        payload["tools"] = tools_to_openai_definitions(request.tools)
        payload["tool_choice"] = request.tool_choice
    return payload


def parse_openai_response(data: dict, model: str) -> ChatCompletionResponse:
    """解析 OpenAI 兼容的响应（提取 tool_calls 与 finish_reason，各 provider 共用）。"""
    choice = data["choices"][0]
    message_data = choice["message"]

    tool_calls = None
    if message_data.get("tool_calls"):
        tool_calls = [
            ToolCall(id=tc["id"], name=tc["function"]["name"], arguments=tc["function"]["arguments"])
            for tc in message_data["tool_calls"]
        ]

    usage = None
    if "usage" in data:
        usage_data = data["usage"]
        usage = Usage(
            prompt_tokens=usage_data.get("prompt_tokens", 0),
            completion_tokens=usage_data.get("completion_tokens", 0),
            total_tokens=usage_data.get("total_tokens", 0),
        )

    return ChatCompletionResponse(
        message=ChatMessage(
            role=message_data.get("role", "assistant"),
            content=message_data.get("content") or "",
            tool_calls=tool_calls,
        ),
        model=model,
        usage=usage,
        finish_reason=choice.get("finish_reason"),
    )


# Pydantic v2 前向引用：ChatMessage.tool_calls 引用了后定义的 ToolCall
ChatMessage.model_rebuild()
