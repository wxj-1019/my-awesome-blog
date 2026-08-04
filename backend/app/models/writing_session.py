# backend/app/models/writing_session.py
import uuid

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.types import UUIDType


class WritingSession(Base):
    """写作会话模型 —— 跟踪从澄清需求到定稿的多阶段 AI 写作流程"""

    __tablename__ = "writing_sessions"
    __table_args__ = (
        Index("idx_writing_sessions_user_status_updated", "user_id", "status", "updated_at"),
    )

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    article_id = Column(UUIDType, ForeignKey("articles.id", ondelete="SET NULL"), nullable=True, index=True)
    stage = Column(String(32), nullable=False, default="clarifying", index=True)
    status = Column(String(16), nullable=False, default="active", index=True)
    requirements_summary = Column(JSON, nullable=False, default=dict)
    outline = Column(Text, nullable=False, default="")
    draft = Column(Text, nullable=False, default="")
    messages = Column(JSON, nullable=False, default=list)
    suggestions = Column(JSON, nullable=False, default=list)
    revisions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    article = relationship("Article")
