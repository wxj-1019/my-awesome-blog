from sqlalchemy import Column, Integer, String, Text, Boolean, BigInteger, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.core.types import UUIDType


class Image(Base):
    __tablename__ = "images"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)  # 字节
    mime_type = Column(String(50), nullable=False)
    width = Column(Integer)
    height = Column(Integer)
    alt_text = Column(String(255))
    caption = Column(Text)
    is_optimized = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    variants = relationship("ImageVariant", back_populates="image", cascade="all, delete-orphan")
    portfolio_images = relationship("PortfolioImage", back_populates="image", cascade="all, delete-orphan")


class ImageVariant(Base):
    __tablename__ = "image_variants"

    id = Column(UUIDType, primary_key=True, index=True, default=uuid.uuid4)
    image_id = Column(UUIDType, ForeignKey("images.id"), nullable=False)
    variant_name = Column(String(50), nullable=False)  # thumbnail, small, medium, large, hero
    file_path = Column(String(500), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    quality = Column(Integer, default=85)
    format = Column(String(10), default='webp')  # webp, jpeg, png
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    image = relationship("Image", back_populates="variants")

    __mapper_args__ = {'confirm_deleted_rows': False}  # 避免删除行警告