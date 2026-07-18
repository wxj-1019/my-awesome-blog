from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    email = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(100))
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True))
    unsubscribed_at = Column(DateTime(timezone=True))