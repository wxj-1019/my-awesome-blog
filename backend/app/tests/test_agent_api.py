"""Agent API 端点测试（认证/限流已由 conftest mock）"""
from app.services import agent_service as agent_service_module
from app.tests.test_agent_loop import FakeProvider, _text_resp


def test_agent_chat_endpoint(client, monkeypatch):
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


def test_agent_polish_provider_unavailable_400(client, monkeypatch):
    """polish 在 provider 未配置时同样返回 400"""
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: None)
    resp = client.post("/api/v1/agent/polish", json={"content": "# 草稿"})
    assert resp.status_code == 400
    assert "不可用" in resp.json()["error"]["message"]


def test_agent_chat_with_tool_call(client, test_session, monkeypatch):
    """chat 端到端走工具循环：模型先调工具再回答，响应含 tool_calls trace"""
    from app.tests.test_agent_loop import _tool_resp

    provider = FakeProvider([
        _tool_resp("get_site_stats", "{}"),
        _text_resp("站内共 0 篇已发布文章"),
    ])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post("/api/v1/agent/chat", json={"message": "站里有几篇文章？"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["reply"] == "站内共 0 篇已发布文章"
    assert len(data["tool_calls"]) == 1
    assert data["tool_calls"][0]["name"] == "get_site_stats"
    assert "站点统计" in data["tool_calls"][0]["result_preview"]
    assert data["iterations"] == 2
