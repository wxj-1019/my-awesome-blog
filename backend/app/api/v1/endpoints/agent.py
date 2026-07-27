"""Agent 相关 API：写作辅助对话 + 文章润色 + AI 导向写作（生成/改稿/元信息）。

个人站定位：chat 主用途是写文章（查站内文、大纲、改写）；polish 为管理员润色草稿；
generate-stream / revise-stream / meta 面向后台编辑器的 AI 写作流程。
tenant_id 不参与内容主链隔离（见 AGENTS.md / backend-rules）。
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app.models.user import User
from app.schemas.agent import (
    AgentChatRequest,
    AgentChatResponse,
    AgentCoverRequest,
    AgentCoverResponse,
    AgentGenerateRequest,
    AgentMetaRequest,
    AgentMetaResponse,
    AgentPolishRequest,
    AgentPolishResponse,
    AgentReviseRequest,
)
from app.services.agent_service import agent_service
from app.utils.logger import app_logger
from app.utils.rate_limit import llm_chat_rate_limit

router = APIRouter()


@router.post("/chat", response_model=AgentChatResponse)
@llm_chat_rate_limit
async def agent_chat(
    request: Request,
    chat_request: AgentChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """写作辅助对话：工具循环查站内文后协助选题/大纲/改写。"""
    app_logger.info(
        f"Agent writing chat by user={current_user.username} id={current_user.id}"
    )
    try:
        return await agent_service.chat(db, chat_request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/polish", response_model=AgentPolishResponse)
@llm_chat_rate_limit
async def agent_polish(
    request: Request,
    polish_request: AgentPolishRequest,
    current_user: User = Depends(get_current_superuser),
):
    """文章润色（Writer-Critic 循环），仅管理员。"""
    app_logger.info(f"Agent polish by superuser={current_user.username}")
    try:
        return await agent_service.polish(polish_request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── AI 导向写作 ────────────────────────────────────────────────────
# 生成 / 改稿走流式 SSE（打字机效果），元信息走一次性 JSON。
# 流式响应不能设 response_model，必须返回 StreamingResponse（同 /llm/chat/stream）。


@router.post("/generate-stream")
@llm_chat_rate_limit
async def agent_generate_stream(
    request: Request,
    generate_request: AgentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """按主题流式生成文章：先查站内文（tool 事件）→ 流式吐正文（content 事件）。"""
    app_logger.info(
        f"Agent generate-stream by user={current_user.username} topic={generate_request.topic!r}"
    )
    # 服务层已把 ValueError 转成 SSE error 事件，这里直接透传
    return StreamingResponse(
        agent_service.generate_stream(db, generate_request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            # 关闭 nginx/代理缓冲，确保打字机效果逐字到达浏览器
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/revise-stream")
@llm_chat_rate_limit
async def agent_revise_stream(
    request: Request,
    revise_request: AgentReviseRequest,
    current_user: User = Depends(get_current_active_user),
):
    """对话式改稿（流式）：当前正文 + 自然语言指令 → 流式输出修改后的完整正文。"""
    app_logger.info(
        f"Agent revise-stream by user={current_user.username} instruction={revise_request.instruction!r}"
    )
    return StreamingResponse(
        agent_service.revise_stream(revise_request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/meta", response_model=AgentMetaResponse)
@llm_chat_rate_limit
async def agent_meta(
    request: Request,
    meta_request: AgentMetaRequest,
    current_user: User = Depends(get_current_active_user),
):
    """根据正文反推标题 / slug / 摘要（非流式）。"""
    app_logger.info(f"Agent meta by user={current_user.username}")
    try:
        return await agent_service.generate_meta(meta_request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cover", response_model=AgentCoverResponse)
@llm_chat_rate_limit
async def agent_cover(
    request: Request,
    cover_request: AgentCoverRequest,
    current_user: User = Depends(get_current_active_user),
):
    """封面配图搜索：AI 生成英文搜索词 → 代理调 Unsplash → 返回候选图。"""
    app_logger.info(f"Agent cover by user={current_user.username} query={cover_request.query!r}")
    try:
        return await agent_service.suggest_cover(cover_request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
