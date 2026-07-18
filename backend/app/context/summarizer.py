"""
Context Summarizer
上下文摘要器，负责对话内容的自动摘要
"""

import asyncio
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.conversation import ConversationMessage
from app.models.context_history import ContextHistory
from app.utils.logger import app_logger


class ContextSummarizer:
    """
    上下文摘要器
    
    负责对话内容的自动摘要和关键点提取
    """
    
    def __init__(self):
        pass
    
    async def create_summary(
        self,
        db: Session,
        conversation_id: str,
        max_messages: Optional[int] = None,
    ) -> ContextHistory:
        """
        创建对话摘要
        
        Args:
            db: 数据库会话
            conversation_id: 对话 ID
            max_messages: 最大消息数
        
        Returns:
            ContextHistory: 创建的摘要记录
        """
        messages = (
            db.query(ConversationMessage)
            .filter(ConversationMessage.conversation_id == conversation_id)
            .order_by(ConversationMessage.created_at)
            .all()
        )
        
        if max_messages:
            messages = messages[-max_messages:]
        
        if not messages:
            app_logger.warning(f"No messages found for conversation {conversation_id}")
            return None
        
        messages_text = self._format_messages(messages)
        
        summary = await self._generate_summary(messages_text)
        key_points = await self._extract_key_points(messages_text)
        
        import uuid
        context_history = ContextHistory(
            id=uuid.uuid4(),
            conversation_id=conversation_id,
            message_count=len(messages),
            total_tokens=sum(msg.tokens for msg in messages),
            summary=summary,
            key_points="; ".join(key_points),
        )
        
        db.add(context_history)
        db.commit()
        db.refresh(context_history)
        
        app_logger.info(
            f"Created summary for conversation {conversation_id}: "
            f"{len(messages)} messages summarized"
        )
        
        return context_history
    
    def _format_messages(self, messages: List[ConversationMessage]) -> str:
        """
        格式化消息列表
        
        Args:
            messages: 消息列表
        
        Returns:
            str: 格式化后的文本
        """
        formatted = []
        for msg in messages:
            role = "User" if msg.role == "user" else "Assistant"
            formatted.append(f"{role}: {msg.content}")
        return "\n\n".join(formatted)
    
    async def _generate_summary(self, messages_text: str) -> str:
        """
        生成对话摘要
        
        Args:
            messages_text: 消息文本
        
        Returns:
            str: 摘要内容
        """
        try:
            from app.core.langchain import get_langchain_model
            
            model = get_langchain_model()
            if model is None:
                return self._fallback_summary(messages_text)
            
            from langchain_core.messages import SystemMessage, HumanMessage
            
            prompt = (
                "请总结以下对话内容，提取主要讨论的主题和关键信息。"
                "摘要应简洁明了，不超过200字。\n\n"
                f"对话内容：\n{messages_text}"
            )
            
            messages = [SystemMessage(content=prompt)]
            result = await model.ainvoke(messages)
            
            return result.content
        except Exception as e:
            app_logger.error(f"Error generating summary: {e}")
            return self._fallback_summary(messages_text)
    
    def _fallback_summary(self, messages_text: str) -> str:
        """
        备用摘要方法
        
        使用简单的规则生成摘要
        
        Args:
            messages_text: 消息文本
        
        Returns:
            str: 摘要内容
        """
        lines = messages_text.split('\n')
        if len(lines) > 5:
            return f"对话包含 {len(lines)} 条消息，讨论了多个话题。"
        elif len(lines) > 2:
            return f"对话包含 {len(lines)} 条消息。"
        else:
            return "简短的对话。"
    
    async def _extract_key_points(self, messages_text: str) -> List[str]:
        """
        提取关键点
        
        Args:
            messages_text: 消息文本
        
        Returns:
            List[str]: 关键点列表
        """
        try:
            from app.core.langchain import get_langchain_model
            
            model = get_langchain_model()
            if model is None:
                return self._fallback_key_points(messages_text)
            
            from langchain_core.messages import SystemMessage, HumanMessage
            
            prompt = (
                "请从以下对话中提取3-5个关键点，每个关键点不超过20字。"
                "用分号分隔返回。\n\n"
                f"对话内容：\n{messages_text}"
            )
            
            messages = [SystemMessage(content=prompt)]
            result = await model.ainvoke(messages)
            
            key_points_text = result.content
            key_points = [kp.strip() for kp in key_points_text.split(';') if kp.strip()]
            
            return key_points[:5]
        except Exception as e:
            app_logger.error(f"Error extracting key points: {e}")
            return self._fallback_key_points(messages_text)
    
    def _fallback_key_points(self, messages_text: str) -> List[str]:
        """
        备用关键点提取方法
        
        Args:
            messages_text: 消息文本
        
        Returns:
            List[str]: 关键点列表
        """
        sentences = messages_text.split('.')
        key_points = []
        
        for sentence in sentences[:3]:
            sentence = sentence.strip()
            if len(sentence) > 10 and len(sentence) < 50:
                key_points.append(sentence[:50])
        
        return key_points
    
    async def update_summary(
        self,
        db: Session,
        summary_id: str,
        messages: List[ConversationMessage],
    ) -> ContextHistory:
        """
        更新现有摘要
        
        Args:
            db: 数据库会话
            summary_id: 摘要 ID
            messages: 新增消息列表
        
        Returns:
            ContextHistory: 更新后的摘要
        """
        messages_text = self._format_messages(messages)
        new_summary = await self._generate_summary(messages_text)
        new_key_points = await self._extract_key_points(messages_text)
        
        def _update_db():
            summary = db.query(ContextHistory).filter(
                ContextHistory.id == summary_id
            ).with_for_update().first()
            
            if not summary:
                return None
            
            summary.message_count += len(messages)
            summary.total_tokens += sum(msg.tokens for msg in messages)
            summary.summary = f"{summary.summary}\n\n{new_summary}"
            if summary.key_points:
                summary.key_points = f"{summary.key_points}; {'; '.join(new_key_points)}"
            else:
                summary.key_points = "; ".join(new_key_points)
            
            db.add(summary)
            db.commit()
            db.refresh(summary)
            return summary
        
        summary = await asyncio.to_thread(_update_db)
        
        if summary:
            app_logger.info(f"Updated summary {summary_id}")
        
        return summary
    
    async def get_summary(
        self,
        db: Session,
        conversation_id: str,
    ) -> Optional[ContextHistory]:
        """
        获取最新的对话摘要
        
        Args:
            db: 数据库会话
            conversation_id: 对话 ID
        
        Returns:
            ContextHistory: 最新的摘要或 None
        """
        return (
            db.query(ContextHistory)
            .filter(ContextHistory.conversation_id == conversation_id)
            .order_by(ContextHistory.created_at.desc())
            .first()
        )
