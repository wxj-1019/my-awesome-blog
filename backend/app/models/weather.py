import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, UUID, Index
from sqlalchemy.sql import func
from app.core.database import Base


class Weather(Base):
    __tablename__ = "weather"

    __table_args__ = (
        Index('idx_weather_city', 'city'),
        Index('idx_weather_updated', 'updated_at'),
        Index('idx_weather_city_updated', 'city', 'updated_at'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    city = Column(String(100), nullable=False, index=True)
    province = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    weather = Column(String(50), nullable=False)
    weather_img = Column(String(200), nullable=True)
    temperature = Column(String(20), nullable=False)
    temp_min = Column(String(20), nullable=True)
    temp_max = Column(String(20), nullable=True)
    wind_direction = Column(String(50), nullable=True)
    wind_speed = Column(String(20), nullable=True)
    wind_meter = Column(String(20), nullable=True)
    humidity = Column(String(20), nullable=True)
    visibility = Column(String(20), nullable=True)
    pressure = Column(String(20), nullable=True)
    air_quality = Column(String(50), nullable=True)
    is_daytime = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), index=True)
