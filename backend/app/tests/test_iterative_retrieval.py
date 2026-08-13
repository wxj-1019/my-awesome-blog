"""迭代检索（LazyGraphRAG 风格图循环）测试。

测试 _iterative_retrieval 的图循环语义：检索 → 评估 → 改写查询 → 再检索，
最多 max_rounds 轮；用假 provider 模拟 LLM 评估输出。
"""
import uuid

import pytest

from app.models.article import Article
from app.models.user import User
from app.services.agent_service import AgentService


class _FakeProvider:
    """模拟 LLM provider：evaluate 节点按剧本返回 sufficient/refined_query。"""

    def __init__(self, script: list[dict]):
        self.script = list(script)
        self.calls = 0

    def get_provider_name(self):
        return "fake"

    def get_model_name(self):
        return "fake-model"

    async def chat(self, request):
        step = self.script[min(self.calls, len(self.script) - 1)]
        self.calls += 1
        import json as _json
        content = step.get("content", "")
        if isinstance(content, dict):
            content = _json.dumps(content, ensure_ascii=False)
        from app.llm.base import ChatCompletionResponse, ChatMessage
        return ChatCompletionResponse(
            message=ChatMessage(role="assistant", content=content),
            model="fake-model",
        )


def _seed_articles(test_session, user_id) -> None:
    test_session.add(Article(
        title="Docker 容器化实践",
        slug="docker-practice",
        content="Docker 容器化部署的实践总结",
        excerpt="容器化部署实践",
        is_published=True,
        author_id=user_id,
    ))
    test_session.commit()


@pytest.mark.asyncio
async def test_iterative_retrieval_until_sufficient(test_session):
    """两轮：首轮检索+评估不充分改写查询 → 二轮检索 → 评估充分结束。"""
    user = User(
        tenant_id=uuid.uuid4(), username="retrieval_user",
        email="retrieval@example.com", hashed_password="x", is_active=True,
    )
    test_session.add(user)
    test_session.commit()
    _seed_articles(test_session, user.id)

    provider = _FakeProvider([
        {"content": {"sufficient": False, "refined_query": "Docker 容器化"}},
        {"content": {"sufficient": True, "refined_query": ""}},
    ])
    service = AgentService()
    found = await service._iterative_retrieval(provider, test_session, "docker", max_rounds=3)

    # 首轮 query="docker" ilike 命中 Docker 文章；二轮 query="Docker 容器化" 也命中但去重
    assert any("docker-practice" in line for line in found)
    # 两轮各触发一次 LLM 评估
    assert provider.calls == 2


@pytest.mark.asyncio
async def test_iterative_retrieval_hits_round_cap(test_session):
    """评估一直返回不充分：达到 max_rounds 上限强制结束。"""
    user = User(
        tenant_id=uuid.uuid4(), username="retrieval_cap_user",
        email="retrieval-cap@example.com", hashed_password="x", is_active=True,
    )
    test_session.add(user)
    test_session.commit()

    provider = _FakeProvider([
        {"content": {"sufficient": False, "refined_query": "关键词二"}},
        {"content": {"sufficient": False, "refined_query": "关键词三"}},
        {"content": {"sufficient": False, "refined_query": "关键词四"}},
    ])
    service = AgentService()
    found = await service._iterative_retrieval(provider, test_session, "关键词一", max_rounds=2)

    # max_rounds=2：最多两轮检索 + 两次评估，之后强制结束
    assert provider.calls == 2
    assert found == []


@pytest.mark.asyncio
async def test_iterative_retrieval_unparseable_eval(test_session):
    """评估输出不可解析 JSON：保守结束，用已有结果。"""
    user = User(
        tenant_id=uuid.uuid4(), username="retrieval_bad_user",
        email="retrieval-bad@example.com", hashed_password="x", is_active=True,
    )
    test_session.add(user)
    test_session.commit()
    _seed_articles(test_session, user.id)

    provider = _FakeProvider([{"content": "这不是 JSON"}])
    service = AgentService()
    found = await service._iterative_retrieval(provider, test_session, "docker", max_rounds=3)

    assert any("docker-practice" in line for line in found)
    assert provider.calls == 1  # 仅首轮评估即结束
