# backend/app/tests/test_writing_sessions.py
import uuid

from app.models.user import User
from app.models.writing_session import WritingSession

from app.crud.writing_session import (
    abandon_writing_session,
    create_writing_session,
    get_active_writing_session,
    get_writing_session_for_user,
)


def test_create_writing_session_defaults(test_session):
    user = User(
        username="writer",
        email="writer@example.com",
        hashed_password="x",
        tenant_id=uuid.uuid4(),
    )
    test_session.add(user)
    test_session.flush()

    session = WritingSession(user_id=user.id)
    test_session.add(session)
    test_session.commit()
    test_session.refresh(session)

    assert session.stage == "clarifying"
    assert session.status == "active"
    assert session.requirements_summary == {}
    assert session.messages == []
    assert session.suggestions == []
    assert session.revisions == []
    assert session.article_id is None


def test_writing_session_crud_is_user_scoped(test_session):
    user = User(
        username="writer",
        email="writer@example.com",
        hashed_password="x",
        tenant_id=uuid.uuid4(),
    )
    test_session.add(user)
    test_session.flush()

    session = create_writing_session(test_session, user_id=user.id)
    assert get_active_writing_session(test_session, user_id=user.id).id == session.id
    assert get_writing_session_for_user(test_session, session.id, user.id).id == session.id
    assert get_writing_session_for_user(test_session, session.id, uuid.uuid4()) is None

    abandon_writing_session(test_session, session)
    assert get_active_writing_session(test_session, user_id=user.id) is None


import pytest

from app.exceptions import ConflictException
from app.services.writing_session_service import WritingSessionService


def test_outline_and_draft_stage_transitions(test_session):
    from app.crud.writing_session import create_writing_session
    from app.models.user import User

    user = User(
        username="writer2",
        email="writer2@example.com",
        hashed_password="x",
        tenant_id=uuid.uuid4(),
    )
    test_session.add(user)
    test_session.flush()

    session = create_writing_session(test_session, user_id=user.id)
    service = WritingSessionService()

    service.store_outline(test_session, session, "# 大纲\n1. 开始")
    assert session.stage == "outline_review"

    service.begin_drafting(test_session, session)
    assert session.stage == "drafting"

    service.store_draft(test_session, session, "# 初稿\n正文")
    assert session.stage == "draft_review"

    service.confirm_draft(test_session, session)
    assert session.stage == "editing"


def test_illegal_stage_transition_is_rejected(test_session):
    from app.crud.writing_session import create_writing_session
    from app.models.user import User

    user = User(
        username="writer3",
        email="writer3@example.com",
        hashed_password="x",
        tenant_id=uuid.uuid4(),
    )
    test_session.add(user)
    test_session.flush()

    session = create_writing_session(test_session, user_id=user.id)
    service = WritingSessionService()
    with pytest.raises(ConflictException):
        service.confirm_draft(test_session, session)


def test_outline_can_be_regenerated_from_outline_review(test_session):
    """store_outline 允许从 outline_review 重新生成（循环分支）"""
    from app.crud.writing_session import create_writing_session
    from app.models.user import User

    user = User(username="writer4", email="writer4@example.com", hashed_password="x", tenant_id=uuid.uuid4())
    test_session.add(user)
    test_session.flush()
    session = create_writing_session(test_session, user_id=user.id)
    service = WritingSessionService()

    service.store_outline(test_session, session, "# 第一版大纲")
    assert session.stage == "outline_review"
    # 再次 store_outline（从 outline_review 回到 outline_review）
    service.store_outline(test_session, session, "# 第二版大纲")
    assert session.outline == "# 第二版大纲"
    assert session.stage == "outline_review"


def test_draft_can_be_regenerated_from_draft_review(test_session):
    """store_draft 允许从 draft_review 重新生成（循环分支）"""
    from app.crud.writing_session import create_writing_session
    from app.models.user import User

    user = User(username="writer5", email="writer5@example.com", hashed_password="x", tenant_id=uuid.uuid4())
    test_session.add(user)
    test_session.flush()
    session = create_writing_session(test_session, user_id=user.id)
    service = WritingSessionService()

    service.store_outline(test_session, session, "# 大纲")
    service.begin_drafting(test_session, session)
    service.store_draft(test_session, session, "# 第一版初稿")
    assert session.stage == "draft_review"
    # 再次 store_draft（从 draft_review 回到 draft_review）
    service.store_draft(test_session, session, "# 第二版初稿")
    assert session.draft == "# 第二版初稿"
    assert session.stage == "draft_review"


def test_context_helpers_behavior(test_session):
    """有界上下文辅助：消息截断、上下文组装、hash 一致性"""
    from app.crud.writing_session import create_writing_session
    from app.models.user import User

    user = User(username="writer6", email="writer6@example.com", hashed_password="x", tenant_id=uuid.uuid4())
    test_session.add(user)
    test_session.flush()
    session = create_writing_session(test_session, user_id=user.id)

    # append_message 保留最后 20 条
    for i in range(25):
        WritingSessionService.append_message(session, "user", f"消息{i}")
    assert len(session.messages) == 20
    assert session.messages[0]["content"] == "消息5"
    assert session.messages[-1]["content"] == "消息24"

    # context_messages 取最后 10 条 + 系统需求摘要 + 大纲
    session.outline = "# 测试大纲"
    ctx = WritingSessionService.context_messages(session)
    assert ctx[0]["role"] == "system"  # 需求摘要
    assert "当前大纲" in ctx[-1]["content"]  # 大纲
    assert len([m for m in ctx if m["role"] in ("user", "assistant")]) == 10

    # content_hash 一致性
    h1 = WritingSessionService.content_hash("test")
    h2 = WritingSessionService.content_hash("test")
    h3 = WritingSessionService.content_hash("other")
    assert h1 == h2
    assert h1 != h3
    assert len(h1) == 64  # SHA-256 hex


def test_create_and_recover_active_writing_session(client):
    created = client.post("/api/v1/agent/writing-sessions/", json={})
    assert created.status_code == 201
    session = created.json()
    assert session["stage"] == "clarifying"

    active = client.get("/api/v1/agent/writing-sessions/active")
    assert active.status_code == 200
    assert active.json()["id"] == session["id"]


def test_abandon_session_removes_it_from_active(client):
    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    response = client.post(f"/api/v1/agent/writing-sessions/{session_id}/abandon")
    assert response.status_code == 200
    assert response.json()["status"] == "abandoned"
    assert client.get("/api/v1/agent/writing-sessions/active").status_code == 404


def test_session_cannot_be_read_by_another_user(client, test_session):
    from app.core.dependencies import get_current_active_user
    from app.main import app
    from app.models.user import User

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    other = User(
        username="other-writer",
        email="other-writer@example.com",
        hashed_password="x",
        tenant_id=uuid.uuid4(),
    )
    test_session.add(other)
    test_session.commit()

    original_override = app.dependency_overrides.get(get_current_active_user)
    app.dependency_overrides[get_current_active_user] = lambda: other
    try:
        assert client.get(f"/api/v1/agent/writing-sessions/{session_id}").status_code == 404
    finally:
        if original_override is not None:
            app.dependency_overrides[get_current_active_user] = original_override
        else:
            app.dependency_overrides.pop(get_current_active_user, None)


def test_clarification_message_persists_user_and_assistant_messages(client, monkeypatch):
    from app.services import writing_session_service as module
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    provider = FakeProvider([_text_resp('{"reply":"目标读者是谁？","requirements":{},"ready_for_outline":false}')])
    # The service uses agent_service.get_provider() which calls get_llm_provider internally.
    # Monkeypatch at the agent_service_module level like existing tests.
    from app.services import agent_service as agent_service_module
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/message/stream",
        json={"message": "我想写 AI 辅助博客"},
    )
    assert response.status_code == 200
    assert "目标读者是谁" in response.text

    restored = client.get(f"/api/v1/agent/writing-sessions/{session_id}").json()
    assert [m["role"] for m in restored["messages"][-2:]] == ["user", "assistant"]


def test_generate_outline_advances_to_outline_review(client, monkeypatch):
    from app.services import agent_service as agent_service_module
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    provider = FakeProvider([_text_resp("# 大纲\n1. 开头\n2. 正文\n3. 结尾")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    response = client.post(f"/api/v1/agent/writing-sessions/{session_id}/generate-outline")
    assert response.status_code == 200
    data = response.json()
    assert data["stage"] == "outline_review"
    assert "# 大纲" in data["outline"]


def test_adjust_outline_stays_in_outline_review(client, monkeypatch):
    from app.services import agent_service as agent_service_module
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    provider = FakeProvider([
        _text_resp("# 第一版大纲\n1. 开头"),  # generate_outline
        _text_resp("# 调整后大纲\n1. 新开头\n2. 新结尾"),  # adjust_outline
    ])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    # First generate
    client.post(f"/api/v1/agent/writing-sessions/{session_id}/generate-outline")
    # Then adjust
    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/outline/adjust",
        json={"message": "加一个结尾部分"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["stage"] == "outline_review"
    assert "新结尾" in data["outline"]


def test_message_stream_wrong_stage_returns_409(client, monkeypatch):
    """非 clarifying 阶段发消息应返回 409，不是静默 200"""
    from app.services import agent_service as agent_service_module
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    provider = FakeProvider([_text_resp("# 大纲\n1. 内容")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    # Advance to outline_review
    client.post(f"/api/v1/agent/writing-sessions/{session_id}/generate-outline")
    # Now message/stream should 409 (wrong stage)
    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/message/stream",
        json={"message": "测试"},
    )
    assert response.status_code == 409


def test_confirm_outline_streams_draft_and_advances_stage(client, monkeypatch):
    from app.services import agent_service as agent_service_module
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    # generate_outline needs one response, confirm-outline streams the draft
    provider = FakeProvider([
        _text_resp("# 大纲\n1. 开头\n2. 正文"),  # generate_outline
    ])
    # For streaming, FakeProvider.stream_chat needs to be patched to yield chunks
    async def fake_stream(request):
        from app.llm.base import ChatStreamChunk
        yield ChatStreamChunk(content="# 初稿标题\n")
        yield ChatStreamChunk(content="正文内容")
    provider.stream_chat = fake_stream
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    # First generate outline to reach outline_review
    client.post(f"/api/v1/agent/writing-sessions/{session_id}/generate-outline")
    # Then confirm outline → streams draft
    response = client.post(f"/api/v1/agent/writing-sessions/{session_id}/confirm-outline")
    assert response.status_code == 200
    assert "# 初稿标题" in response.text

    restored = client.get(f"/api/v1/agent/writing-sessions/{session_id}").json()
    assert restored["stage"] == "draft_review"
    assert "# 初稿标题" in restored["draft"]


def test_confirm_draft_advances_to_editing(client, monkeypatch):
    from app.services import agent_service as agent_service_module
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    provider = FakeProvider([_text_resp("# 大纲\n1. 内容")])
    async def fake_stream(request):
        from app.llm.base import ChatStreamChunk
        yield ChatStreamChunk(content="# 初稿\n正文")
    provider.stream_chat = fake_stream
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    client.post(f"/api/v1/agent/writing-sessions/{session_id}/generate-outline")
    client.post(f"/api/v1/agent/writing-sessions/{session_id}/confirm-outline")

    response = client.post(f"/api/v1/agent/writing-sessions/{session_id}/confirm-draft")
    assert response.status_code == 200
    data = response.json()
    assert data["stage"] == "editing"
    assert "# 初稿" in data["draft"]


def test_interrupted_draft_does_not_advance_stage(test_session, monkeypatch):
    """流式生成初稿时 provider 异常，阶段不应推进到 draft_review"""
    from app.crud.writing_session import create_writing_session
    from app.models.user import User
    from app.services import agent_service as agent_service_module
    from app.services.writing_session_service import WritingSessionService
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    user = User(username="writer7", email="writer7@example.com", hashed_password="x", tenant_id=uuid.uuid4())
    test_session.add(user)
    test_session.flush()
    session = create_writing_session(test_session, user_id=user.id)
    service = WritingSessionService()

    # Advance to outline_review
    service.store_outline(test_session, session, "# 大纲\n1. 内容")

    # Provider whose stream_chat raises after first chunk
    provider = FakeProvider([])
    async def failing_stream(request):
        from app.llm.base import ChatStreamChunk
        yield ChatStreamChunk(content="# 不完整的")
        raise RuntimeError("模拟网络中断")
    provider.stream_chat = failing_stream
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    # Consume the generator
    import asyncio
    async def consume():
        async for chunk in service.generate_draft_stream(test_session, session):
            pass  # drain all events including error event
    asyncio.run(consume())

    # Verify stage did NOT advance
    assert session.stage == "drafting"
    assert session.draft == ""


# ── Phase 2: 全文分析 + 非破坏性修订预览 ───────────────────────────
# 复用 test_agent_loop 的 FakeProvider 脚本化 provider。

import json

from app.services import agent_service as agent_service_module


def _advance_to_editing(client, session_id, monkeypatch, draft="# 初稿\n正文"):
    """把会话从 clarifying 推进到 editing：生成大纲 → 确认大纲（流式生成初稿）→ 确认初稿。

    返回最后一次使用的 provider，便于后续测试再 monkeypatch。
    """
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    provider = FakeProvider([_text_resp("# 大纲\n1. 内容")])

    async def fake_stream(request):
        from app.llm.base import ChatStreamChunk
        yield ChatStreamChunk(content=draft)

    provider.stream_chat = fake_stream
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    client.post(f"/api/v1/agent/writing-sessions/{session_id}/generate-outline")
    client.post(f"/api/v1/agent/writing-sessions/{session_id}/confirm-outline")
    client.post(f"/api/v1/agent/writing-sessions/{session_id}/confirm-draft")
    return provider


def test_analyze_returns_structured_suggestions(client, monkeypatch):
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    _advance_to_editing(client, session_id, monkeypatch)

    # analyze 走非流式 chat，需要返回 JSON
    suggestions_json = json.dumps({
        "suggestions": [{
            "type": "structure",
            "title": "补充开场问题",
            "reason": "当前开头缺少读者场景",
            "scope": "第一段",
        }]
    }, ensure_ascii=False)
    provider = FakeProvider([_text_resp(suggestions_json)])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    content = "# 标题\n正文"
    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/analyze",
        json={"content": content, "content_hash": "a" * 64},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["suggestions"]) >= 1
    s = data["suggestions"][0]
    assert s["status"] == "pending"
    assert s["id"]  # 自动生成的 id
    assert s["type"] == "structure"
    assert s["title"] == "补充开场问题"


def test_analyze_wrong_stage_returns_409(client, monkeypatch):
    """非 editing 阶段调用 analyze 应 409（在 StreamingResponse 之前校验，但 analyze 非流式）"""
    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    # 仍处于 clarifying
    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/analyze",
        json={"content": "x", "content_hash": "a" * 64},
    )
    assert response.status_code == 409


def test_selection_revision_is_preview_only(client, monkeypatch):
    from app.tests.test_agent_loop import FakeProvider

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    _advance_to_editing(client, session_id, monkeypatch, draft="# 初稿\n正文")

    # 选段修改走流式 stream_chat
    provider_revise = FakeProvider([])

    async def stream_revision(request):
        from app.llm.base import ChatStreamChunk
        yield ChatStreamChunk(content="修改后的段落")

    provider_revise.stream_chat = stream_revision
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider_revise)

    content = "第一段。第二段。"
    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/revise-selection/stream",
        json={
            "content": content,
            "selected_text": "第二段。",
            "selection_start": 4,
            "selection_end": 8,
            "instruction": "更具体",
            "content_hash": "b" * 64,
        },
    )
    assert response.status_code == 200
    assert "修改后的段落" in response.text

    restored = client.get(f"/api/v1/agent/writing-sessions/{session_id}").json()
    # draft 不应被修改（预览模式，非破坏性）
    assert restored["draft"] == "# 初稿\n正文"
    # 应生成一条 previewed 状态的修订记录
    assert len(restored["revisions"]) == 1
    rev = restored["revisions"][0]
    assert rev["source"] == "selection"
    assert rev["status"] == "previewed"
    assert rev["replacement_text"] == "修改后的段落"
    assert rev["original_text"] == "第二段。"
    assert rev["content_hash"] == "b" * 64
    assert rev["id"]  # revision_id 已发到 meta
    # SSE 末尾应包含 revision_id 的 meta 事件
    assert rev["id"] in response.text


def test_selection_revision_wrong_stage_returns_409(client, monkeypatch):
    """非 editing 阶段调用 revise-selection 应在 StreamingResponse 之前 409"""
    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    # 仍处于 clarifying
    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/revise-selection/stream",
        json={
            "content": "第一段。第二段。",
            "selected_text": "第二段。",
            "selection_start": 4,
            "selection_end": 8,
            "instruction": "更具体",
            "content_hash": "b" * 64,
        },
    )
    assert response.status_code == 409


def test_apply_revision_with_matching_hash(client, monkeypatch):
    """应用修订成功后状态变为 applied，相关建议同步标记"""
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    _advance_to_editing(client, session_id, monkeypatch)

    # 先 analyze 出一条建议
    suggestions_json = json.dumps({
        "suggestions": [{
            "type": "readability",
            "title": "缩短开头",
            "reason": "开头过长",
            "scope": "第一段",
        }]
    }, ensure_ascii=False)
    provider = FakeProvider([_text_resp(suggestions_json)])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)
    client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/analyze",
        json={"content": "# 标题\n正文", "content_hash": "c" * 64},
    )
    restored = client.get(f"/api/v1/agent/writing-sessions/{session_id}").json()
    suggestion_id = restored["suggestions"][0]["id"]

    # 用建议触发一条修订预览
    provider_revise = FakeProvider([])
    suggestion_content_hash = "d" * 64

    async def stream_revision(request):
        from app.llm.base import ChatStreamChunk
        yield ChatStreamChunk(content="更短的开头")

    provider_revise.stream_chat = stream_revision
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider_revise)
    client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/revise-suggestion/stream",
        json={
            "suggestion_id": suggestion_id,
            "content": "# 标题\n正文",
            "content_hash": suggestion_content_hash,
        },
    )

    restored = client.get(f"/api/v1/agent/writing-sessions/{session_id}").json()
    revision_id = restored["revisions"][0]["id"]

    # 用匹配的 hash 应用修订
    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/apply-revision",
        json={"revision_id": revision_id, "content_hash": suggestion_content_hash},
    )
    assert response.status_code == 200
    applied = response.json()
    assert applied["revisions"][0]["status"] == "applied"
    # 关联建议也应标记为 applied
    assert applied["suggestions"][0]["status"] == "applied"


def test_apply_revision_with_mismatched_hash_returns_409(client, monkeypatch):
    """修订存在但正文已变化（hash 不匹配）应返回 409"""
    from app.tests.test_agent_loop import FakeProvider

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    _advance_to_editing(client, session_id, monkeypatch)

    # 先生成一条 selection 修订（hash = b*64）
    provider_revise = FakeProvider([])

    async def stream_revision(request):
        from app.llm.base import ChatStreamChunk
        yield ChatStreamChunk(content="新段落")

    provider_revise.stream_chat = stream_revision
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider_revise)
    client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/revise-selection/stream",
        json={
            "content": "第一段。第二段。",
            "selected_text": "第二段。",
            "selection_start": 4,
            "selection_end": 8,
            "instruction": "更具体",
            "content_hash": "b" * 64,
        },
    )
    restored = client.get(f"/api/v1/agent/writing-sessions/{session_id}").json()
    revision_id = restored["revisions"][0]["id"]

    # 用错误的 hash 应用 → 409
    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/apply-revision",
        json={"revision_id": revision_id, "content_hash": "wrong" + "x" * 59},
    )
    assert response.status_code == 409


def test_apply_nonexistent_revision_returns_404(client, monkeypatch):
    """修订不存在应返回 404（先于 hash 校验）"""
    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    _advance_to_editing(client, session_id, monkeypatch)

    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/apply-revision",
        json={"revision_id": "fake-id", "content_hash": "x" * 64},
    )
    assert response.status_code == 404


def test_discard_revision_marks_status(client, monkeypatch):
    """放弃修订应把状态标为 discarded"""
    from app.tests.test_agent_loop import FakeProvider

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    _advance_to_editing(client, session_id, monkeypatch)

    provider_revise = FakeProvider([])

    async def stream_revision(request):
        from app.llm.base import ChatStreamChunk
        yield ChatStreamChunk(content="新段落")

    provider_revise.stream_chat = stream_revision
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider_revise)
    client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/revise-selection/stream",
        json={
            "content": "第一段。",
            "selected_text": "第一段。",
            "selection_start": 0,
            "selection_end": 3,
            "instruction": "改写",
            "content_hash": "b" * 64,
        },
    )
    restored = client.get(f"/api/v1/agent/writing-sessions/{session_id}").json()
    revision_id = restored["revisions"][0]["id"]

    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/discard-revision",
        json={"revision_id": revision_id},
    )
    assert response.status_code == 200
    assert response.json()["revisions"][0]["status"] == "discarded"


def test_revise_suggestion_unknown_suggestion_returns_404(client, monkeypatch):
    """对不存在的建议生成修订应在 StreamingResponse 之前 404"""
    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    _advance_to_editing(client, session_id, monkeypatch)

    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/revise-suggestion/stream",
        json={
            "suggestion_id": "nope",
            "content": "# 标题\n正文",
            "content_hash": "a" * 64,
        },
    )
    assert response.status_code == 404


def test_complete_session_advances_stage(client, monkeypatch):
    """complete 端点把 stage/status 都置为 completed"""
    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    _advance_to_editing(client, session_id, monkeypatch)

    response = client.post(f"/api/v1/agent/writing-sessions/{session_id}/complete")
    assert response.status_code == 200
    data = response.json()
    assert data["stage"] == "completed"
    assert data["status"] == "completed"


def test_link_article_binds_article_id(client, monkeypatch, test_session):
    """link-article 端点验证文章存在并写入 article_id"""
    from app.models.article import Article
    from app.models.user import User

    # 取测试用户（与 override_auth 一致）
    user = test_session.query(User).filter_by(username="testadmin").first()
    article = Article(title="t", slug=f"slug-{uuid.uuid4()}", content="c", author_id=user.id)
    test_session.add(article)
    test_session.commit()
    test_session.refresh(article)

    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    _advance_to_editing(client, session_id, monkeypatch)

    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/link-article",
        json={"article_id": str(article.id)},
    )
    assert response.status_code == 200
    assert response.json()["article_id"] == str(article.id)


def test_link_article_unknown_returns_404(client, monkeypatch):
    session_id = client.post("/api/v1/agent/writing-sessions/", json={}).json()["id"]
    _advance_to_editing(client, session_id, monkeypatch)

    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/link-article",
        json={"article_id": str(uuid.uuid4())},
    )
    assert response.status_code == 404

