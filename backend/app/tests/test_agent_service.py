"""AgentService 测试（monkeypatch provider 工厂，不发真实请求）"""
import pytest

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


async def test_polish_pass_first_round(test_session, monkeypatch):
    """首轮评审即 PASS：原稿返回，rounds=0"""
    from app.schemas.agent import AgentPolishRequest
    provider = FakeProvider([_text_resp("PASS")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)
    service = AgentService()
    resp = await service.polish(AgentPolishRequest(content="# 草稿\n内容"))
    assert resp.polished == "# 草稿\n内容"
    assert resp.rounds == 0
    assert resp.critiques == []


async def test_polish_rewrite_then_pass(test_session, monkeypatch):
    """先给意见再 PASS：草稿被改写，critiques 累积"""
    from app.schemas.agent import AgentPolishRequest
    provider = FakeProvider([
        _text_resp("1. 结构混乱\n2. 有错别字"),   # 第 1 轮评审
        _text_resp("# 草稿\n改进后的内容"),        # 第 1 轮改写
        _text_resp("PASS"),                        # 第 2 轮评审
    ])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)
    service = AgentService()
    resp = await service.polish(AgentPolishRequest(content="# 草稿\n内容"))
    assert resp.polished == "# 草稿\n改进后的内容"
    assert resp.rounds == 1
    assert len(resp.critiques) == 1


async def test_polish_pass_substring_not_misjudged(test_session, monkeypatch):
    """评审意见中提及 PASS 字样不触发提前退出（严格匹配）"""
    from app.schemas.agent import AgentPolishRequest
    provider = FakeProvider([
        _text_resp("建议删除正文中的 PASS 占位词"),  # 含 PASS 但不应退出
        _text_resp("# 草稿\n改写稿"),
        _text_resp("PASS"),
    ])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)
    service = AgentService()
    resp = await service.polish(AgentPolishRequest(content="# 草稿\n内容"))
    assert resp.polished == "# 草稿\n改写稿"
    assert resp.rounds == 1
