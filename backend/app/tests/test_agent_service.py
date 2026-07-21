"""AgentService 测试（monkeypatch provider 工厂，不发真实请求）"""
import pytest

from app.llm.base import ChatCompletionResponse, ChatMessage, Usage
from app.schemas.agent import AgentChatRequest
from app.services import agent_service as agent_service_module
from app.services.agent_service import AgentService
from app.tests.test_agent_loop import FakeProvider, _text_resp


async def test_chat_returns_reply_and_trace(test_session, monkeypatch):
    provider = FakeProvider([_text_resp("你好，我是站内助手")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    service = AgentService()
    resp = await service.chat(test_session, AgentChatRequest(message="你好"))
    assert resp.reply == "你好，我是站内助手"
    assert resp.provider == "fake"
    assert resp.model == "fake-model"
    assert resp.stop_reason == "finished"
    # system prompt 被注入
    assert provider.requests[0].messages[0].role == "system"


async def test_chat_provider_not_configured(test_session, monkeypatch):
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: None)
    service = AgentService()
    with pytest.raises(ValueError, match="不可用"):
        await service.chat(test_session, AgentChatRequest(message="你好"))


async def test_chat_max_iterations_passthrough(test_session, monkeypatch):
    provider = FakeProvider([_text_resp("ok")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)
    service = AgentService()
    resp = await service.chat(test_session, AgentChatRequest(message="hi", max_iterations=3))
    assert resp.reply == "ok"
