from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class FriendLink(Base):
    __tablename__ = "friend_links"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    favicon = Column(String(500))
    avatar = Column(String(500))
    description = Column(Text)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    click_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())