"""Agent 相关 API：工具循环对话 + 文章润色"""

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
    """Agent 对话：模型可在循环中自主调用站内工具后作答。"""
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
    try:
        return await agent_service.polish(polish_request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
