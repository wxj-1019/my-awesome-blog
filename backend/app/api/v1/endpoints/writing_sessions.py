from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.crud.writing_session import (
    abandon_writing_session,
    create_writing_session,
    get_active_writing_session,
    get_writing_session_for_user,
)
from app.exceptions import NotFoundException
from app.models.user import User
from app.schemas.writing_session import WritingSessionCreate, WritingSessionRead

router = APIRouter()


@router.post("/", response_model=WritingSessionRead, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: WritingSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return create_writing_session(db, current_user.id, payload.article_id)


@router.get("/active", response_model=WritingSessionRead)
def get_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = get_active_writing_session(db, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier="active")
    return session


@router.get("/{session_id}", response_model=WritingSessionRead)
def get_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    return session


@router.post("/{session_id}/abandon", response_model=WritingSessionRead)
def abandon_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    return abandon_writing_session(db, session)
