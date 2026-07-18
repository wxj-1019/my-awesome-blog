from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    slug = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    color = Column(String(7))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    articles = relationship("Article", secondary="article_tags", back_populates="tags", overlaps="article_tags")
    article_tags = relationship("ArticleTag", back_populates="tag", cascade="all, delete-orphan", overlaps="articles,tags")
