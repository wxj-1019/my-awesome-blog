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


def _setup_cover_source(monkeypatch, source: str, unsplash_key: str = ""):
    """统一设置图源配置（COVER_SOURCE + UNSPLASH_ACCESS_KEY）"""
    from app.core.config import settings
    monkeypatch.setattr(settings, "COVER_SOURCE", source)
    monkeypatch.setattr(settings, "UNSPLASH_ACCESS_KEY", unsplash_key)


def test_agent_cover_forced_unsplash_without_key_400(client, monkeypatch):
    """强制 unsplash 但未配 key：400"""
    _setup_cover_source(monkeypatch, "unsplash", "")
    resp = client.post("/api/v1/agent/cover", json={"content": "# 文章\n正文", "query": "x"})
    assert resp.status_code == 400
    assert "UNSPLASH_ACCESS_KEY" in resp.json()["error"]["message"]


def test_agent_cover_openverse_manual_query(client, monkeypatch):
    """Openverse 手动 query（默认零配置图源）：直接搜，返回候选"""
    _setup_cover_source(monkeypatch, "openverse")

    class FakeResp:
        status_code = 200
        text = '{"results":[]}'
        def json(self):
            return {
                "results": [
                    {
                        "url": "https://live.staticflickr.com/r1.jpg",
                        "thumbnail": "/v1/images/id1/thumb/",
                        "title": "a laptop",
                        "creator": "Alice",
                        "creator_url": "https://flickr.com/alice",
                    },
                    {
                        "url": "https://live.staticflickr.com/r2.jpg",
                        "thumbnail": None,  # 缩略图缺失，应退化用原图
                        "title": None,
                        "creator": None,
                        "creator_url": None,
                    },
                ]
            }

    class FakeClient:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def get(self, url, params=None, headers=None):
            # 确认走的是 Openverse 端点 + 传了宽松协议过滤
            assert "openverse.org" in url
            assert params["q"] == "docker"
            assert "cc0" in params["license"]  # 版权过滤生效
            return FakeResp()

    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)

    resp = client.post("/api/v1/agent/cover", json={"content": "正文", "query": "docker"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["query"] == "docker"
    assert len(data["images"]) == 2
    assert data["images"][0]["url"] == "https://live.staticflickr.com/r1.jpg"
    # 相对路径缩略图应拼成完整 URL
    assert data["images"][0]["thumb_url"] == "https://api.openverse.org/v1/images/id1/thumb/"
    assert data["images"][0]["author_name"] == "Alice"
    # 缩略图缺失时退化用原图
    assert data["images"][1]["thumb_url"] == "https://live.staticflickr.com/r2.jpg"
    assert data["images"][1]["alt"] == ""
    assert data["images"][1]["author_name"] == ""


def test_agent_cover_openverse_ai_query(client, monkeypatch):
    """Openverse + AI 生词：未手填 query 时 AI 提取后再搜"""
    _setup_cover_source(monkeypatch, "openverse")

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
            captured["query"] = params["q"]
            return FakeResp()
    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)

    resp = client.post("/api/v1/agent/cover", json={"content": "# Docker 入门\n正文"})
    assert resp.status_code == 200
    assert captured["query"] == "docker coding"
    assert resp.json()["query"] == "docker coding"


def test_agent_cover_auto_falls_back_to_openverse(client, monkeypatch):
    """auto 模式 + 未配 Unsplash key：自动 fallback 到 Openverse"""
    _setup_cover_source(monkeypatch, "auto", "")  # 默认 auto + 无 key

    hit = {"openverse": False}
    class FakeResp:
        status_code = 200
        text = '{"results":[]}'
        def json(self): return {"results": []}
    class FakeClient:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def get(self, url, params=None, headers=None):
            if "openverse.org" in url:
                hit["openverse"] = True
            return FakeResp()
    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)

    resp = client.post("/api/v1/agent/cover", json={"content": "正文", "query": "tech"})
    assert resp.status_code == 200
    assert hit["openverse"] is True


def test_agent_cover_auto_uses_unsplash_when_keyed(client, monkeypatch):
    """auto 模式 + 配了 Unsplash key：优先用 Unsplash"""
    _setup_cover_source(monkeypatch, "auto", "test-key")

    hit = {"unsplash": False, "openverse": False}
    class FakeResp:
        status_code = 200
        text = '{"results":[]}'
        def json(self): return {"results": []}
    class FakeClient:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def get(self, url, params=None, headers=None):
            if "unsplash.com" in url:
                hit["unsplash"] = True
            elif "openverse.org" in url:
                hit["openverse"] = True
            return FakeResp()
    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)

    resp = client.post("/api/v1/agent/cover", json={"content": "正文", "query": "tech"})
    assert resp.status_code == 200
    assert hit["unsplash"] is True
    assert hit["openverse"] is False  # 没回退到 Openverse


def test_agent_cover_openverse_http_error_400(client, monkeypatch):
    """Openverse 返回非 200：转 400"""
    _setup_cover_source(monkeypatch, "openverse")

    class FakeResp:
        status_code = 500
        text = "server error"
    class FakeClient:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def get(self, *a, **kw): return FakeResp()
    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)

    resp = client.post("/api/v1/agent/cover", json={"content": "正文", "query": "x"})
    assert resp.status_code == 400
    assert "500" in resp.json()["error"]["message"]
