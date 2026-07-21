"""Agent API 端点测试（认证/限流已由 conftest mock）"""
from app.services import agent_service as agent_service_module
from app.tests.test_agent_loop import FakeProvider, _text_resp


def test_agent_chat_endpoint(client, test_session, monkeypatch):
    provider = FakeProvider([_text_resp("站内共 5 篇文章")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post("/api/v1/agent/chat", json={"message": "站里有几篇文章？"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["reply"] == "站内共 5 篇文章"
    assert data["stop_reason"] == "finished"
    assert data["tool_calls"] == []


def test_agent_chat_empty_message_422(client):
    resp = client.post("/api/v1/agent/chat", json={"message": ""})
    assert resp.status_code == 422


def test_agent_chat_provider_unavailable_400(client, monkeypatch):
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: None)
    resp = client.post("/api/v1/agent/chat", json={"message": "hi"})
    assert resp.status_code == 400
    assert "不可用" in resp.json()["error"]["message"]


def test_agent_polish_endpoint(client, monkeypatch):
    provider = FakeProvider([_text_resp("PASS")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post("/api/v1/agent/polish", json={"content": "# 草稿\n内容"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["polished"] == "# 草稿\n内容"  # 第一轮就 PASS，原样返回
    assert data["rounds"] == 0
