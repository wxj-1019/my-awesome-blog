"""Agent 相关 API：写作辅助对话 + 文章润色。

个人站定位：chat 主用途是写文章（查站内文、大纲、改写）；polish 为管理员润色草稿。
tenant_id 不参与内容主链隔离（见 AGENTS.md / backend-rules）。
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app.models.user import User
from app.schemas.agent import (
    AgentChatRequest,
    AgentChatResponse,
    AgentPolishRequest,
    AgentPolishResponse,
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
