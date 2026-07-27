from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.writing_session import WritingSession


def create_writing_session(db: Session, user_id: UUID, article_id: Optional[UUID] = None) -> WritingSession:
    session = WritingSession(user_id=user_id, article_id=article_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_writing_session_for_user(db: Session, session_id: UUID, user_id: UUID) -> Optional[WritingSession]:
    return db.query(WritingSession).filter(
        WritingSession.id == session_id,
        WritingSession.user_id == user_id,
        WritingSession.status != "abandoned",
    ).first()


def get_active_writing_session(db: Session, user_id: UUID) -> Optional[WritingSession]:
    return db.query(WritingSession).filter(
        WritingSession.user_id == user_id,
        WritingSession.status == "active",
    ).order_by(WritingSession.updated_at.desc()).first()


def abandon_writing_session(db: Session, session: WritingSession) -> WritingSession:
    session.status = "abandoned"
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def save_writing_session(db: Session, session: WritingSession) -> WritingSession:
    db.add(session)
    db.commit()
    db.refresh(session)
    return session
