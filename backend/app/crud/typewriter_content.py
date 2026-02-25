from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.typewriter_content import TypewriterContent
from app.schemas.typewriter_content import TypewriterContentCreate, TypewriterContentUpdate


def get_typewriter_content(db: Session, content_id: UUID) -> Optional[TypewriterContent]:
    """Get a single typewriter content by ID"""
    return db.query(TypewriterContent).filter(TypewriterContent.id == content_id).first()


def get_typewriter_contents(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
) -> List[TypewriterContent]:
    """Get typewriter contents with optional filters"""
    query = db.query(TypewriterContent)
    
    if active_only:
        query = query.filter(TypewriterContent.is_active == True)
    
    return query.order_by(TypewriterContent.priority.asc()).offset(skip).limit(limit).all()


def get_active_typewriter_contents(db: Session) -> List[TypewriterContent]:
    """Get all active typewriter contents ordered by priority"""
    return (
        db.query(TypewriterContent)
        .filter(TypewriterContent.is_active == True)
        .order_by(TypewriterContent.priority.asc())
        .all()
    )


def create_typewriter_content(
    db: Session,
    content: TypewriterContentCreate,
) -> TypewriterContent:
    """Create a new typewriter content"""
    db_content = TypewriterContent(**content.model_dump())
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content


def update_typewriter_content(
    db: Session,
    content_id: UUID,
    content_update: TypewriterContentUpdate,
) -> Optional[TypewriterContent]:
    """Update an existing typewriter content"""
    db_content = db.query(TypewriterContent).filter(TypewriterContent.id == content_id).first()
    if not db_content:
        return None
    
    update_data = content_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_content, field, value)
    
    db.commit()
    db.refresh(db_content)
    return db_content


def delete_typewriter_content(db: Session, content_id: UUID) -> bool:
    """Delete a typewriter content by ID"""
    db_content = db.query(TypewriterContent).filter(TypewriterContent.id == content_id).first()
    if not db_content:
        return False
    
    db.delete(db_content)
    db.commit()
    return True


def deactivate_typewriter_content(db: Session, content_id: UUID) -> Optional[TypewriterContent]:
    """Soft delete a typewriter content by setting is_active to False"""
    db_content = db.query(TypewriterContent).filter(TypewriterContent.id == content_id).first()
    if not db_content:
        return None
    
    db_content.is_active = False  # type: ignore
    db.commit()
    db.refresh(db_content)
    return db_content
