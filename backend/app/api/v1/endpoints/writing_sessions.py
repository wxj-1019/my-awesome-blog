from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.crud.article import get_article
from app.crud.writing_session import (
    abandon_writing_session,
    create_writing_session,
    get_active_writing_session,
    get_writing_session_for_user,
    save_writing_session,
)
from app.exceptions import ConflictException, NotFoundException
from app.models.user import User
from app.schemas.writing_session import (
    WritingAnalyzeRequest,
    WritingArticleLinkRequest,
    WritingMessageRequest,
    WritingRevisionApplyRequest,
    WritingRevisionDiscardRequest,
    WritingSelectionRevisionRequest,
    WritingSessionCreate,
    WritingSessionRead,
    WritingSuggestionRevisionRequest,
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
    article = None
    if payload.article_id:
        # 校验文章存在且归属当前用户（此前任意 article_id 都能关联：
        # 不存在 → FK 500，他人文章 → 跨用户污染会话）
        article = get_article(db, payload.article_id)
        if not article:
            raise NotFoundException(resource="Article", identifier=str(payload.article_id))
        if article.author_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="没有权限关联该文章",
            )
    session = create_writing_session(db, current_user.id, payload.article_id)
    if article is not None:
        # 基于已有文章继续写作（编辑页场景）：直接进入 editing 阶段，
        # 正文作为 draft，Phase 2（选段修改/全文建议）立即可用
        session.stage = "editing"
        session.draft = article.content or ""
        session = save_writing_session(db, session)
    return session


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


# ── Phase 2：全文分析、修订预览、应用/放弃 ──────────────────────────

@router.post("/{session_id}/analyze", response_model=WritingSessionRead)
async def analyze(
    session_id: UUID,
    payload: WritingAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """分析全文，生成结构化修改建议（仅在 editing 阶段）。

    非流式：调用 LLM 返回 JSON 建议列表，覆盖写入 session.suggestions。
    """
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    return await writing_session_service.analyze_content(
        db, session, payload.content, payload.content_hash
    )


@router.post("/{session_id}/revise-selection/stream")
async def revise_selection(
    session_id: UUID,
    payload: WritingSelectionRevisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """流式生成选段修改预览（仅在 editing 阶段，SSE）。

    非破坏性：只生成替换文本并落库一条 previewed 修订，不修改 draft/Article。
    阶段校验在构造 StreamingResponse 之前完成，非法阶段直接 409。
    事件序列：content（替换文本增量）→ meta.revision_id → [DONE]。
    """
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    if session.stage != "editing":
        raise ConflictException(
            message=f"当前阶段'{session.stage}'不允许修改选段，仅 editing 阶段可用"
        )
    return StreamingResponse(
        writing_session_service.revise_selection_stream(db, session, payload),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.post("/{session_id}/revise-suggestion/stream")
async def revise_suggestion(
    session_id: UUID,
    payload: WritingSuggestionRevisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """根据建议流式生成修改预览（仅在 editing 阶段，SSE）。

    阶段校验在构造 StreamingResponse 之前完成；建议不存在时 NotFoundException（404）
    也在此处抛出，避免响应已开始流式后再报错。事件序列同 revise-selection。
    """
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    if session.stage != "editing":
        raise ConflictException(
            message=f"当前阶段'{session.stage}'不允许修改，仅 editing 阶段可用"
        )
    # 建议存在性预检：在 StreamingResponse 之前抛 404
    if not any(s.get("id") == payload.suggestion_id for s in (session.suggestions or [])):
        raise NotFoundException(resource="WritingSuggestion", identifier=payload.suggestion_id)
    return StreamingResponse(
        writing_session_service.revise_suggestion_stream(
            db, session, payload.suggestion_id, payload.content, payload.content_hash
        ),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.post("/{session_id}/apply-revision", response_model=WritingSessionRead)
def apply_revision(
    session_id: UUID,
    payload: WritingRevisionApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """应用修订（content_hash 必须匹配，否则 409）。

    标记修订为 applied，并联动把关联建议标为 applied。
    """
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    return writing_session_service.apply_revision(
        db, session, payload.revision_id, payload.content_hash
    )


@router.post("/{session_id}/discard-revision", response_model=WritingSessionRead)
def discard_revision(
    session_id: UUID,
    payload: WritingRevisionDiscardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """放弃修订（仅改状态为 discarded）。"""
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    return writing_session_service.discard_revision(db, session, payload.revision_id)


@router.post("/{session_id}/link-article", response_model=WritingSessionRead)
def link_article(
    session_id: UUID,
    payload: WritingArticleLinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """把会话关联到一篇文章（供 Task 11 在文章落库完成后回写）。

    仅校验文章存在；不限定阶段，因为可能在 editing 之前就预关联，
    或在 complete 之后回填。article_id 缺省 SET NULL，无孤儿引用风险。
    """
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    article = get_article(db, payload.article_id)
    if not article:
        raise NotFoundException(resource="Article", identifier=str(payload.article_id))
    # 只允许关联本人文章（超级管理员除外），避免跨用户污染会话
    if article.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有权限关联该文章",
        )
    session.article_id = payload.article_id
    return save_writing_session(db, session)


@router.post("/{session_id}/complete", response_model=WritingSessionRead)
def complete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """结束会话：stage/status 都置为 completed（仅在 editing 阶段）。

    这是写作流程的终态：一旦完成，会话不再出现在 active 列表中，
    前端转去文章编辑页/发布页。draft 与 revisions 保留供审计。
    """
    session = get_writing_session_for_user(db, session_id, current_user.id)
    if not session:
        raise NotFoundException(resource="WritingSession", identifier=str(session_id))
    if session.stage != "editing":
        raise ConflictException(
            message=f"当前阶段'{session.stage}'不允许完成会话，仅 editing 阶段可用"
        )
    session.stage = "completed"
    session.status = "completed"
    return save_writing_session(db, session)
