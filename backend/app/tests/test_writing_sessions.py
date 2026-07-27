# backend/app/tests/test_writing_sessions.py
import uuid

from app.models.writing_session import WritingSession


def test_create_writing_session_defaults(test_session):
    from app.models.user import User

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
