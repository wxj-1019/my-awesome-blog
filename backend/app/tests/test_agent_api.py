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


def test_agent_meta_handles_narrative_with_braces(client, monkeypatch):
    """meta：模型在 JSON 前后夹带叙述且叙述含花括号，括号配平仍能提取正确对象"""
    provider = FakeProvider([
        _text_resp('好的，这是结果：{"title":"真实标题","slug":"real-slug","excerpt":"摘"} 希望满意 {footnote}')
    ])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post("/api/v1/agent/meta", json={"content": "正文"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "真实标题"
    assert data["slug"] == "real-slug"


def test_agent_meta_handles_two_json_objects(client, monkeypatch):
    """meta：模型吐了两个 JSON 对象，只取第一个完整的"""
    provider = FakeProvider([
        _text_resp('{"title":"第一个","slug":"first","excerpt":"一"} 解释 {"slug":"second"}')
    ])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post("/api/v1/agent/meta", json={"content": "正文"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "第一个"


def test_agent_generate_stream_error_format(client, monkeypatch):
    """generate-stream：provider 不可用时错误事件格式为 {error:true,message}（对齐 llm_service）"""
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: None)
    resp = client.post(
        "/api/v1/agent/generate-stream",
        json={"topic": "x", "context_mode": "none"},
    )
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    err_events = [e for e in events if e.get("error") is True]
    assert len(err_events) >= 1
    assert "message" in err_events[0]


def test_agent_meta_provider_unavailable_400(client, monkeypatch):
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: None)
    resp = client.post("/api/v1/agent/meta", json={"content": "正文"})
    assert resp.status_code == 400


# ── 封面配图搜索端点测试 ───────────────────────────────────────────


def test_agent_cover_unconfigured_key_400(client, monkeypatch):
    """未配置 UNSPLASH_ACCESS_KEY：返回 400"""
    # settings 是单例，monkeypatch 其属性
    from app.core.config import settings
    monkeypatch.setattr(settings, "UNSPLASH_ACCESS_KEY", "")
    resp = client.post("/api/v1/agent/cover", json={"content": "# 文章\n正文"})
    assert resp.status_code == 400
    assert "UNSPLASH_ACCESS_KEY" in resp.json()["error"]["message"]


def _fake_unsplash_response():
    """构造一个最小合法的 Unsplash search 响应"""
    return {
        "results": [
            {
                "urls": {"regular": "https://img.example.com/r1.jpg", "thumb": "https://img.example.com/t1.jpg"},
                "alt_description": "a laptop on desk",
                "user": {"name": "Alice", "links": {"html": "https://unsplash.com/@alice"}},
            },
            {
                "urls": {"regular": "https://img.example.com/r2.jpg", "thumb": "https://img.example.com/t2.jpg"},
                "alt_description": None,
                "user": {"name": "Bob", "links": {"html": "https://unsplash.com/@bob"}},
            },
        ]
    }


def test_agent_cover_manual_query(client, monkeypatch):
    """手动指定 query：跳过 AI 生词，直接调 Unsplash（mock httpx）"""
    from app.core.config import settings
    monkeypatch.setattr(settings, "UNSPLASH_ACCESS_KEY", "test-key")

    class FakeResp:
        status_code = 200
        text = '{"results":[]}'
        def json(self):
            return _fake_unsplash_response()

    class FakeClient:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def get(self, url, params=None, headers=None):
            assert "query" in params and params["query"] == "docker"
            return FakeResp()

    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)

    resp = client.post("/api/v1/agent/cover", json={"content": "正文", "query": "docker"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["query"] == "docker"
    assert len(data["images"]) == 2
    assert data["images"][0]["url"] == "https://img.example.com/r1.jpg"
    assert data["images"][0]["author_name"] == "Alice"
    # alt 缺失时兜底为空字符串
    assert data["images"][1]["alt"] == ""


def test_agent_cover_ai_generated_query(client, monkeypatch):
    """未手填 query：AI 生词后再搜 Unsplash"""
    from app.core.config import settings
    monkeypatch.setattr(settings, "UNSPLASH_ACCESS_KEY", "test-key")

    provider = FakeProvider([_text_resp("docker coding")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    captured = {}
    class FakeResp:
        status_code = 200
        text = '{"results":[]}'
        def json(self): return {"results": []}
    class FakeClient:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def get(self, url, params=None, headers=None):
            captured["query"] = params["query"]
            return FakeResp()
    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)

    resp = client.post("/api/v1/agent/cover", json={"content": "# Docker 入门\n正文"})
    assert resp.status_code == 200
    # AI 生成的搜索词传给了 Unsplash
    assert captured["query"] == "docker coding"
    assert resp.json()["query"] == "docker coding"


def test_agent_cover_unsplash_http_error_400(client, monkeypatch):
    """Unsplash 返回非 200：转 400"""
    from app.core.config import settings
    monkeypatch.setattr(settings, "UNSPLASH_ACCESS_KEY", "test-key")

    class FakeResp:
        status_code = 401
        text = "unauthorized"
    class FakeClient:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def get(self, *a, **kw): return FakeResp()
    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)

    resp = client.post("/api/v1/agent/cover", json={"content": "正文", "query": "x"})
    assert resp.status_code == 400
    assert "401" in resp.json()["error"]["message"]
