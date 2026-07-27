from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.crud.writing_session import (
    abandon_writing_session,
    create_writing_session,
    get_active_writing_session,
    get_writing_session_for_user,
)
from app.exceptions import ConflictException, NotFoundException
from app.models.user import User
from app.schemas.writing_session import (
    WritingMessageRequest,
    WritingSessionCreate,
    WritingSessionRead,
)
from app.services.writing_session_service import WritingSessionService

router = APIRouter()

writing_session_service = WritingSessionService()

# SSE 响应头：禁用缓冲/代理缓冲，确保事件实时推送
SSE_HEADERS = {"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}


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


@router.post("/{session_id}/message/stream")
async def message_stream(
    session_id: UUID,
    payload: WritingMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """澄清阶段单轮对话（SSE）：用户消息 → LLM 一句澄清问题/回复。

    事件序列：content（回复）→ meta.ready_for_outline（是否可生成大纲）→ [DONE]。
    非法阶段抛 ConflictException（409）；reply 为空等服务层 ValueError 发 error 事件。
    """
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    # 在构造 StreamingResponse 之前同步校验阶段：clarification_reply 内部也有同样的检查
    # （防御性冗余），但放在这里确保 ConflictException 在响应开始前抛出，
    # 由全局异常处理器映射为 409（而非被 Starlette 先发送 200 + 头部后静默截断）。
    if session.stage != "clarifying":
        raise ConflictException(
            message=f"当前阶段'{session.stage}'不允许发送澄清消息，仅 clarifying 阶段可用"
        )

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


@router.post("/{session_id}/generate-outline", response_model=WritingSessionRead)
async def generate_outline(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """根据已确认需求生成 Markdown 大纲，推进到 outline_review 阶段。"""
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    return await writing_session_service.generate_outline(db, session)


@router.post("/{session_id}/outline/adjust", response_model=WritingSessionRead)
async def adjust_outline(
    session_id: UUID,
    payload: WritingMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """根据反馈调整大纲（仅在 outline_review 阶段）。"""
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    return await writing_session_service.adjust_outline(db, session, payload.message)


@router.post("/{session_id}/confirm-outline")
async def confirm_outline(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """确认大纲，流式生成初稿（SSE）。

    阶段校验在构造 StreamingResponse 之前同步完成：非法阶段抛
    ConflictException（→ 409），而非开始流式后才发错误事件。
    事件序列：content（初稿增量）→ [DONE]；流式过程异常时发 error 事件
    且阶段停留在 drafting，draft 为空。
    """
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    if session.stage != "outline_review":
        raise ConflictException(
            message=f"当前阶段'{session.stage}'不允许确认大纲，仅 outline_review 阶段可用"
        )
    return StreamingResponse(
        writing_session_service.generate_draft_stream(db, session),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.post("/{session_id}/draft/adjust")
async def adjust_draft(
    session_id: UUID,
    payload: WritingMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """流式调整初稿（仅在 draft_review 阶段，SSE）。"""
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    if session.stage != "draft_review":
        raise ConflictException(
            message=f"当前阶段'{session.stage}'不允许调整初稿，仅 draft_review 阶段可用"
        )
    return StreamingResponse(
        writing_session_service.adjust_draft_stream(db, session, payload.message),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.post("/{session_id}/confirm-draft", response_model=WritingSessionRead)
async def confirm_draft(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """确认初稿，进入编辑器阶段（editing）。

    返回 WritingSessionRead：stage=editing 且 draft 已填充，
    前端可直接把 draft 灌入编辑器。
    """
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    return writing_session_service.confirm_draft_payload(db, session)
