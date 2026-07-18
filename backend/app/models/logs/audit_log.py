from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id"), nullable=True)  # Nullable for system actions
    action = Column(String(100), nullable=False)  # e.g., "CREATE_ARTICLE", "UPDATE_USER", "DELETE_COMMENT"
    resource_type = Column(String(50), nullable=False)  # e.g., "article", "user", "comment"
    resource_id = Column(String(100), nullable=True)  # ID of the resource affected
    old_values = Column(Text)  # JSON string of old values before change
    new_values = Column(Text)  # JSON string of new values after change
    ip_address = Column(String(45), nullable=True)  # Store IPv4 or IPv6 addresses
    user_agent = Column(Text, nullable=True)  # Browser/Client information
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="audit_logs")