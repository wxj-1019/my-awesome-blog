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


# ── AI 导向写作端点测试 ────────────────────────────────────────────


def _parse_sse(body: str) -> list[dict]:
    """从 SSE 响应体解析出所有 data 载荷（dict）。跳过 [DONE] 与非法行。"""
    import json
    events = []
    for line in body.splitlines():
        if not line.startswith("data: "):
            continue
        payload = line[6:].strip()
        if payload == "[DONE]":
            continue
        try:
            events.append(json.loads(payload))
        except json.JSONDecodeError:
            pass
    return events


def test_agent_generate_stream_endpoint(client, monkeypatch):
    """generate-stream：context_mode=none 时直接流式生成，content 事件 + [DONE]"""
    provider = FakeProvider([_text_resp("# 测试标题\n正文内容")])
    # 让 stream_chat 产出两个 chunk
    async def fake_stream(request):
        from app.llm.base import ChatStreamChunk
        yield ChatStreamChunk(content="# 测试标题\n")
        yield ChatStreamChunk(content="正文内容")
    provider.stream_chat = fake_stream
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post(
        "/api/v1/agent/generate-stream",
        json={"topic": "测试主题", "context_mode": "none"},
    )
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    contents = [e["content"] for e in events if "content" in e]
    assert "".join(contents) == "# 测试标题\n正文内容"


def test_agent_generate_stream_provider_unavailable(client, monkeypatch):
    """provider 未配置：SSE 返回 error 事件 + [DONE]，HTTP 仍 200（流式约定）"""
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: None)
    resp = client.post(
        "/api/v1/agent/generate-stream",
        json={"topic": "x", "context_mode": "none"},
    )
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    assert any("error" in e for e in events)


def test_agent_revise_stream_endpoint(client, monkeypatch):
    """revise-stream：当前正文 + 指令 → 流式输出改后正文"""
    provider = FakeProvider([])
    async def fake_stream(request):
        from app.llm.base import ChatStreamChunk
        yield ChatStreamChunk(content="# 改后标题\n")
        yield ChatStreamChunk(content="改后正文")
    provider.stream_chat = fake_stream
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post(
        "/api/v1/agent/revise-stream",
        json={"content": "# 原标题\n原正文", "instruction": "改口语化"},
    )
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    contents = [e["content"] for e in events if "content" in e]
    assert "".join(contents) == "# 改后标题\n改后正文"


def test_agent_meta_endpoint(client, monkeypatch):
    """meta：正文 → JSON {title, slug, excerpt}"""
    provider = FakeProvider([_text_resp('{"title":"好标题","slug":"good-slug","excerpt":"摘要"}')])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post("/api/v1/agent/meta", json={"content": "# 某文章\n正文..."})
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "好标题"
    assert data["slug"] == "good-slug"
    assert data["excerpt"] == "摘要"


def test_agent_meta_handles_code_fence(client, monkeypatch):
    """meta：模型偶尔包 ```json 围栏，服务端能容错解析"""
    provider = FakeProvider([
        _text_resp('```json\n{"title":"T","slug":"s","excerpt":"e"}\n```')
    ])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post("/api/v1/agent/meta", json={"content": "正文"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "T"


def test_agent_meta_provider_unavailable_400(client, monkeypatch):
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: None)
    resp = client.post("/api/v1/agent/meta", json={"content": "正文"})
    assert resp.status_code == 400
