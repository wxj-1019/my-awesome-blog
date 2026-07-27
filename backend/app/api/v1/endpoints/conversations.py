"""
Conversations API Endpoints
对话管理相关的 API 接口
"""

from typing import Optional
from fastapi import APIRouter, Depends, status, Query, Request
from fastapi.responses import StreamingResponse
from app.exceptions import (
    NotFoundException,
    ValidationException,
    ResourceNotFoundException,
)
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    Conversation,
    ConversationListResponse,
    ConversationSummary,
    ChatRequest,
    ChatResponse,
    ChatStreamChunk,
)
from app.schemas.pagination import Page
from app.models.user import User
from app.services.conversation_service import conversation_service
from app.utils.logger import app_logger
from app.utils.rate_limit import conversation_create_rate_limit, llm_chat_rate_limit
import json


router = APIRouter()


@router.post("/", response_model=Conversation, status_code=status.HTTP_201_CREATED)
@conversation_create_rate_limit
async def create_conversation(
    request: Request,
    *,
    db: Session = Depends(get_db),
    conversation_in: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
) -> Conversation:
    """
    创建新对话
    
    - **title**: 对话标题
    - **status**: 状态（默认为 active）
    - **model**: 使用的模型
    - **prompt_id**: 使用的 Prompt ID（可选）
    """
    conversation = await conversation_service.create_conversation(
        db=db,
        conversation_in=conversation_in,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
    )
    
    app_logger.info(f"User {current_user.username} created conversation: {conversation.id}")
    return conversation


@router.get("/{conversation_id}", response_model=Conversation, status_code=status.HTTP_200_OK)
async def get_conversation(
    *,
    db: Session = Depends(get_db),
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Conversation:
    """
    获取指定对话
    
    - **conversation_id**: 对话 ID
    """
    conversation = await conversation_service.get_conversation(
        db=db,
        conversation_id=conversation_id,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
    )
    
    if not conversation:
        raise NotFoundException(
            resource="Conversation",
            identifier=conversation_id
        )
    
    return conversation


@router.get("/", response_model=Page[ConversationSummary], status_code=status.HTTP_200_OK)
async def list_conversations(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None),
) -> Page[ConversationSummary]:
    """
    获取对话列表

    返回分页信封 {items, total, skip, limit}；items 为**不含 messages** 的摘要，
    消息请走 GET /conversations/{id}/messages。

    - **skip**: 跳过数量（分页）
    - **limit**: 限制数量（分页）
    - **status**: 状态筛选（可选）
    """
    return await conversation_service.list_conversations(
        db=db,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
        skip=skip,
        limit=limit,
        status=status,
    )


@router.put("/{conversation_id}", response_model=Conversation, status_code=status.HTTP_200_OK)
async def update_conversation(
    *,
    db: Session = Depends(get_db),
    conversation_id: str,
    conversation_in: ConversationUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Conversation:
    """
    更新对话
    
    - **conversation_id**: 对话 ID
    - **title**: 新标题（可选）
    - **status**: 新状态（可选）
    - **model**: 新模型（可选）
    - **prompt_id**: 新 Prompt ID（可选）
    """
    conversation = await conversation_service.update_conversation(
        db=db,
        conversation_id=conversation_id,
        conversation_in=conversation_in,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
    )
    
    if not conversation:
        raise NotFoundException(
            resource="Conversation",
            identifier=conversation_id
        )
    
    app_logger.info(f"User {current_user.username} updated conversation: {conversation_id}")
    return conversation


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    *,
    db: Session = Depends(get_db),
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    删除对话
    
    - **conversation_id**: 对话 ID
    """
    conversation = await conversation_service.delete_conversation(
        db=db,
        conversation_id=conversation_id,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
    )
    
    if not conversation:
        raise NotFoundException(
            resource="Conversation",
            identifier=conversation_id
        )
    
    app_logger.info(f"User {current_user.username} deleted conversation: {conversation_id}")


@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
@llm_chat_rate_limit
async def chat(
    request: Request,
    *,
    db: Session = Depends(get_db),
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
) -> ChatResponse:
    """
    发送聊天消息（非流式）
    
    - **conversation_id**: 对话 ID（不指定则创建新对话）
    - **message**: 用户消息
    - **model**: 使用的模型（默认为 deepseek-v4-flash）
    - **temperature**: 温度参数（0.0-2.0）
    - **max_tokens**: 最大 Token 数（可选）
    - **stream**: 是否流式响应（此处固定为 False）
    - **prompt_id**: 使用的 Prompt ID（可选）
    """
    return await conversation_service.chat(
        db=db,
        chat_request=chat_request,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
    )


@router.post("/chat/stream")
@llm_chat_rate_limit
async def chat_stream(
    request: Request,
    *,
    db: Session = Depends(get_db),
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    发送聊天消息（流式）
    
    - **conversation_id**: 对话 ID（不指定则创建新对话）
    - **message**: 用户消息
    - **model**: 使用的模型（默认为 deepseek-v4-flash）
    - **temperature**: 温度参数（0.0-2.0）
    - **max_tokens**: 最大 Token 数（可选）
    - **stream**: 是否流式响应（此处固定为 True）
    - **prompt_id**: 使用的 Prompt ID（可选）
    """
    chat_request.stream = True
    
    async def generate():
        async for chunk in conversation_service.chat_stream(
            db=db,
            chat_request=chat_request,
            tenant_id=str(current_user.tenant_id),
            user_id=str(current_user.id),
        ):
            yield f"data: {chunk.json()}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )


@router.get("/{conversation_id}/messages", status_code=status.HTTP_200_OK)
async def get_conversation_messages(
    *,
    db: Session = Depends(get_db),
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """
    获取对话消息列表
    
    - **conversation_id**: 对话 ID
    - **skip**: 跳过数量（分页）
    - **limit**: 限制数量（分页）
    """
    from app.crud.conversation import get_conversation_messages
    
    messages = get_conversation_messages(
        db, conversation_id, skip, limit
    )
    
    return {
        "conversation_id": conversation_id,
        "messages": messages,
        "total": len(messages),
    }


@router.delete("/{conversation_id}/messages", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation_messages(
    *,
    db: Session = Depends(get_db),
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    删除对话的所有消息
    
    - **conversation_id**: 对话 ID
    """
    from app.crud.conversation import delete_conversation_messages, get_conversation
    
    conversation = get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    
    if str(conversation.user_id) != str(current_user.id) and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete messages from this conversation",
        )
    
    delete_conversation_messages(db, conversation_id)
    
    app_logger.info(f"User {current_user.username} deleted messages from conversation: {conversation_id}")
