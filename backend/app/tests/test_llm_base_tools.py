"""LLM 基类 tool calling 扩展的测试"""
from app.llm.base import (
    ChatCompletionRequest,
    ChatMessage,
    ToolCall,
    ToolDefinition,
    build_openai_payload,
    message_to_openai_dict,
    parse_openai_response,
)


def test_message_to_openai_dict_plain():
    """普通消息序列化为 role + content，不含 None 字段"""
    msg = ChatMessage(role="user", content="你好")
    assert message_to_openai_dict(msg) == {"role": "user", "content": "你好"}


def test_message_to_openai_dict_with_tool_calls():
    """带工具调用的 assistant 消息序列化为 OpenAI tool_calls 格式"""
    msg = ChatMessage(
        role="assistant",
        content="",
        tool_calls=[ToolCall(id="call_1", name="search_articles", arguments='{"query": "next"}')],
    )
    data = message_to_openai_dict(msg)
    assert data["tool_calls"] == [
        {"id": "call_1", "type": "function",
         "function": {"name": "search_articles", "arguments": '{"query": "next"}'}}
    ]


def test_tool_result_message():
    """工具结果消息带 tool_call_id，role 为 tool"""
    msg = ChatMessage(role="tool", content="找到 3 篇文章", tool_call_id="call_1")
    assert message_to_openai_dict(msg) == {
        "role": "tool", "content": "找到 3 篇文章", "tool_call_id": "call_1",
    }


def test_build_openai_payload_with_tools():
    """payload 注入 tools 与 tool_choice；无 tools 时不出现这两个键"""
    tool = ToolDefinition(
        name="search_articles",
        description="搜索站内文章",
        parameters={"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
    )
    request = ChatCompletionRequest(messages=[ChatMessage(role="user", content="hi")], tools=[tool])
    payload = build_openai_payload(request, "deepseek-chat", stream=False)
    assert payload["tools"] == [{
        "type": "function",
        "function": {"name": "search_articles", "description": "搜索站内文章",
                     "parameters": tool.parameters},
    }]
    assert payload["tool_choice"] == "auto"

    plain = build_openai_payload(
        ChatCompletionRequest(messages=[ChatMessage(role="user", content="hi")]),
        "deepseek-chat", stream=False,
    )
    assert "tools" not in plain and "tool_choice" not in plain


def test_parse_openai_response_with_tool_calls():
    """解析含 tool_calls 的响应：content 为 None 时归一为空串"""
    data = {
        "choices": [{
            "message": {
                "role": "assistant",
                "content": None,
                "tool_calls": [{
                    "id": "call_1", "type": "function",
                    "function": {"name": "search_articles", "arguments": '{"query": "next"}'},
                }],
            },
            "finish_reason": "tool_calls",
        }],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
    }
    resp = parse_openai_response(data, "deepseek-chat")
    assert resp.message.content == ""
    assert resp.message.tool_calls[0].name == "search_articles"
    assert resp.message.tool_calls[0].arguments == '{"query": "next"}'
    assert resp.finish_reason == "tool_calls"
    assert resp.usage.total_tokens == 15


def test_parse_openai_response_plain():
    """普通文本响应：tool_calls 为 None"""
    data = {
        "choices": [{"message": {"role": "assistant", "content": "你好"}, "finish_reason": "stop"}],
    }
    resp = parse_openai_response(data, "deepseek-chat")
    assert resp.message.content == "你好"
    assert resp.message.tool_calls is None
    assert resp.finish_reason == "stop"
    assert resp.usage is None


def test_parse_openai_response_usage_null():
    """响应中 usage 为 null 时归一为 None，不抛 AttributeError"""
    data = {
        "choices": [{"message": {"role": "assistant", "content": "你好"}, "finish_reason": "stop"}],
        "usage": None,
    }
    resp = parse_openai_response(data, "deepseek-chat")
    assert resp.message.content == "你好"
    assert resp.usage is None


def test_deepseek_parse_response_delegates_tool_calls():
    """DeepSeekProvider._parse_response 能解析 tool_calls"""
    from app.llm.deepseek_provider import DeepSeekProvider

    provider = DeepSeekProvider(api_key="fake", base_url="https://api.deepseek.com/v1", model="deepseek-chat")
    data = {
        "choices": [{
            "message": {
                "role": "assistant", "content": None,
                "tool_calls": [{"id": "call_9", "type": "function",
                                "function": {"name": "get_site_stats", "arguments": "{}"}}],
            },
            "finish_reason": "tool_calls",
        }],
    }
    resp = provider._parse_response(data, "deepseek-chat")
    assert resp.message.tool_calls[0].name == "get_site_stats"
    assert resp.finish_reason == "tool_calls"
