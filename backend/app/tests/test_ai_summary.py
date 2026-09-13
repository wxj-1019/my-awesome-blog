"""AI 文章摘要端点测试（/api/v1/ai/article-summary；认证/限流已由 conftest mock）"""

import pytest

from app.api.v1.endpoints import ai as ai_endpoint
from app.core.dependencies import (
    get_current_active_user,
    get_current_superuser,
    get_current_user_optional,
)
from app.main import app
from app.tests.test_agent_loop import FakeProvider, _text_resp

# 满足 min_length=50 的有效正文
LONG_CONTENT = "这是一篇关于 Docker 容器化部署的博客文章，讲解镜像构建、compose 编排与上线回滚。" * 3


@pytest.fixture
def anon_client(client):
    """仅移除认证相关 override（get_db 等基础设施 override 必须保留），
    走真实认证链：无 token → 401"""
    saved = dict(app.dependency_overrides)
    for dep in (get_current_active_user, get_current_superuser, get_current_user_optional):
        app.dependency_overrides.pop(dep, None)
    yield client
    app.dependency_overrides.clear()
    app.dependency_overrides.update(saved)


def test_article_summary_success(client, monkeypatch):
    """登录后成功生成摘要，响应只含 summary 字段（契约冻结）"""
    provider = FakeProvider([_text_resp("这篇文章介绍了 Docker 容器化部署的核心步骤。")])
    monkeypatch.setattr(ai_endpoint, "get_llm_provider", lambda name=None: provider)

    resp = client.post(
        "/api/v1/ai/article-summary",
        json={"title": "Docker 部署指南", "content": LONG_CONTENT},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["summary"] == "这篇文章介绍了 Docker 容器化部署的核心步骤。"
    assert set(data.keys()) == {"summary"}


def test_article_summary_empty_title_ok(client, monkeypatch):
    """空标题合法：AI 初稿确认前 title 可能为空，按正文为主生成（契约与前端对齐）"""
    provider = FakeProvider([_text_resp("摘要内容。")])
    monkeypatch.setattr(ai_endpoint, "get_llm_provider", lambda name=None: provider)

    resp = client.post(
        "/api/v1/ai/article-summary",
        json={"title": "", "content": LONG_CONTENT},
    )
    assert resp.status_code == 200
    assert resp.json()["summary"] == "摘要内容。"


def test_article_summary_max_length_passed_to_prompt(client, monkeypatch):
    """max_length 应作为限长指令出现在 prompt 中，标题/正文一并注入"""
    provider = FakeProvider([_text_resp("摘要")])
    monkeypatch.setattr(ai_endpoint, "get_llm_provider", lambda name=None: provider)

    resp = client.post(
        "/api/v1/ai/article-summary",
        json={"title": "Docker 部署指南", "content": LONG_CONTENT, "max_length": 80},
    )
    assert resp.status_code == 200
    prompt = provider.requests[0].messages[0].content
    assert "不超过 80 字" in prompt
    assert "Docker 部署指南" in prompt
    assert "Docker 容器化部署" in prompt


def test_article_summary_long_content_truncated(client, monkeypatch):
    """正文超过 6000 字符时截断到模型安全长度"""
    provider = FakeProvider([_text_resp("摘要")])
    monkeypatch.setattr(ai_endpoint, "get_llm_provider", lambda name=None: provider)

    resp = client.post(
        "/api/v1/ai/article-summary",
        json={"title": "T", "content": "这是一段很长的正文内容。" * 2000, "max_length": 100},
    )
    assert resp.status_code == 200
    prompt = provider.requests[0].messages[0].content
    # 截断后 prompt 总长不会接近 16000 字符的原始输入
    assert len(prompt) < 7000
    assert "这是一段很长的正文内容" in prompt


def test_article_summary_unauthenticated_401(anon_client):
    """未登录 → 401"""
    resp = anon_client.post(
        "/api/v1/ai/article-summary",
        json={"title": "T", "content": LONG_CONTENT},
    )
    assert resp.status_code == 401


def test_article_summary_short_content_422(client):
    """content 少于 50 字 → 422（过短内容无摘要意义）"""
    resp = client.post(
        "/api/v1/ai/article-summary",
        json={"title": "T", "content": "太短的正文"},
    )
    assert resp.status_code == 422


def test_article_summary_llm_failure_502(client, monkeypatch):
    """LLM 调用抛异常 → LLMServiceException → 502（项目错误格式）"""

    class ExplodingProvider(FakeProvider):
        async def chat(self, request):
            raise RuntimeError("upstream timeout")

    provider = ExplodingProvider([])
    monkeypatch.setattr(ai_endpoint, "get_llm_provider", lambda name=None: provider)

    resp = client.post(
        "/api/v1/ai/article-summary",
        json={"title": "T", "content": LONG_CONTENT},
    )
    assert resp.status_code == 502
    assert "摘要" in resp.json()["error"]["message"]


def test_article_summary_provider_unavailable_502(client, monkeypatch):
    """provider 未配置（无 API key）→ 502"""
    monkeypatch.setattr(ai_endpoint, "get_llm_provider", lambda name=None: None)
    resp = client.post(
        "/api/v1/ai/article-summary",
        json={"title": "T", "content": LONG_CONTENT},
    )
    assert resp.status_code == 502
    assert "不可用" in resp.json()["error"]["message"]
