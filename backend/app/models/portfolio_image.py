from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class PortfolioImage(Base):
    __tablename__ = "portfolio_images"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    portfolio_id = Column(UUIDType, ForeignKey("portfolios.id"), nullable=False)
    image_id = Column(UUIDType, ForeignKey("images.id"), nullable=False)
    sort_order = Column(Integer, default=0)  # 用于排序
    is_cover = Column(Boolean, default=False)  # 标记是否为封面图
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    portfolio = relationship("Portfolio", back_populates="portfolio_images")
    image = relationship("Image", back_populates="portfolio_images")


# 更新Portfolio模型以包含关联
from sqlalchemy.orm import declarative_mixin
from sqlalchemy import inspect

def enhance_portfolio_with_images():
    """
    动态添加portfolio_images关系到Portfolio模型
    这是一个辅助函数，确保关系被正确添加
    """
    from app.models.portfolio import Portfolio
    if not hasattr(Portfolio, 'portfolio_images'):
        Portfolio.portfolio_images = relationship(
            "PortfolioImage", 
            back_populates="portfolio", 
            cascade="all, delete-orphan"
        )