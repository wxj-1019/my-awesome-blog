from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False)
    description = Column(Text)
    cover_image = Column(String(500))
    demo_url = Column(String(500))
    github_url = Column(String(500))
    # PostgreSQL数组类型需要额外导入
    technologies = Column(Text)  # 存储JSON格式的技术栈
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(20), default='completed')  # completed, in_progress, planned
    is_featured = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship with images through association table
    portfolio_images = relationship("PortfolioImage", back_populates="portfolio", cascade="all, delete-orphan")