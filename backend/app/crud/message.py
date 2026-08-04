from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageUpdate


def get_message(db: Session, message_id: UUID, with_relationships: bool = False) -> Optional[Message]:
    query = db.query(Message)
    if with_relationships:
        query = query.options(joinedload(Message.author))
    return query.filter(Message.id == message_id, Message.is_deleted == False).first()


def get_messages(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    danmaku_only: bool = False,
    with_relationships: bool = False,
) -> List[Message]:
    query = db.query(Message).filter(Message.is_deleted == False)
    
    if danmaku_only:
        query = query.filter(Message.is_danmaku == True)
    
    # Get top-level messages (no parent) first
    query = query.filter(Message.parent_id.is_(None))
    
    if with_relationships:
        query = query.options(joinedload(Message.author))
    
    return query.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()


def get_messages_by_author(
    db: Session,
    author_id: UUID,
    skip: int = 0,
    limit: int = 100,
    with_relationships: bool = False,
) -> List[Message]:
    query = db.query(Message).filter(
        Message.author_id == author_id,
        Message.is_deleted == False
    )
    
    if with_relationships:
        query = query.options(joinedload(Message.author))
    
    return query.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()


def get_danmaku_messages(
    db: Session,
    limit: int = 50,
    with_relationships: bool = False,
) -> List[Message]:
    """Get random danmaku messages for display"""
    from sqlalchemy import func
    query = db.query(Message).filter(
        Message.is_danmaku == True,
        Message.is_deleted == False
    )
    
    if with_relationships:
        query = query.options(joinedload(Message.author))
    
    # Random order for danmaku effect
    return query.order_by(func.random()).limit(limit).all()


def get_replies(
    db: Session,
    message_id: UUID,
    skip: int = 0,
    limit: int = 100,
    with_relationships: bool = False,
) -> List[Message]:
    query = db.query(Message).filter(
        Message.parent_id == message_id,
        Message.is_deleted == False
    )
    
    if with_relationships:
        query = query.options(joinedload(Message.author))
    
    return query.order_by(Message.created_at.asc()).offset(skip).limit(limit).all()


def create_message(db: Session, message: MessageCreate, author_id: Optional[UUID] = None) -> Message:
    """创建留言；游客留言 author_id 为 None，昵称取自 message.nickname"""
    db_message = Message(
        **message.model_dump(),
        author_id=author_id,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def update_message(
    db: Session,
    message_id: UUID,
    message_update: MessageUpdate
) -> Optional[Message]:
    db_message = get_message(db, message_id)
    if not db_message:
        return None
    
    update_data = message_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_message, field, value)
    
    db.commit()
    db.refresh(db_message)
    return db_message


def delete_message(db: Session, message_id: UUID) -> bool:
    """Soft delete a message"""
    db_message = get_message(db, message_id)
    if not db_message:
        return False
    
    db_message.is_deleted = True
    db.commit()
    return True


def hard_delete_message(db: Session, message_id: UUID) -> bool:
    """Hard delete a message (admin only)"""
    db_message = get_message(db, message_id)
    if not db_message:
        return False
    
    db.delete(db_message)
    db.commit()
    return True


def like_message(db: Session, message_id: UUID) -> Optional[Message]:
    db.query(Message).filter(Message.id == message_id).update(
        {Message.likes: Message.likes + 1}
    )
    db.commit()
    return get_message(db, message_id)


def unlike_message(db: Session, message_id: UUID) -> Optional[Message]:
    db.query(Message).filter(
        Message.id == message_id,
        Message.likes > 0
    ).update(
        {Message.likes: Message.likes - 1}
    )
    db.commit()
    return get_message(db, message_id)


def get_trending_messages(
    db: Session,
    limit: int = 10,
    with_relationships: bool = False
) -> List[Message]:
    """Get messages ordered by likes desc"""
    query = db.query(Message).filter(Message.is_deleted == False)
    
    if with_relationships:
        query = query.options(joinedload(Message.author))
        
    return query.order_by(Message.likes.desc()).limit(limit).all()


def get_message_activity(
    db: Session,
    days: int = 7
) -> List[dict]:
    """Get message count for the last N days"""
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Group by date
    results = db.query(
        func.date(Message.created_at).label('date'),
        func.count(Message.id).label('count')
    ).filter(
        Message.created_at >= start_date,
        Message.is_deleted == False
    ).group_by(
        func.date(Message.created_at)
    ).order_by(
        func.date(Message.created_at)
    ).all()
    
    return [{"date": str(r.date), "count": r.count} for r in results]
