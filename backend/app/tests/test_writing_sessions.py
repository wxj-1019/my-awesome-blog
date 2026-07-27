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
