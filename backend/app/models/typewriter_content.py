from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class TypewriterContent(Base):
    __tablename__ = "typewriter_contents"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    text = Column(String(500), nullable=False)
    priority = Column(Integer, default=0, index=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
