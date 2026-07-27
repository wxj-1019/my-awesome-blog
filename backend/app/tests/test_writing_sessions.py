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
