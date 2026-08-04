# AI Writing Session Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a persistent, staged AI writing workflow that guides the author through clarification, outline approval, draft approval, and human-confirmed editing assistance.

**Architecture:** Add a dedicated `WritingSession` aggregate with server-validated stage transitions and bounded context. Phase 1 uses one persistent session for clarification, outline, and draft generation; Phase 2 keeps Article form data as the single source of truth while WritingSession stores suggestions, previews, and audit state. Existing `/agent/generate-stream` and `/agent/revise-stream` remain temporarily available until both article pages migrate.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 sync Session, Pydantic v2, PostgreSQL/SQLite tests, Alembic, Next.js 16 App Router, React/TypeScript, Jest/React Testing Library, SSE fetch streams.

---

## File Structure

### Backend: create

- `backend/app/models/writing_session.py` — WritingSession persistence model and stage/status constants.
- `backend/app/schemas/writing_session.py` — request/response schemas, message/suggestion/revision payloads.
- `backend/app/crud/writing_session.py` — ownership-scoped sync CRUD and stage updates.
- `backend/app/services/writing_session_service.py` — stage machine, bounded context, LLM orchestration, SSE formatting.
- `backend/app/api/v1/endpoints/writing_sessions.py` — authenticated WritingSession routes.
- `backend/alembic/versions/015_add_writing_sessions.py` — table, indexes, foreign keys.
- `backend/app/tests/test_writing_sessions.py` — model/CRUD/API/stage/SSE regression tests.

### Backend: modify

- `backend/app/models/__init__.py` — register WritingSession for metadata/test table creation.
- `backend/app/models/user.py` — optional `writing_sessions` relationship only if the surrounding model convention needs it.
- `backend/app/api/v1/router.py` — register `/agent/writing-sessions` routes.
- `backend/app/services/agent_service.py` — expose narrowly reusable provider/text-stream helpers without moving stage logic back into AgentService.
- `backend/app/api/v1/endpoints/writing_sessions.py` — link a session to the first saved Article and mark it completed after publish; article endpoints remain unchanged.

### Frontend: create

- `frontend/src/types/writing-session.ts` — stage, session, message, suggestion, and revision types.
- `frontend/src/components/admin/writing/WritingSessionShell.tsx` — session create/resume/restart and stage routing.
- `frontend/src/components/admin/writing/WritingProgress.tsx` — four-step progress indicator.
- `frontend/src/components/admin/writing/ClarificationChat.tsx` — persistent clarification messages and single-question input.
- `frontend/src/components/admin/writing/OutlineReview.tsx` — outline document, adjustment conversation, confirm action.
- `frontend/src/components/admin/writing/DraftReview.tsx` — draft document, adjustment conversation, confirm action.
- `frontend/src/components/admin/writing/SelectionRevisionPreview.tsx` — before/after preview and apply/discard.
- `frontend/src/components/admin/writing/ArticleSuggestions.tsx` — analyze-full-text suggestions and revision previews.
- `frontend/src/components/admin/writing/ArticleAIAssist.tsx` — Phase 2 sidebar/drawer composition.
- `frontend/__tests__/WritingSessionShell.test.tsx` — stage/resume/confirm flow tests.
- `frontend/__tests__/SelectionRevisionPreview.test.tsx` — apply/discard/conflict tests.
- `frontend/__tests__/ArticleSuggestions.test.tsx` — analysis and suggestion application tests.

### Frontend: modify

- `frontend/src/lib/admin-api-client.ts` — typed WritingSession JSON/SSE methods and shared cancellable stream transport.
- `frontend/src/app/admin/articles/new/page.tsx` — replace local `phase` and temporary Phase 1 panel with WritingSessionShell; lazy-load metadata at editing stage.
- `frontend/src/app/admin/articles/[id]/page.tsx` — attach/recover editing-stage WritingSession and new assist panel.
- `frontend/src/components/admin/AIWritingPanel.tsx` — retain only during migration; remove Phase 1 ownership after Task 8.
- `frontend/src/components/admin/AIAssistSidebar.tsx` — replace destructive streaming edits after Task 9; delete when no longer referenced.

---

### Task 1: Persist WritingSession and migration

**Files:**
- Create: `backend/app/models/writing_session.py`
- Create: `backend/alembic/versions/015_add_writing_sessions.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/app/tests/test_writing_sessions.py`

- [ ] **Step 1: Write failing model persistence tests**

```python
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
```

- [ ] **Step 2: Run the test and verify the model is missing**

Run:

```bash
cd backend
pytest app/tests/test_writing_sessions.py::test_create_writing_session_defaults -v
```

Expected: collection/import failure because `app.models.writing_session` does not exist.

- [ ] **Step 3: Implement the model**

```python
# backend/app/models/writing_session.py
import uuid

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.types import UUIDType


class WritingSession(Base):
    __tablename__ = "writing_sessions"
    __table_args__ = (
        Index("ix_writing_sessions_user_status_updated", "user_id", "status", "updated_at"),
    )

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    article_id = Column(UUIDType, ForeignKey("articles.id", ondelete="SET NULL"), nullable=True, index=True)
    stage = Column(String(32), nullable=False, default="clarifying", index=True)
    status = Column(String(16), nullable=False, default="active", index=True)
    requirements_summary = Column(JSON, nullable=False, default=dict)
    outline = Column(Text, nullable=False, default="")
    draft = Column(Text, nullable=False, default="")
    messages = Column(JSON, nullable=False, default=list)
    suggestions = Column(JSON, nullable=False, default=list)
    revisions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    article = relationship("Article")
```

Register it:

```python
# backend/app/models/__init__.py
from app.models.writing_session import WritingSession
```

- [ ] **Step 4: Add migration 015**

```python
# backend/alembic/versions/015_add_writing_sessions.py
"""add writing sessions

Revision ID: 015
Revises: 014
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "writing_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("article_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("stage", sa.String(length=32), nullable=False, server_default="clarifying"),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="active"),
        sa.Column("requirements_summary", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("outline", sa.Text(), nullable=False, server_default=""),
        sa.Column("draft", sa.Text(), nullable=False, server_default=""),
        sa.Column("messages", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("suggestions", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("revisions", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["article_id"], ["articles.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_writing_sessions_user_id", "writing_sessions", ["user_id"])
    op.create_index("ix_writing_sessions_article_id", "writing_sessions", ["article_id"])
    op.create_index("ix_writing_sessions_stage", "writing_sessions", ["stage"])
    op.create_index("ix_writing_sessions_status", "writing_sessions", ["status"])
    op.create_index(
        "ix_writing_sessions_user_status_updated",
        "writing_sessions",
        ["user_id", "status", "updated_at"],
    )


def downgrade():
    op.drop_table("writing_sessions")
```

During implementation, inspect `backend/app/core/types.py`. If `UUIDType` stores SQLite UUIDs differently, keep the model portable and use PostgreSQL UUID only inside the production migration.

- [ ] **Step 5: Run model tests and metadata smoke test**

```bash
cd backend
pytest app/tests/test_writing_sessions.py::test_create_writing_session_defaults -v
pytest app/tests/test_agent_api.py -q
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/writing_session.py backend/app/models/__init__.py backend/alembic/versions/015_add_writing_sessions.py backend/app/tests/test_writing_sessions.py
git commit -m "feat(ai-writing): persist writing sessions"
```

---

### Task 2: Define WritingSession schemas and ownership-scoped CRUD

**Files:**
- Create: `backend/app/schemas/writing_session.py`
- Create: `backend/app/crud/writing_session.py`
- Modify: `backend/app/crud/__init__.py`
- Test: `backend/app/tests/test_writing_sessions.py`

- [ ] **Step 1: Add failing CRUD tests**

```python
from app.crud.writing_session import (
    abandon_writing_session,
    create_writing_session,
    get_active_writing_session,
    get_writing_session_for_user,
)


def test_writing_session_crud_is_user_scoped(test_session, test_user):
    session = create_writing_session(test_session, user_id=test_user.id)

    assert get_active_writing_session(test_session, user_id=test_user.id).id == session.id
    assert get_writing_session_for_user(test_session, session.id, test_user.id).id == session.id
    assert get_writing_session_for_user(test_session, session.id, uuid.uuid4()) is None

    abandon_writing_session(test_session, session)
    assert get_active_writing_session(test_session, user_id=test_user.id) is None
```

If `test_user` is not a public fixture, create the user inline using the exact pattern from `backend/app/tests/conftest.py`.

- [ ] **Step 2: Run the test and verify the CRUD module is missing**

```bash
cd backend
pytest app/tests/test_writing_sessions.py::test_writing_session_crud_is_user_scoped -v
```

Expected: import failure for `app.crud.writing_session`.

- [ ] **Step 3: Add Pydantic v2 schemas**

```python
# backend/app/schemas/writing_session.py
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer

WritingStage = Literal["clarifying", "outline_review", "drafting", "draft_review", "editing", "completed"]
WritingStatus = Literal["active", "completed", "abandoned"]


class WritingMessage(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime


class WritingSuggestion(BaseModel):
    id: str
    type: Literal["structure", "argument", "readability", "seo", "accuracy"]
    title: str
    reason: str
    scope: str
    status: Literal["pending", "previewed", "applied", "dismissed"] = "pending"


class WritingSessionCreate(BaseModel):
    article_id: Optional[UUID] = None


class WritingSessionRead(BaseModel):
    id: UUID
    user_id: UUID
    article_id: Optional[UUID]
    stage: WritingStage
    status: WritingStatus
    requirements_summary: dict[str, str]
    outline: str
    draft: str
    messages: list[WritingMessage]
    suggestions: list[WritingSuggestion]
    revisions: list[dict]
    created_at: datetime
    updated_at: datetime

    @field_serializer("id", "user_id", "article_id")
    def serialize_uuid(self, value: Optional[UUID]):
        return str(value) if value else None

    model_config = {"from_attributes": True}


class WritingMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class WritingOutlineAdjustRequest(WritingMessageRequest):
    pass


class WritingDraftAdjustRequest(WritingMessageRequest):
    pass


class WritingAnalyzeRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=30000)
    content_hash: str = Field(..., min_length=16, max_length=128)


class WritingSelectionRevisionRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=30000)
    selected_text: str = Field(..., min_length=1, max_length=10000)
    selection_start: int = Field(..., ge=0)
    selection_end: int = Field(..., ge=1)
    instruction: str = Field(..., min_length=1, max_length=1000)
    content_hash: str = Field(..., min_length=16, max_length=128)


class WritingSuggestionRevisionRequest(BaseModel):
    suggestion_id: str
    content: str = Field(..., min_length=1, max_length=30000)
    content_hash: str = Field(..., min_length=16, max_length=128)


class WritingRevisionApplyRequest(BaseModel):
    revision_id: str
    content_hash: str = Field(..., min_length=16, max_length=128)


class WritingArticleLinkRequest(BaseModel):
    article_id: UUID
```

- [ ] **Step 4: Implement CRUD**

```python
# backend/app/crud/writing_session.py
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
```

Export only the functions used through `app.crud` if existing endpoint style requires it; otherwise import the focused module directly.

- [ ] **Step 5: Run CRUD tests**

```bash
cd backend
pytest app/tests/test_writing_sessions.py -q
```

Expected: model and CRUD tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/writing_session.py backend/app/crud/writing_session.py backend/app/crud/__init__.py backend/app/tests/test_writing_sessions.py
git commit -m "feat(ai-writing): add writing session contracts"
```

---

### Task 3: Implement the stage machine and bounded context

**Files:**
- Create: `backend/app/services/writing_session_service.py`
- Modify: `backend/app/services/agent_service.py`
- Test: `backend/app/tests/test_writing_sessions.py`

- [ ] **Step 1: Add failing transition tests**

```python
import pytest

from app.exceptions import ConflictException
from app.services.writing_session_service import WritingSessionService


def test_outline_and_draft_stage_transitions(test_session, writing_session):
    service = WritingSessionService()

    service.store_outline(test_session, writing_session, "# 大纲\n1. 开始")
    assert writing_session.stage == "outline_review"

    service.begin_drafting(test_session, writing_session)
    assert writing_session.stage == "drafting"

    service.store_draft(test_session, writing_session, "# 初稿\n正文")
    assert writing_session.stage == "draft_review"

    service.confirm_draft(test_session, writing_session)
    assert writing_session.stage == "editing"


def test_illegal_stage_transition_is_rejected(test_session, writing_session):
    service = WritingSessionService()
    with pytest.raises(ConflictException):
        service.confirm_draft(test_session, writing_session)
```

- [ ] **Step 2: Run and verify failure**

```bash
cd backend
pytest app/tests/test_writing_sessions.py -k "stage_transition" -v
```

Expected: import failure for `WritingSessionService`.

- [ ] **Step 3: Implement explicit transitions**

```python
# backend/app/services/writing_session_service.py
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import AsyncIterator

from sqlalchemy.orm import Session

from app.crud.writing_session import save_writing_session
from app.exceptions import ConflictException
from app.models.writing_session import WritingSession
from app.services.agent_service import AgentService


TRANSITIONS = {
    "store_outline": {"clarifying", "outline_review"},
    "begin_drafting": {"outline_review"},
    "store_draft": {"drafting", "draft_review"},
    "confirm_draft": {"draft_review"},
}


class WritingSessionService:
    def __init__(self):
        self.agent = AgentService()

    @staticmethod
    def _require_stage(session: WritingSession, action: str) -> None:
        if session.stage not in TRANSITIONS[action]:
            raise ConflictException(
                resource="WritingSession",
                field="stage",
                value=f"{session.stage}:{action}",
            )

    def store_outline(self, db: Session, session: WritingSession, outline: str) -> WritingSession:
        self._require_stage(session, "store_outline")
        if not outline.strip():
            raise ValueError("大纲不能为空")
        session.outline = outline.strip()
        session.stage = "outline_review"
        return save_writing_session(db, session)

    def begin_drafting(self, db: Session, session: WritingSession) -> WritingSession:
        self._require_stage(session, "begin_drafting")
        if not session.outline.strip():
            raise ValueError("确认大纲前必须先生成大纲")
        session.stage = "drafting"
        return save_writing_session(db, session)

    def store_draft(self, db: Session, session: WritingSession, draft: str) -> WritingSession:
        self._require_stage(session, "store_draft")
        if not draft.strip():
            raise ValueError("初稿不能为空")
        session.draft = draft.strip()
        session.stage = "draft_review"
        return save_writing_session(db, session)

    def confirm_draft(self, db: Session, session: WritingSession) -> WritingSession:
        self._require_stage(session, "confirm_draft")
        if not session.draft.strip():
            raise ValueError("确认初稿前必须先生成初稿")
        session.stage = "editing"
        return save_writing_session(db, session)
```

- [ ] **Step 4: Add bounded message helpers**

Append to the service:

```python
    @staticmethod
    def append_message(session: WritingSession, role: str, content: str) -> None:
        messages = list(session.messages or [])
        messages.append({
            "id": str(uuid.uuid4()),
            "role": role,
            "content": content,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        session.messages = messages[-20:]

    @staticmethod
    def context_messages(session: WritingSession) -> list[dict[str, str]]:
        summary = json.dumps(session.requirements_summary or {}, ensure_ascii=False)
        result = [{"role": "system", "content": f"已确认需求：{summary}"}]
        result.extend({"role": m["role"], "content": m["content"]} for m in (session.messages or [])[-10:])
        if session.outline:
            result.append({"role": "system", "content": f"当前大纲：\n{session.outline}"})
        return result

    @staticmethod
    def content_hash(content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()
```

Do not invent automatic summarization in this task. Update `requirements_summary` through structured clarification output in Task 5.

- [ ] **Step 5: Expose only reusable AgentService helpers**

Rename or wrap private helpers in `agent_service.py` so WritingSessionService can use them without calling underscore-prefixed methods across service boundaries:

```python
async def ask_text(self, provider: LLMProvider, prompt: str, temperature: float = 0.7) -> str:
    return await self._ask(provider, prompt, temperature)

async def stream_text(self, provider, prompt, model=None, temperature=0.7, max_tokens=None):
    async for event in self._stream_final(provider, prompt, model, temperature, max_tokens):
        yield event


def get_provider(self, provider_name: Optional[str] = None) -> LLMProvider:
    return self._get_provider_or_raise(provider_name)
```

Keep existing callers working.

- [ ] **Step 6: Run service tests**

```bash
cd backend
pytest app/tests/test_writing_sessions.py -q
pytest app/tests/test_agent_service.py app/tests/test_agent_api.py -q
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/writing_session_service.py backend/app/services/agent_service.py backend/app/tests/test_writing_sessions.py
git commit -m "feat(ai-writing): enforce writing stages"
```

---

### Task 4: Add lifecycle and recovery endpoints

**Files:**
- Create: `backend/app/api/v1/endpoints/writing_sessions.py`
- Modify: `backend/app/api/v1/router.py`
- Test: `backend/app/tests/test_writing_sessions.py`

- [ ] **Step 1: Add failing endpoint tests**

```python
def test_create_and_recover_active_writing_session(client):
    created = client.post("/api/v1/agent/writing-sessions", json={})
    assert created.status_code == 201
    session = created.json()
    assert session["stage"] == "clarifying"

    active = client.get("/api/v1/agent/writing-sessions/active")
    assert active.status_code == 200
    assert active.json()["id"] == session["id"]


def test_abandon_session_removes_it_from_active(client):
    session_id = client.post("/api/v1/agent/writing-sessions", json={}).json()["id"]
    response = client.post(f"/api/v1/agent/writing-sessions/{session_id}/abandon")
    assert response.status_code == 200
    assert response.json()["status"] == "abandoned"
    assert client.get("/api/v1/agent/writing-sessions/active").status_code == 404
```

- [ ] **Step 2: Run and verify 404 routes**

```bash
cd backend
pytest app/tests/test_writing_sessions.py -k "active_writing_session or abandon_session" -v
```

Expected: 404 because router is not registered.

- [ ] **Step 3: Implement endpoints**

```python
# backend/app/api/v1/endpoints/writing_sessions.py
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
```

Register:

```python
# backend/app/api/v1/router.py
from app.api.v1.endpoints import writing_sessions

api_router.include_router(
    writing_sessions.router,
    prefix="/agent/writing-sessions",
    tags=["agent-writing"],
)
```

Use `asyncio.to_thread` for database work if these endpoints become async. The shown version stays synchronous because it performs only narrow CRUD and matches SQLAlchemy sync Session semantics.

- [ ] **Step 4: Add cross-user isolation test**

```python
def test_session_cannot_be_read_by_another_user(client, test_session, monkeypatch):
    from app.core.dependencies import get_current_active_user
    from app.main import app
    from app.models.user import User

    session_id = client.post("/api/v1/agent/writing-sessions", json={}).json()["id"]
    other = User(
        username="other-writer",
        email="other-writer@example.com",
        hashed_password="x",
        tenant_id=uuid.uuid4(),
    )
    test_session.add(other)
    test_session.commit()

    app.dependency_overrides[get_current_active_user] = lambda: other
    try:
        assert client.get(f"/api/v1/agent/writing-sessions/{session_id}").status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_active_user, None)
```

Adjust the import of `app` to the actual object used by `conftest.py`.

- [ ] **Step 5: Run endpoint tests**

```bash
cd backend
pytest app/tests/test_writing_sessions.py -q
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/endpoints/writing_sessions.py backend/app/api/v1/router.py backend/app/tests/test_writing_sessions.py
git commit -m "feat(ai-writing): expose writing sessions"
```

---

### Task 5: Implement clarification and outline workflow

**Files:**
- Modify: `backend/app/schemas/writing_session.py`
- Modify: `backend/app/services/writing_session_service.py`
- Modify: `backend/app/api/v1/endpoints/writing_sessions.py`
- Test: `backend/app/tests/test_writing_sessions.py`

- [ ] **Step 1: Add failing clarification stream tests**

```python
def test_clarification_message_persists_user_and_assistant_messages(client, monkeypatch):
    from app.services import writing_session_service as module
    from app.tests.test_agent_loop import FakeProvider, _text_resp

    provider = FakeProvider([_text_resp('{"reply":"目标读者是谁？","requirements":{},"ready_for_outline":false}')])
    monkeypatch.setattr(module, "get_llm_provider", lambda name=None: provider)

    session_id = client.post("/api/v1/agent/writing-sessions", json={}).json()["id"]
    response = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/message/stream",
        json={"message": "我想写 AI 辅助博客"},
    )
    assert response.status_code == 200
    assert "目标读者是谁" in response.text

    restored = client.get(f"/api/v1/agent/writing-sessions/{session_id}").json()
    assert [m["role"] for m in restored["messages"][-2:]] == ["user", "assistant"]
```

- [ ] **Step 2: Run and verify endpoint failure**

```bash
cd backend
pytest app/tests/test_writing_sessions.py::test_clarification_message_persists_user_and_assistant_messages -v
```

Expected: 404 for `/message/stream`.

- [ ] **Step 3: Add clarification prompt and structured parsing**

```python
CLARIFICATION_PROMPT = """你是中文博客写作教练。根据已确认需求和最近对话，每次只问一个最关键的澄清问题。
必须逐步确认：目标读者、文章目标、语气风格、篇幅/深度、必须包含的内容。
只输出 JSON：
{{"reply":"下一句回复或问题","requirements":{{"audience":"","goal":"","tone":"","length":"","must_include":""}},"ready_for_outline":false}}
当五项已足够明确时，reply 总结需求，ready_for_outline=true。不要生成大纲或正文。

上下文：
{context}
用户消息：{message}
"""
```

Implement in the service:

```python
async def clarification_reply(self, db, session, message, provider_name=None):
    if session.stage != "clarifying":
        raise ConflictException(resource="WritingSession", field="stage", value=session.stage)
    self.append_message(session, "user", message)
    provider = self.agent.get_provider(provider_name)
    prompt = CLARIFICATION_PROMPT.format(
        context=json.dumps(self.context_messages(session), ensure_ascii=False),
        message=message,
    )
    raw = await self.agent.ask_text(provider, prompt, temperature=0.3)
    data = json.loads(extract_first_json_object(raw))
    reply = str(data["reply"]).strip()
    if not reply:
        raise ValueError("澄清回复为空")
    session.requirements_summary = {
        k: str(v).strip() for k, v in data.get("requirements", {}).items() if str(v).strip()
    }
    self.append_message(session, "assistant", reply)
    save_writing_session(db, session)
    return reply, bool(data.get("ready_for_outline"))
```

Create `backend/app/utils/json_utils.py` with the balanced-brace `extract_first_json_object(raw: str) -> str` helper currently embedded in AgentService, add focused tests in `backend/app/tests/test_json_utils.py`, and update AgentService plus WritingSessionService to import this shared function. This is the only JSON extraction path.

- [ ] **Step 4: Add stream endpoint**

The service has already produced a short structured reply, so stream it in deterministic chunks and include a meta event:

```python
@router.post("/{session_id}/message/stream")
async def message_stream(...):
    session = require_owned_session(...)

    async def generate():
        try:
            reply, ready = await writing_session_service.clarification_reply(
                db, session, payload.message
            )
            yield writing_session_service.event({"content": reply})
            yield writing_session_service.event({"meta": {"ready_for_outline": ready}})
        except ValueError as exc:
            yield writing_session_service.error_event(str(exc))
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream", headers=SSE_HEADERS)
```

If real token-by-token clarification is desired later, change the provider prompt to a two-pass stream. Do not add that complexity now because clarification replies are short and require JSON validation before persistence.

- [ ] **Step 5: Add outline generation and adjustment**

```python
OUTLINE_PROMPT = """根据已确认需求生成一份中文博客 Markdown 大纲。
只输出大纲，不要正文和解释。大纲必须包含建议标题、目标读者、核心结论、H2/H3 结构和每节一句写作目的。
需求：{requirements}
最近对话：{messages}
"""

OUTLINE_ADJUST_PROMPT = """根据反馈修改 Markdown 大纲，只输出完整新大纲。
需求：{requirements}
当前大纲：{outline}
反馈：{message}
"""
```

Add endpoints:

```python
@router.post("/{session_id}/generate-outline", response_model=WritingSessionRead)
async def generate_outline(...):
    outline = await writing_session_service.generate_outline(session)
    return writing_session_service.store_outline(db, session, outline)

@router.post("/{session_id}/outline/adjust", response_model=WritingSessionRead)
async def adjust_outline(...):
    outline = await writing_session_service.adjust_outline(session, payload.message)
    return writing_session_service.store_outline(db, session, outline)
```

Wrap sync persistence with `asyncio.to_thread` only if the endpoint remains async and persistence becomes more than one narrow commit.

- [ ] **Step 6: Test clarification and outline**

```bash
cd backend
pytest app/tests/test_writing_sessions.py -k "clarification or outline" -v
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add backend/app/utils/json_utils.py backend/app/schemas/writing_session.py backend/app/services/writing_session_service.py backend/app/api/v1/endpoints/writing_sessions.py backend/app/tests/test_writing_sessions.py
git commit -m "feat(ai-writing): clarify requirements and review outlines"
```

---

### Task 6: Generate, adjust, and confirm drafts

**Files:**
- Modify: `backend/app/services/writing_session_service.py`
- Modify: `backend/app/api/v1/endpoints/writing_sessions.py`
- Test: `backend/app/tests/test_writing_sessions.py`

- [ ] **Step 1: Add failing draft-flow tests**

```python
def test_confirm_outline_streams_draft_and_advances_stage(client, monkeypatch):
    session_id = create_outline_review_session(client, monkeypatch)
    provider = StreamFakeProvider(["# 初稿\n", "正文"])
    patch_writing_provider(monkeypatch, provider)

    response = client.post(f"/api/v1/agent/writing-sessions/{session_id}/confirm-outline")
    assert response.status_code == 200
    assert "# 初稿" in response.text

    restored = client.get(f"/api/v1/agent/writing-sessions/{session_id}").json()
    assert restored["stage"] == "draft_review"
    assert restored["draft"] == "# 初稿\n正文"


def test_interrupted_draft_does_not_advance_stage(test_session, writing_session):
    service = WritingSessionService()
    writing_session.stage = "outline_review"
    writing_session.outline = "# 大纲"
    service.begin_drafting(test_session, writing_session)
    assert writing_session.stage == "drafting"
    assert writing_session.draft == ""
```

Implement `StreamFakeProvider` in this test file using the exact `LLMProvider.stream_chat` contract from `backend/app/tests/test_agent_loop.py`.

- [ ] **Step 2: Run and verify failure**

```bash
cd backend
pytest app/tests/test_writing_sessions.py -k "confirm_outline or interrupted_draft" -v
```

Expected: confirm endpoint 404/failure.

- [ ] **Step 3: Implement draft prompts and stream aggregation**

```python
DRAFT_PROMPT = """根据已确认需求和大纲撰写完整中文博客 Markdown 初稿。
直接输出正文，以 # 标题开头；包含具体例子，避免空话；不要输出解释或 Markdown 围栏。
需求：{requirements}
大纲：{outline}
"""

DRAFT_ADJUST_PROMPT = """根据用户反馈修改完整初稿，只输出修改后的完整 Markdown。
需求：{requirements}
大纲：{outline}
当前初稿：{draft}
反馈：{message}
"""
```

Service generator:

```python
async def generate_draft_stream(self, db, session) -> AsyncIterator[str]:
    self.begin_drafting(db, session)
    provider = self.agent.get_provider()
    prompt = DRAFT_PROMPT.format(
        requirements=json.dumps(session.requirements_summary, ensure_ascii=False),
        outline=session.outline,
    )
    chunks = []
    completed = False
    try:
        async for event, content in self._provider_content_events(provider, prompt):
            chunks.append(content)
            yield event
        completed = True
    finally:
        if completed:
            self.store_draft(db, session, "".join(chunks))
```

Implement `_provider_content_events` inside WritingSessionService so it yields both formatted SSE text and raw content without reparsing its own SSE output.

- [ ] **Step 4: Implement draft adjustment and confirmation**

```python
async def adjust_draft_stream(self, db, session, message):
    if session.stage != "draft_review":
        raise ConflictException(...)
    # stream complete replacement; persist only on completed stream


def confirm_draft_payload(self, db, session) -> dict:
    updated = self.confirm_draft(db, session)
    return {"session": WritingSessionRead.model_validate(updated), "draft": updated.draft}
```

Add endpoints:

- `POST /{id}/confirm-outline` → SSE draft.
- `POST /{id}/draft/adjust` → SSE replacement draft.
- `POST /{id}/confirm-draft` → JSON draft and `stage=editing`.

- [ ] **Step 5: Run draft tests**

```bash
cd backend
pytest app/tests/test_writing_sessions.py -k "draft" -v
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/writing_session_service.py backend/app/api/v1/endpoints/writing_sessions.py backend/app/tests/test_writing_sessions.py
git commit -m "feat(ai-writing): generate and confirm article drafts"
```

---

### Task 7: Add Phase 2 analysis and non-destructive revisions

**Files:**
- Modify: `backend/app/schemas/writing_session.py`
- Modify: `backend/app/services/writing_session_service.py`
- Modify: `backend/app/api/v1/endpoints/writing_sessions.py`
- Test: `backend/app/tests/test_writing_sessions.py`

- [ ] **Step 1: Add failing analysis/revision tests**

```python
def test_analyze_returns_structured_suggestions(client, editing_session, monkeypatch):
    patch_text_response(monkeypatch, json.dumps({
        "suggestions": [{
            "type": "structure",
            "title": "补充开场问题",
            "reason": "当前开头缺少读者场景",
            "scope": "第一段",
        }]
    }, ensure_ascii=False))

    content = "# 标题\n正文"
    response = client.post(
        f"/api/v1/agent/writing-sessions/{editing_session.id}/analyze",
        json={"content": content, "content_hash": sha256(content)},
    )
    assert response.status_code == 200
    assert response.json()["suggestions"][0]["status"] == "pending"


def test_selection_revision_is_preview_only(client, editing_session, monkeypatch):
    patch_stream_response(monkeypatch, ["修改后的", "段落"])
    content = "第一段。第二段。"
    response = client.post(
        f"/api/v1/agent/writing-sessions/{editing_session.id}/revise-selection/stream",
        json={
            "content": content,
            "selected_text": "第二段。",
            "selection_start": 4,
            "selection_end": 8,
            "instruction": "更具体",
            "content_hash": sha256(content),
        },
    )
    assert "修改后的段落" in response.text
    restored = client.get(f"/api/v1/agent/writing-sessions/{editing_session.id}").json()
    assert restored["draft"] != "第一段。修改后的段落"
```

- [ ] **Step 2: Run and verify missing routes**

```bash
cd backend
pytest app/tests/test_writing_sessions.py -k "analyze or selection_revision" -v
```

Expected: fail/404.

- [ ] **Step 3: Implement structured analysis**

```python
ANALYZE_PROMPT = """分析下面的中文博客，给出 3-5 条高价值修改建议。
只输出 JSON：{{"suggestions":[{{"type":"structure|argument|readability|seo|accuracy","title":"","reason":"","scope":""}}]}}
每条建议必须可执行且指明影响范围。
正文：{content}
"""
```

Parse with the shared balanced JSON utility. Add UUIDs and `status="pending"`, persist to `session.suggestions`, and return `WritingSessionRead` or a focused suggestions response.

- [ ] **Step 4: Implement revision preview records**

Extend `suggestions` entries or add `revisions` JSON to the model before migration if possible. Prefer adding `revisions` to Task 1 now rather than a second migration. Each revision record:

```python
{
  "id": str(uuid.uuid4()),
  "source": "selection" | "suggestion",
  "suggestion_id": None | "...",
  "content_hash": "...",
  "selection_start": 0,
  "selection_end": 10,
  "original_text": "...",
  "replacement_text": "...",
  "status": "previewed" | "applied" | "discarded",
}
```

Add `revisions` to the model/schema/migration in Task 1. This avoids encoding revision records into suggestions.

Revision prompt must say:

```python
SELECTION_REVISION_PROMPT = """只改写指定段落。直接输出替换文本，不要标题、解释或 Markdown 围栏。
全文上下文：{context}
原段落：{selected_text}
修改要求：{instruction}
"""
```

Persist the revision only after stream completion. Do not modify `session.draft` or Article.

- [ ] **Step 5: Implement apply/discard conflict checks**

```python
def apply_revision(self, db, session, revision_id, content_hash):
    revision = find_revision(session, revision_id)
    if revision["content_hash"] != content_hash:
        raise ConflictException(resource="WritingRevision", field="content_hash", value=content_hash)
    revision["status"] = "applied"
    mark_suggestion_if_present(session, revision)
    return save_writing_session(db, session)
```

Also add `discard-revision` or allow `apply-revision` payload with `status`. Keep the API explicit: `POST /apply-revision` and `POST /discard-revision`.

- [ ] **Step 6: Run Phase 2 tests**

```bash
cd backend
pytest app/tests/test_writing_sessions.py -k "analyze or revision or conflict" -v
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/writing_session.py backend/alembic/versions/015_add_writing_sessions.py backend/app/schemas/writing_session.py backend/app/services/writing_session_service.py backend/app/api/v1/endpoints/writing_sessions.py backend/app/tests/test_writing_sessions.py
git commit -m "feat(ai-writing): add revision previews and suggestions"
```

---

### Task 8: Add typed frontend WritingSession client

**Files:**
- Create: `frontend/src/types/writing-session.ts`
- Modify: `frontend/src/lib/admin-api-client.ts`
- Create: `frontend/__tests__/writing-session-api.test.ts`

- [ ] **Step 1: Add failing API client tests**

```typescript
// frontend/__tests__/writing-session-api.test.ts
import { adminApi } from '@/lib/admin-api-client';

const fetchMock = jest.fn();
global.fetch = fetchMock;

beforeEach(() => {
  fetchMock.mockReset();
  localStorage.setItem('auth_token', 'token');
});

test('creates and recovers a writing session', async () => {
  fetchMock
    .mockResolvedValueOnce(new Response(JSON.stringify({ id: 's1', stage: 'clarifying' }), { status: 201 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ id: 's1', stage: 'clarifying' }), { status: 200 }));

  expect((await adminApi.writingSessions.create()).stage).toBe('clarifying');
  expect((await adminApi.writingSessions.active()).id).toBe('s1');
});
```

Provide a minimal complete fixture satisfying the TypeScript `WritingSession` type; do not cast incomplete objects to `any`.

- [ ] **Step 2: Run and verify namespace is missing**

```bash
cd frontend
npm test -- --runInBand __tests__/writing-session-api.test.ts
```

Expected: TypeScript/Jest failure because `adminApi.writingSessions` does not exist.

- [ ] **Step 3: Define frontend types**

```typescript
// frontend/src/types/writing-session.ts
export type WritingStage =
  | 'clarifying'
  | 'outline_review'
  | 'drafting'
  | 'draft_review'
  | 'editing'
  | 'completed';

export interface WritingMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface WritingSuggestion {
  id: string;
  type: 'structure' | 'argument' | 'readability' | 'seo' | 'accuracy';
  title: string;
  reason: string;
  scope: string;
  status: 'pending' | 'previewed' | 'applied' | 'dismissed';
}

export interface WritingRevision {
  id: string;
  source: 'selection' | 'suggestion';
  suggestion_id: string | null;
  content_hash: string;
  selection_start: number;
  selection_end: number;
  original_text: string;
  replacement_text: string;
  status: 'previewed' | 'applied' | 'discarded';
}

export interface WritingSession {
  id: string;
  user_id: string;
  article_id: string | null;
  stage: WritingStage;
  status: 'active' | 'completed' | 'abandoned';
  requirements_summary: Record<string, string>;
  outline: string;
  draft: string;
  messages: WritingMessage[];
  suggestions: WritingSuggestion[];
  revisions: WritingRevision[];
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 4: Extract shared cancellable SSE transport**

Inside `admin-api-client.ts`, replace duplicated stream fetch blocks with:

```typescript
interface SseHandlers {
  onContent?: (delta: string) => void;
  onMeta?: (meta: Record<string, unknown>) => void;
  onComplete?: (full: string) => void;
  onError?: (message: string) => void;
}

function postSse(endpoint: string, body: unknown, handlers: SseHandlers): () => void {
  const controller = new AbortController();
  void consumePostSse(endpoint, body, controller.signal, handlers);
  return () => controller.abort();
}
```

Extend the existing SSE parser to handle `meta` and preserve current agent methods. Ensure an error event does not also call `onComplete`.

- [ ] **Step 5: Add WritingSession client methods**

```typescript
writingSessions: {
  create: (articleId?: string) =>
    AdminApiClient.post<WritingSession>('/agent/writing-sessions/', { article_id: articleId }),
  active: () => AdminApiClient.get<WritingSession>('/agent/writing-sessions/active'),
  get: (id: string) => AdminApiClient.get<WritingSession>(`/agent/writing-sessions/${id}`),
  abandon: (id: string) => AdminApiClient.post<WritingSession>(`/agent/writing-sessions/${id}/abandon`, {}),
  messageStream: (id: string, message: string, handlers: SseHandlers) =>
    postSse(`/agent/writing-sessions/${id}/message/stream`, { message }, handlers),
  generateOutline: (id: string) =>
    AdminApiClient.post<WritingSession>(`/agent/writing-sessions/${id}/generate-outline`, {}),
  adjustOutline: (id: string, message: string) =>
    AdminApiClient.post<WritingSession>(`/agent/writing-sessions/${id}/outline/adjust`, { message }),
  confirmOutline: (id: string, handlers: SseHandlers) =>
    postSse(`/agent/writing-sessions/${id}/confirm-outline`, {}, handlers),
  adjustDraft: (id: string, message: string, handlers: SseHandlers) =>
    postSse(`/agent/writing-sessions/${id}/draft/adjust`, { message }, handlers),
  confirmDraft: (id: string) =>
    AdminApiClient.post<{ session: WritingSession; draft: string }>(`/agent/writing-sessions/${id}/confirm-draft`, {}),
  analyze: (id: string, content: string, contentHash: string) =>
    AdminApiClient.post<WritingSession>(`/agent/writing-sessions/${id}/analyze`, { content, content_hash: contentHash }),
  reviseSelection: (id: string, body: WritingSelectionRevisionRequest, handlers: SseHandlers) =>
    postSse(`/agent/writing-sessions/${id}/revise-selection/stream`, body, handlers),
  reviseSuggestion: (id: string, body: WritingSuggestionRevisionRequest, handlers: SseHandlers) =>
    postSse(`/agent/writing-sessions/${id}/revise-suggestion/stream`, body, handlers),
  applyRevision: (id: string, revisionId: string, contentHash: string) =>
    AdminApiClient.post<WritingSession>(`/agent/writing-sessions/${id}/apply-revision`, { revision_id: revisionId, content_hash: contentHash }),
  linkArticle: (id: string, articleId: string) =>
    AdminApiClient.post<WritingSession>(`/agent/writing-sessions/${id}/link-article`, { article_id: articleId }),
  complete: (id: string) =>
    AdminApiClient.post<WritingSession>(`/agent/writing-sessions/${id}/complete`, {}),
}
```

Export request interfaces from `types/writing-session.ts`.

- [ ] **Step 6: Run API tests and type check**

```bash
cd frontend
npm test -- --runInBand __tests__/writing-session-api.test.ts
npm run type-check
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/types/writing-session.ts frontend/src/lib/admin-api-client.ts frontend/__tests__/writing-session-api.test.ts
git commit -m "feat(ai-writing): add writing session client"
```

---

### Task 9: Build Phase 1 WritingSession components

**Files:**
- Create: `frontend/src/components/admin/writing/WritingProgress.tsx`
- Create: `frontend/src/components/admin/writing/ClarificationChat.tsx`
- Create: `frontend/src/components/admin/writing/OutlineReview.tsx`
- Create: `frontend/src/components/admin/writing/DraftReview.tsx`
- Create: `frontend/src/components/admin/writing/WritingSessionShell.tsx`
- Test: `frontend/__tests__/WritingSessionShell.test.tsx`

- [ ] **Step 1: Add failing Phase 1 component tests**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WritingSessionShell from '@/components/admin/writing/WritingSessionShell';
import { adminApi } from '@/lib/admin-api-client';

jest.mock('@/lib/admin-api-client', () => ({
  adminApi: {
    writingSessions: {
      active: jest.fn(),
      create: jest.fn(),
      messageStream: jest.fn(),
      generateOutline: jest.fn(),
      confirmOutline: jest.fn(),
      confirmDraft: jest.fn(),
      abandon: jest.fn(),
    },
  },
}));

test('shows resume choice instead of silently restoring an active session', async () => {
  (adminApi.writingSessions.active as jest.Mock).mockResolvedValue(sessionFixture({ stage: 'outline_review' }));
  render(<WritingSessionShell onDraftConfirmed={jest.fn()} />);

  expect(await screen.findByRole('button', { name: '继续上次写作' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '开始新文章' })).toBeInTheDocument();
});

test('renders outline review and confirms draft', async () => {
  // mock create -> clarifying, generateOutline -> outline_review,
  // confirmOutline stream -> draft, confirmDraft -> editing
});
```

Create `sessionFixture(overrides)` returning a complete strongly typed WritingSession.

- [ ] **Step 2: Run and verify component module is missing**

```bash
cd frontend
npm test -- --runInBand __tests__/WritingSessionShell.test.tsx
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement four-step progress**

```tsx
const steps = [
  { key: 'clarifying', label: '澄清需求' },
  { key: 'outline_review', label: '确认大纲' },
  { key: 'draft_review', label: '确认初稿' },
  { key: 'editing', label: '编辑发布' },
] as const;
```

Map `drafting` to the third visual step. Use `aria-current="step"` and stable fixed-width tracks. Do not use viewport-scaled font sizes.

- [ ] **Step 4: Implement ClarificationChat**

Props:

```typescript
interface ClarificationChatProps {
  session: WritingSession;
  sending: boolean;
  readyForOutline: boolean;
  onSend(message: string): void;
  onGenerateOutline(): void;
  onCancel(): void;
}
```

Render persisted `session.messages`, one input, stop action, and `生成大纲` only when `readyForOutline` is true.

- [ ] **Step 5: Implement OutlineReview and DraftReview**

Each component owns only presentation and local feedback input. It receives the persisted document and callbacks. OutlineReview buttons:

- `继续调整`
- `确认大纲并生成初稿`

DraftReview buttons:

- `继续调整`
- `确认初稿，进入编辑器`

Disable confirm actions while streaming or when the document is empty.

- [ ] **Step 6: Implement WritingSessionShell state orchestration**

State:

```typescript
const [view, setView] = useState<'loading' | 'resume-choice' | 'session'>('loading');
const [session, setSession] = useState<WritingSession | null>(null);
const [streaming, setStreaming] = useState(false);
const [readyForOutline, setReadyForOutline] = useState(false);
const cancelRef = useRef<(() => void) | null>(null);
```

Behavior:

1. Call `active()` on mount.
2. 404 means create a new session; other errors show retry.
3. Existing session means show resume choice.
4. `开始新文章` abandons old session, then creates a new one.
5. All stage renders use the same `session.id` and persisted messages.
6. `confirmDraft()` calls `onDraftConfirmed(draft, session)`.

- [ ] **Step 7: Run Phase 1 tests**

```bash
cd frontend
npm test -- --runInBand __tests__/WritingSessionShell.test.tsx
npm run type-check
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/admin/writing frontend/__tests__/WritingSessionShell.test.tsx
git commit -m "feat(ai-writing): build staged writing workspace"
```

---

### Task 10: Build Phase 2 preview-first AI assistance

**Files:**
- Create: `frontend/src/components/admin/writing/SelectionRevisionPreview.tsx`
- Create: `frontend/src/components/admin/writing/ArticleSuggestions.tsx`
- Create: `frontend/src/components/admin/writing/ArticleAIAssist.tsx`
- Test: `frontend/__tests__/SelectionRevisionPreview.test.tsx`
- Test: `frontend/__tests__/ArticleSuggestions.test.tsx`

- [ ] **Step 1: Add failing selection preview tests**

```tsx
test('does not mutate the article until apply is clicked', async () => {
  const user = userEvent.setup();
  const apply = jest.fn();
  render(
    <SelectionRevisionPreview
      originalText="旧段落"
      replacementText="新段落"
      onApply={apply}
      onDiscard={jest.fn()}
      conflict={false}
    />
  );

  expect(apply).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '应用替换' }));
  expect(apply).toHaveBeenCalledTimes(1);
});

test('blocks apply when content hash changed', () => {
  render(...conflict={true} />);
  expect(screen.getByRole('button', { name: '重新选择段落' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '应用替换' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run and verify missing component**

```bash
cd frontend
npm test -- --runInBand __tests__/SelectionRevisionPreview.test.tsx
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement SHA-256 helper**

Use Web Crypto; create `frontend/src/lib/content-hash.ts`:

```typescript
export async function contentHash(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
```

Add Jest fallback using Node `webcrypto` in the test file if jsdom lacks `crypto.subtle`.

- [ ] **Step 4: Implement SelectionRevisionPreview**

Show:

- original text with destructive/removed styling;
- replacement text with success/added styling;
- apply/discard buttons;
- conflict warning when current content hash differs from revision hash.

Do not calculate text diff word-by-word in this release. A stable before/after comparison satisfies the confirmed UX without adding a diff library.

- [ ] **Step 5: Implement ArticleSuggestions**

Props:

```typescript
interface ArticleSuggestionsProps {
  session: WritingSession;
  content: string;
  onSessionChange(session: WritingSession): void;
  onApplyRevision(revision: WritingRevision): void;
}
```

Behavior:

1. `分析全文` computes hash and calls `analyze`.
2. Render 3–5 suggestions with type, title, reason, scope, status.
3. Clicking one calls `reviseSuggestion` and shows a preview.
4. Apply only after hash recheck.
5. Applied/dismissed suggestions cannot trigger duplicate work.

- [ ] **Step 6: Implement ArticleAIAssist**

Compose:

- selected text card;
- revision instruction input;
- SelectionRevisionPreview;
- ArticleSuggestions;
- existing quick actions entry points.

Accept selection as a prop from the page/editor adapter instead of polling `textarea` every 500 ms:

```typescript
export interface EditorSelection {
  text: string;
  start: number;
  end: number;
}
```

The page updates it through textarea `onSelect`.

- [ ] **Step 7: Run Phase 2 component tests**

```bash
cd frontend
npm test -- --runInBand __tests__/SelectionRevisionPreview.test.tsx __tests__/ArticleSuggestions.test.tsx
npm run type-check
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/content-hash.ts frontend/src/components/admin/writing/SelectionRevisionPreview.tsx frontend/src/components/admin/writing/ArticleSuggestions.tsx frontend/src/components/admin/writing/ArticleAIAssist.tsx frontend/__tests__/SelectionRevisionPreview.test.tsx frontend/__tests__/ArticleSuggestions.test.tsx
git commit -m "feat(ai-writing): preview AI revisions before applying"
```

---

### Task 11: Migrate new/edit article pages and link sessions to articles

**Files:**
- Modify: `frontend/src/app/admin/articles/new/page.tsx`
- Modify: `frontend/src/app/admin/articles/[id]/page.tsx`
- Modify: `backend/app/api/v1/endpoints/writing_sessions.py`
- Modify: `backend/app/services/writing_session_service.py`
- Test: `backend/app/tests/test_writing_sessions.py`
- Test: `frontend/__tests__/WritingSessionShell.test.tsx`

- [ ] **Step 1: Add backend link/complete tests**

```python
def test_link_article_and_complete_session(client, test_session):
    article = create_test_article(test_session)
    session_id = client.post("/api/v1/agent/writing-sessions", json={}).json()["id"]

    linked = client.post(
        f"/api/v1/agent/writing-sessions/{session_id}/link-article",
        json={"article_id": str(article.id)},
    )
    assert linked.status_code == 200
    assert linked.json()["article_id"] == str(article.id)

    completed = client.post(f"/api/v1/agent/writing-sessions/{session_id}/complete")
    assert completed.status_code == 200
    assert completed.json()["stage"] == "completed"
    assert completed.json()["status"] == "completed"
```

- [ ] **Step 2: Implement link and complete endpoints**

Verify the Article exists before linking. Only allow complete from `editing`; repeated complete returns the same completed session.

- [ ] **Step 3: Replace new-page local phase state**

In `new/page.tsx`:

1. Remove local `phase` state.
2. Do not call `loadCategoriesAndTags()` until WritingSessionShell calls `onDraftConfirmed`.
3. Render `WritingSessionShell` while no confirmed draft exists.
4. On confirm:

```typescript
const handleDraftConfirmed = (draft: string, session: WritingSession) => {
  setWritingSession(session);
  setFormData((prev) => ({ ...prev, content: draft }));
  setEditingStarted(true);
  void loadCategoriesAndTags();
};
```

5. Replace `AIWritingPanel` and `AIAssistSidebar` with `ArticleAIAssist`.
6. Track textarea selection with `onSelect`:

```typescript
const handleContentSelect = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
  const target = event.currentTarget;
  setEditorSelection({
    text: target.value.slice(target.selectionStart, target.selectionEnd),
    start: target.selectionStart,
    end: target.selectionEnd,
  });
};
```

7. Apply a local revision only when hash matches:

```typescript
setFormData((prev) => ({
  ...prev,
  content:
    prev.content.slice(0, revision.selection_start) +
    revision.replacement_text +
    prev.content.slice(revision.selection_end),
}));
```

- [ ] **Step 4: Link session after first draft save**

`adminApi.articles.create()` currently returns unknown. Refine the call type or locally validate the response has an `id`. After create succeeds:

```typescript
const article = await adminApi.articles.create(submitData) as { id: string };
if (writingSession && !writingSession.article_id) {
  const linked = await adminApi.writingSessions.linkArticle(writingSession.id, article.id);
  setWritingSession(linked);
}
```

Do not introduce `any`.

- [ ] **Step 5: Complete session after publish**

After article publish succeeds and before navigation:

```typescript
if (writingSession) {
  await adminApi.writingSessions.complete(writingSession.id);
}
```

If completion fails after Article publication, log/show a non-blocking warning; do not report publish failure or retry Article creation.

- [ ] **Step 6: Migrate edit page**

For `[id]/page.tsx`:

1. Load Article first.
2. Request active session.
3. Reuse only if `article_id === articleId` and stage is editing.
4. Otherwise create a session with `article_id=articleId`, then transition it to editing through a dedicated `attach-existing-article` endpoint or a create option validated by the service. Prefer a dedicated endpoint to avoid letting clients choose arbitrary stages.
5. Render `ArticleAIAssist`; no Phase 1.

- [ ] **Step 7: Remove obsolete components after zero references**

Run:

```bash
cd frontend
rg -n "AIWritingPanel|AIAssistSidebar" src
```

If only component definitions remain, delete:

- `frontend/src/components/admin/AIWritingPanel.tsx`
- `frontend/src/components/admin/AIAssistSidebar.tsx`

If another page still references them, keep them and create a follow-up cleanup task; do not delete live code.

- [ ] **Step 8: Run integration tests and builds**

```bash
cd backend
pytest app/tests/test_writing_sessions.py app/tests/test_agent_api.py app/tests/test_extended_articles.py -q

cd ../frontend
npm test -- --runInBand __tests__/WritingSessionShell.test.tsx __tests__/SelectionRevisionPreview.test.tsx __tests__/ArticleSuggestions.test.tsx
npm run type-check
npm run build
```

Expected: all pass; build exits 0.

- [ ] **Step 9: Commit**

```bash
git add backend/app/api/v1/endpoints/writing_sessions.py backend/app/services/writing_session_service.py backend/app/tests/test_writing_sessions.py frontend/src/app/admin/articles/new/page.tsx "frontend/src/app/admin/articles/[id]/page.tsx" frontend/src/components/admin
git commit -m "feat(ai-writing): integrate persistent writing workflow"
```

---

### Task 12: Full regression, migration verification, GUI evidence, and deployment

**Files:**
- Modify only if verification finds scoped defects.
- Evidence: `gui-test-screenshots/ai-writing-session/`

- [ ] **Step 1: Run full backend regression**

```bash
cd backend
pytest -q
```

Expected: current suite passes; PostgreSQL-only tests may remain explicitly skipped under SQLite for documented reasons.

- [ ] **Step 2: Verify migration upgrade and downgrade against disposable PostgreSQL**

Use the existing Docker PostgreSQL service or a disposable local database, never production first:

```bash
cd backend
alembic upgrade 015
alembic downgrade 014
alembic upgrade 015
```

Expected: all commands exit 0 and `writing_sessions` exists after final upgrade.

If `alembic` CLI is unavailable locally, run inside the backend container:

```bash
docker compose -f ../docker-compose.prod.yml --env-file ../.env.production exec -T backend alembic upgrade 015
```

Use a disposable environment for downgrade testing. Production only receives forward `upgrade head`.

- [ ] **Step 3: Run frontend regression**

```bash
cd frontend
npm test -- --runInBand
npm run lint
npm run type-check
npm run build
```

Expected: no errors; pre-existing warnings must be reported, not silently described as fixed.

- [ ] **Step 4: GUI test desktop flow**

Viewport: 1280×720.

Test and save screenshots:

1. `t1-resume-choice.png` — active-session resume choice.
2. `t2-clarifying.png` — only Phase 1 UI; no article metadata forms.
3. `t3-outline-review.png` — outline document and two actions.
4. `t4-draft-review.png` — draft document and confirm action.
5. `t5-editing.png` — editor + AI sidebar; content preserved.
6. `t6-selection-preview.png` — before/after selection preview before apply.
7. `t7-suggestions.png` — structured full-text suggestions.

For each state, use DOM snapshot plus viewed screenshot. Do not generate or publish a real article; use a disposable session and abandon it afterward.

- [ ] **Step 5: GUI test mobile layout**

Viewport: 390×844.

Verify:

- progress does not overflow;
- Phase 1 input and confirm actions remain visible;
- editor remains full width;
- AI assistance opens as bottom drawer, not a compressed right column;
- no overlapping controls or nested scroll trap.

Save `t8-mobile-phase1.png` and `t9-mobile-assist-drawer.png`.

- [ ] **Step 6: Production deployment**

```bash
git push origin main
ssh root@49.234.190.85 "cd /opt/my-awesome-blog && bash scripts/server-redeploy.sh all"
```

Expected:

- backend becomes healthy;
- frontend starts;
- Alembic upgrade reaches `015`;
- `/health` returns 200;
- `/` returns 200.

- [ ] **Step 7: Production smoke test**

Use a logged-in admin browser session:

- create a disposable WritingSession;
- send one clarification answer;
- confirm resume works after reload;
- abandon the session;
- verify no Article row was created.

Check logs:

```bash
ssh root@49.234.190.85 "docker logs my-awesome-blog-backend-1 --tail 100 2>&1"
ssh root@49.234.190.85 "docker logs my-awesome-blog-frontend-1 --tail 50 2>&1"
```

Expected: no uncaught exception/traceback related to writing sessions.

- [ ] **Step 8: Rollback procedure**

If application code fails before sessions are used:

1. deploy the previous frontend/backend commit;
2. leave migration 015 in place because the new table is additive and unused;
3. do not downgrade production while any WritingSession rows exist.

If schema rollback is mandatory and the table is confirmed disposable:

```bash
ssh root@49.234.190.85 "cd /opt/my-awesome-blog && docker compose -f docker-compose.prod.yml --env-file .env.production exec -T backend alembic downgrade 014"
```

- [ ] **Step 9: Final commit for verification-only fixes**

Only when verification produced scoped fixes:

```bash
git add <exact-fixed-files>
git commit -m "fix(ai-writing): address workflow verification findings"
git push origin main
```

If no fixes were needed, do not create an empty commit.
