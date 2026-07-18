"""
Conversation CRUD Operations
对话数据库操作
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from app.models.conversation import Conversation, ConversationMessage
from app.schemas.conversation import ConversationCreate, ConversationUpdate, ConversationMessageCreate
import uuid
from app.utils.logger import app_logger


def get_conversation(db: Session, conversation_id: str) -> Optional[Conversation]:
    """
    根据 ID 获取对话
    
    Args:
        db: 数据库会话
        conversation_id: 对话 ID
    
    Returns:
        Conversation: 对话对象或 None
    """
    return db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.is_deleted == False
    ).first()


def get_conversations(
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
    query = db.query(Conversation).filter(
        and_(
            Conversation.tenant_id == tenant_id,
            Conversation.user_id == user_id,
            Conversation.is_deleted == False,
        )
    )
    
    if status:
        query = query.filter(Conversation.status == status)
    
    return (
        query.order_by(desc(Conversation.updated_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_conversation(
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
    db_conversation = Conversation(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        user_id=user_id,
        **conversation_in.dict()
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    app_logger.info(f"Created conversation: {db_conversation.id}")
    return db_conversation


def update_conversation(
    db: Session,
    db_conversation: Conversation,
    conversation_in: ConversationUpdate,
) -> Conversation:
    """
    更新对话
    
    Args:
        db: 数据库会话
        db_conversation: 现有对话对象
        conversation_in: 更新请求
    
    Returns:
        Conversation: 更新后的对话对象
    """
    for field, value in conversation_in.dict(exclude_unset=True).items():
        setattr(db_conversation, field, value)
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    app_logger.info(f"Updated conversation: {db_conversation.id}")
    return db_conversation


def delete_conversation(db: Session, conversation_id: str) -> Conversation:
    """
    删除对话
    
    Args:
        db: 数据库会话
        conversation_id: 对话 ID
    
    Returns:
        Conversation: 被删除的对话对象
    """
    conversation = get_conversation(db, conversation_id)
    if conversation:
        db.delete(conversation)
        db.commit()
        app_logger.info(f"Deleted conversation: {conversation_id}")
    return conversation


def get_conversation_messages(
    db: Session,
    conversation_id: str,
    skip: int = 0,
    limit: int = 100,
) -> List[ConversationMessage]:
    """
    获取对话消息列表
    
    Args:
        db: 数据库会话
        conversation_id: 对话 ID
        skip: 跳过数量
        limit: 限制数量
    
    Returns:
        List[ConversationMessage]: 消息列表
    """
    return (
        db.query(ConversationMessage)
        .filter(ConversationMessage.conversation_id == conversation_id)
        .order_by(ConversationMessage.created_at)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_conversation_message(
    db: Session,
    message_in: ConversationMessageCreate,
    conversation_id: str,
    model: Optional[str] = None,
) -> ConversationMessage:
    """
    创建对话消息
    
    Args:
        db: 数据库会话
        message_in: 创建请求
        conversation_id: 对话 ID
        model: 模型名称
    
    Returns:
        ConversationMessage: 创建的消息对象
    """
    db_message = ConversationMessage(
        id=uuid.uuid4(),
        conversation_id=conversation_id,
        model=model,
        **message_in.dict()
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def delete_conversation_messages(
    db: Session,
    conversation_id: str,
) -> int:
    """
    删除对话的所有消息
    
    Args:
        db: 数据库会话
        conversation_id: 对话 ID
    
    Returns:
        int: 删除的消息数量
    """
    count = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.conversation_id == conversation_id)
        .count()
    )
    
    db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id
    ).delete()
    db.commit()
    
    app_logger.info(f"Deleted {count} messages from conversation {conversation_id}")
    return count


def update_conversation_stats(
    db: Session,
    conversation_id: str,
    increment_messages: int = 0,
    increment_tokens: int = 0,
) -> Optional[Conversation]:
    """
    更新对话统计信息
    
    Args:
        db: 数据库会话
        conversation_id: 对话 ID
        increment_messages: 增加的消息数
        increment_tokens: 增加的 Token 数
    
    Returns:
        Conversation: 更新后的对话对象或 None
    """
    conversation = get_conversation(db, conversation_id)
    if not conversation:
        return None
    
    conversation.total_messages += increment_messages
    conversation.total_tokens += increment_tokens
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def count_conversations(
    db: Session,
    tenant_id: str,
    user_id: str,
    status: Optional[str] = None,
) -> int:
    """
    统计对话数量
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
        user_id: 用户 ID
        status: 状态筛选
    
    Returns:
        int: 对话数量
    """
    query = db.query(Conversation).filter(
        and_(
            Conversation.tenant_id == tenant_id,
            Conversation.user_id == user_id,
        )
    )
    
    if status:
        query = query.filter(Conversation.status == status)
    
    return query.count()
