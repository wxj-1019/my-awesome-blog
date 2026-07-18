from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    slug = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    color = Column(String(7))
    icon = Column(String(50))
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    articles = relationship("Article", secondary="article_categories", back_populates="categories", overlaps="article_categories")
    article_categories = relationship("ArticleCategory", back_populates="category", cascade="all, delete-orphan", overlaps="articles,categories")
