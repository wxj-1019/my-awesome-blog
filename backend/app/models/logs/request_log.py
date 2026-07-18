from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class RequestLog(Base):
    """
    Model for tracking API requests with detailed information.
    """
    __tablename__ = "request_logs"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    request_id = Column(String(36), nullable=False, index=True)  # UUID
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE, etc.
    url = Column(String(500), nullable=False)
    path = Column(String(500), nullable=False)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)  # Supports IPv6
    referer = Column(String(500), nullable=True)
    
    # Request details
    request_headers = Column(Text, nullable=True)  # JSON string of headers
    request_body = Column(Text, nullable=True)
    
    # Response details
    response_status = Column(Integer, nullable=False)
    response_body = Column(Text, nullable=True)
    response_time = Column(Integer, nullable=False)  # in milliseconds
    
    # Timing
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    duration = Column(Integer, nullable=False)  # in milliseconds
    
    # Additional fields
    user_id = Column(UUIDType, nullable=True, index=True)  # Foreign key to users table
    session_id = Column(String(100), nullable=True, index=True)


# Create indexes for better query performance
Index('idx_request_logs_request_id', RequestLog.request_id)
Index('idx_request_logs_timestamp', RequestLog.timestamp)
Index('idx_request_logs_user_id', RequestLog.user_id)
Index('idx_request_logs_method', RequestLog.method)
Index('idx_request_logs_response_status', RequestLog.response_status)