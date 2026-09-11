"""
Conversation Engine
对话引擎，负责多轮对话编排
"""

from typing import List, Optional, Dict, Any, AsyncIterator
from sqlalchemy.orm import Session
from app.schemas.conversation import (
    ConversationCreate,
    ChatRequest,
    ChatResponse,
    ChatStreamChunk,
    Conversation,
)
from app.crud import conversation as conversation_crud
from app.core.langchain import get_langchain_model
from app.services.context_service import context_service
from app.services.memory_service import memory_service
from app.utils.logger import app_logger


class ConversationEngine:
    """
    对话引擎
    
    负责多轮对话的编排，包括上下文管理、记忆检索、LLM 调用等
    """
    
    def __init__(self):
        pass
    
    async def create_conversation(
        self,
        db: Session,
        conversation_in: ConversationCreate,
        tenant_id: str,
        user_id: str,
    ) -> Conversation:
        """
        创建新对话
        
        Args:
            db: 数据库会话
            conversation_in: 创建请求
            tenant_id: 租户 ID
            user_id: 用户 ID
        
        Returns:
            Conversation: 创建的对话对象
        """
        return conversation_crud.create_conversation(
            db, conversation_in, tenant_id, user_id
        )
    
    async def get_conversation(
        self,
        db: Session,
        conversation_id: str,
        tenant_id: str,
        user_id: str,
    ) -> Optional[Conversation]:
        """
        获取对话
        
        Args:
            db: 数据库会话
            conversation_id: 对话 ID
            tenant_id: 租户 ID
            user_id: 用户 ID
        
        Returns:
            Conversation: 对话对象或 None
        """
        conversation = conversation_crud.get_conversation(db, conversation_id)
        
        if conversation and (
            str(conversation.tenant_id) == tenant_id and
            str(conversation.user_id) == user_id
        ):
            return conversation
        
        return None
    
    async def list_conversations(
        self,
        db: Session,
        tenant_id: str,
        user_id: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
    ) -> List[Conversation]:
        """
        获取对话列表
        
        Args:
            db: 数据库会话
            tenant_id: 租户 ID
            user_id: 用户 ID
            skip: 跳过数量
            limit: 限制数量
            status: 状态筛选
        
        Returns:
            List[Conversation]: 对话列表
        """
        return conversation_crud.get_conversations(
            db, tenant_id, user_id, skip, limit, status
        )
    
    async def chat(
        self,
        db: Session,
        chat_request: ChatRequest,
        tenant_id: str,
        user_id: str,
    ) -> ChatResponse:
        """
        处理聊天请求（非流式）
        
        Args:
            db: 数据库会话
            chat_request: 聊天请求
            tenant_id: 租户 ID
            user_id: 用户 ID
        
        Returns:
            ChatResponse: 聊天响应
        """
        conversation_id = chat_request.conversation_id
        
        if not conversation_id:
            conversation = await self.create_conversation(
                db,
                ConversationCreate(
                    title=chat_request.message[:50],
                    model=chat_request.model,
                    prompt_id=chat_request.prompt_id,
                ),
                tenant_id,
                user_id,
            )
            conversation_id = str(conversation.id)
        else:
            conversation = await self.get_conversation(
                db, conversation_id, tenant_id, user_id
            )
            if not conversation:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found"
                )
        
        from app.schemas.conversation import ConversationMessageCreate
        
        user_message = conversation_crud.create_conversation_message(
            db,
            ConversationMessageCreate(
                role="user",
                content=chat_request.message,
            ),
            conversation_id,
            chat_request.model,
        )
        
        context_window = await context_service.get_context_window(db, conversation_id)
        relevant_memories = await memory_service.search_memories(
            db=db,
            tenant_id=tenant_id,
            user_id=user_id,
            search_request={
                "query": chat_request.message,
                "top_k": 5,
            },
        )
        
        messages = self._build_messages(
            context_window.messages,
            chat_request.message,
            relevant_memories,
        )
        
        llm_response = await self._call_llm(
            messages,
            chat_request.model,
            chat_request.temperature,
            chat_request.max_tokens,
        )
        
        assistant_message = conversation_crud.create_conversation_message(
            db,
            ConversationMessageCreate(
                role="assistant",
                content=llm_response,
            ),
            conversation_id,
            chat_request.model,
        )
        
        conversation_crud.update_conversation_stats(
            db,
            conversation_id,
            increment_messages=2,
            increment_tokens=assistant_message.tokens,
        )
        
        return ChatResponse(
            conversation_id=conversation_id,
            message_id=str(assistant_message.id),
            role="assistant",
            content=llm_response,
            tokens=assistant_message.tokens,
            model=chat_request.model,
            created_at=assistant_message.created_at,
        )
    
    async def chat_stream(
        self,
        db: Session,
        chat_request: ChatRequest,
        tenant_id: str,
        user_id: str,
    ) -> AsyncIterator[ChatStreamChunk]:
        """
        处理聊天请求（流式）
        
        Args:
            db: 数据库会话
            chat_request: 聊天请求
            tenant_id: 租户 ID
            user_id: 用户 ID
        
        Yields:
            ChatStreamChunk: 流式响应块
        """
        chat_request.stream = True
        
        conversation_id = chat_request.conversation_id
        
        if not conversation_id:
            conversation = await self.create_conversation(
                db,
                ConversationCreate(
                    title=chat_request.message[:50],
                    model=chat_request.model,
                    prompt_id=chat_request.prompt_id,
                ),
                tenant_id,
                user_id,
            )
            conversation_id = str(conversation.id)
        else:
            conversation = await self.get_conversation(
                db, conversation_id, tenant_id, user_id
            )
            if not conversation:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found"
                )
        
        from app.schemas.conversation import ConversationMessageCreate
        
        user_message = conversation_crud.create_conversation_message(
            db,
            ConversationMessageCreate(
                role="user",
                content=chat_request.message,
            ),
            conversation_id,
            chat_request.model,
        )
        
        context_window = await context_service.get_context_window(db, conversation_id)
        
        messages = self._build_messages(
            context_window.messages,
            chat_request.message,
        )
        
        accumulated_content = ""
        
        async for chunk in self._call_llm_stream(
            messages,
            chat_request.model,
            chat_request.temperature,
            chat_request.max_tokens,
        ):
            if chunk:
                accumulated_content += chunk
                yield ChatStreamChunk(
                    conversation_id=conversation_id,
                    message_id="",
                    role="assistant",
                    content=accumulated_content,
                    delta=chunk,
                    finish_reason=None,
                )
        
        yield ChatStreamChunk(
            conversation_id=conversation_id,
            message_id="",
            role="assistant",
            content=accumulated_content,
            delta="",
            finish_reason="stop",
        )
        
        assistant_message = conversation_crud.create_conversation_message(
            db,
            ConversationMessageCreate(
                role="assistant",
                content=accumulated_content,
            ),
            conversation_id,
            chat_request.model,
        )
        
        conversation_crud.update_conversation_stats(
            db,
            conversation_id,
            increment_messages=2,
            increment_tokens=len(accumulated_content),
        )
    
    def _build_messages(
        self,
        context_messages: List[Dict[str, Any]],
        user_message: str,
        memories: Optional[List[Any]] = None,
    ) -> List[Dict[str, str]]:
        """
        构建发送给 LLM 的消息列表
        
        Args:
            context_messages: 上下文消息
            user_message: 用户消息
            memories: 相关记忆
        
        Returns:
            List[Dict[str, str]]: 消息列表
        """
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
        
        messages = []
        
        if memories:
            memory_text = "\n".join([m["content"] for m in memories[:5]])
            messages.append({
                "role": "system",
                "content": f"Relevant context:\n{memory_text}",
            })
        
        for msg in context_messages:
            messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })
        
        messages.append({
            "role": "user",
            "content": user_message,
        })
        
        return messages
    
    async def _call_llm(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        调用 LLM
        
        Args:
            messages: 消息列表
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大 Token 数
        
        Returns:
            str: LLM 响应
        """
        try:
            llm = get_langchain_model(model)
            
            from langchain_core.messages import (
                SystemMessage,
                HumanMessage,
                AIMessage,
            )
            
            langchain_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    langchain_messages.append(SystemMessage(content=msg["content"]))
                elif msg["role"] == "user":
                    langchain_messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    langchain_messages.append(AIMessage(content=msg["content"]))
            
            response = await llm.ainvoke(
                langchain_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            return response.content
        except Exception as e:
            app_logger.error(f"Error calling LLM: {e}")
            return "I'm sorry, I encountered an error while processing your request."
    
    async def _call_llm_stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncIterator[str]:
        """
        流式调用 LLM
        
        Args:
            messages: 消息列表
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大 Token 数
        
        Yields:
            str: LLM 响应增量
        """
        try:
            llm = get_langchain_model(model)
            
            from langchain_core.messages import (
                SystemMessage,
                HumanMessage,
                AIMessage,
            )
            
            langchain_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    langchain_messages.append(SystemMessage(content=msg["content"]))
                elif msg["role"] == "user":
                    langchain_messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    langchain_messages.append(AIMessage(content=msg["content"]))
            
            async for chunk in llm._astream(
                langchain_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            ):
                for gen in chunk.generations:
                    if gen.message and gen.message.content:
                        yield gen.message.content
                        
        except Exception as e:
            app_logger.error(f"Error calling LLM stream: {e}")
            yield "I'm sorry, I encountered an error while processing your request."
    
    async def delete_conversation(
        self,
        db: Session,
        conversation_id: str,
        tenant_id: str,
        user_id: str,
    ) -> Optional[Conversation]:
        """
        删除对话
        
        Args:
            db: 数据库会话
            conversation_id: 对话 ID
            tenant_id: 租户 ID
            user_id: 用户 ID
        
        Returns:
            Conversation: 被删除的对话对象或 None
        """
        conversation = await self.get_conversation(
            db, conversation_id, tenant_id, user_id
        )
        
        if conversation:
            conversation_crud.delete_conversation(db, conversation_id)
            await context_service.clear_context(db, conversation_id)
            await memory_service.clear_short_term(conversation_id)
        
        return conversation


conversation_engine = ConversationEngine()
