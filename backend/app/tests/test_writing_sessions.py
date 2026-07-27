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
