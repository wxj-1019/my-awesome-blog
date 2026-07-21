"""AgentLoop 循环引擎测试（FakeProvider 脚本化响应，不发真实请求）"""
from typing import AsyncIterator, List

from app.agent.loop import AgentLoop
from app.agent.tools.registry import AgentTool, ToolRegistry
from app.llm.base import (
    ChatCompletionResponse,
    ChatMessage,
    ChatStreamChunk,
    LLMProvider,
    ToolCall,
    Usage,
)


class FakeProvider(LLMProvider):
    """按脚本依次返回响应的假 provider，记录每次请求。"""

    def __init__(self, responses: List[ChatCompletionResponse]):
        super().__init__(api_key="fake", base_url="https://fake.local", model="fake-model")
        self._responses = list(responses)
        self.requests = []

    async def chat(self, request) -> ChatCompletionResponse:
        self.requests.append(request)
        return self._responses.pop(0)

    async def stream_chat(self, request) -> AsyncIterator[ChatStreamChunk]:
        yield ChatStreamChunk(content="")

    def get_model_name(self) -> str:
        return self.model

    def get_provider_name(self) -> str:
        return "fake"


def _text_resp(content: str) -> ChatCompletionResponse:
    return ChatCompletionResponse(
        message=ChatMessage(role="assistant", content=content),
        model="fake-model", usage=Usage(prompt_tokens=5, completion_tokens=5, total_tokens=10),
        finish_reason="stop",
    )


def _tool_resp(name: str, arguments: str, call_id: str = "call_1") -> ChatCompletionResponse:
    return ChatCompletionResponse(
        message=ChatMessage(role="assistant", content="",
                            tool_calls=[ToolCall(id=call_id, name=name, arguments=arguments)]),
        model="fake-model", usage=Usage(prompt_tokens=5, completion_tokens=5, total_tokens=10),
        finish_reason="tool_calls",
    )


def _registry() -> ToolRegistry:
    registry = ToolRegistry()
    registry.register(AgentTool(name="echo", description="回显",
                                parameters={"type": "object"}, func=lambda db, text="": f"echo:{text}"))
    return registry


async def test_loop_no_tool_call_single_turn(test_session):
    """模型直接回复：一轮结束"""
    provider = FakeProvider([_text_resp("直接回答")])
    loop = AgentLoop(provider, _registry(), max_iterations=5)
    result = await loop.run(test_session, [ChatMessage(role="user", content="你好")])
    assert result.reply == "直接回答"
    assert result.iterations == 1
    assert result.stop_reason == "finished"
    assert result.tool_trace == []


async def test_loop_tool_call_then_answer(test_session):
    """模型先调工具再回答：工具结果回喂，trace 有记录"""
    provider = FakeProvider([
        _tool_resp("echo", '{"text": "abc"}'),
        _text_resp("工具说是 abc"),
    ])
    loop = AgentLoop(provider, _registry(), max_iterations=5)
    result = await loop.run(test_session, [ChatMessage(role="user", content="调个工具")])
    assert result.reply == "工具说是 abc"
    assert result.iterations == 2
    assert result.tool_trace[0]["name"] == "echo"
    assert result.tool_trace[0]["result_preview"] == "echo:abc"
    # 第二轮请求的消息历史里应有 assistant(tool_calls) + tool 两条
    second_request = provider.requests[1]
    roles = [m.role for m in second_request.messages]
    assert roles == ["user", "assistant", "tool"]
    assert second_request.messages[2].tool_call_id == "call_1"
    assert second_request.messages[2].content == "echo:abc"


async def test_loop_max_iterations_stop(test_session):
    """模型一直调工具：达到上限后做无工具收尾调用"""
    provider = FakeProvider([
        _tool_resp("echo", "{}"), _tool_resp("echo", "{}"), _text_resp("收尾回答"),
    ])
    loop = AgentLoop(provider, _registry(), max_iterations=2)
    result = await loop.run(test_session, [ChatMessage(role="user", content="循环")])
    assert result.stop_reason == "max_iterations"
    assert result.reply == "收尾回答"
    # 最后一次请求不带 tools（强制模型给出文字答复）
    assert provider.requests[-1].tools is None


async def test_loop_tool_error_fed_back(test_session):
    """工具执行失败（未知工具）时错误文本回喂模型"""
    provider = FakeProvider([
        _tool_resp("not_exist", "{}"),
        _text_resp("抱歉，工具不可用"),
    ])
    loop = AgentLoop(provider, _registry(), max_iterations=5)
    result = await loop.run(test_session, [ChatMessage(role="user", content="x")])
    assert result.reply == "抱歉，工具不可用"
    tool_msg = provider.requests[1].messages[-1]
    assert "未知工具" in tool_msg.content


async def test_loop_bad_arguments_json_fed_back(test_session):
    """模型输出非法 JSON 参数时不崩溃，错误回喂"""
    provider = FakeProvider([
        _tool_resp("echo", "{不是json"),
        _text_resp("参数错了"),
    ])
    loop = AgentLoop(provider, _registry(), max_iterations=5)
    result = await loop.run(test_session, [ChatMessage(role="user", content="x")])
    tool_msg = provider.requests[1].messages[-1]
    assert "参数不是合法 JSON" in tool_msg.content
    assert result.reply == "参数错了"


async def test_loop_multiple_tool_calls_single_round(test_session):
    """单轮多个 tool_calls：assistant 一条 + tool 两条，顺序配对"""
    resp = ChatCompletionResponse(
        message=ChatMessage(role="assistant", content="", tool_calls=[
            ToolCall(id="c1", name="echo", arguments='{"text": "a"}'),
            ToolCall(id="c2", name="echo", arguments='{"text": "b"}'),
        ]),
        model="fake-model", usage=Usage(prompt_tokens=5, completion_tokens=5, total_tokens=10),
        finish_reason="tool_calls",
    )
    provider = FakeProvider([resp, _text_resp("两个都调完了")])
    loop = AgentLoop(provider, _registry(), max_iterations=5)
    result = await loop.run(test_session, [ChatMessage(role="user", content="x")])
    assert result.reply == "两个都调完了"
    assert len(result.tool_trace) == 2
    roles = [m.role for m in provider.requests[1].messages]
    assert roles == ["user", "assistant", "tool", "tool"]
    assert provider.requests[1].messages[2].tool_call_id == "c1"
    assert provider.requests[1].messages[3].tool_call_id == "c2"


async def test_loop_provider_error_reraises(test_session):
    """provider 抛异常时原样上抛（不吞掉返回半成品）"""
    import pytest

    class _BoomProvider(FakeProvider):
        async def chat(self, request):
            raise RuntimeError("网络超时")

    provider = _BoomProvider([])
    loop = AgentLoop(provider, _registry(), max_iterations=5)
    with pytest.raises(RuntimeError, match="网络超时"):
        await loop.run(test_session, [ChatMessage(role="user", content="x")])
