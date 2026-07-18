from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import Optional
from sqlalchemy.orm import Session
from app.schemas.weather import WeatherResponse, WeatherRequest
from app.services.weather_service import WeatherService
from app.utils.logger import app_logger
from app.core.database import get_db

router = APIRouter()


@router.get("/current", response_model=WeatherResponse, status_code=status.HTTP_200_OK)
async def get_current_weather(
    city: str = Query(..., description="城市名称", min_length=1, max_length=50),
    db: Session = Depends(get_db)
) -> WeatherResponse:
    """
    获取指定城市的当前天气信息
    
    优先从数据库缓存获取，如果数据超过1小时则自动更新。
    
    参数:
    - city: 城市名称（如：杭州、北京、上海）
    
    返回:
    - WeatherResponse: 包含当前天气、预报、空气质量等数据
    """
    try:
        weather_service = WeatherService()
        app_logger.info(f"Fetching weather data for city: {city}")
        result = await weather_service.get_weather(city, db)
        return result
    except ValueError as e:
        app_logger.warning(f"Value error fetching weather for {city}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        app_logger.error(f"Unexpected error fetching weather for {city}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取天气数据失败，请稍后重试"
        )



@router.get("/forecast", response_model=WeatherResponse, status_code=status.HTTP_200_OK)
async def get_weather_forecast(
    city: str = Query(..., description="城市名称", min_length=1, max_length=50),
    db: Session = Depends(get_db)
) -> WeatherResponse:
    """
    获取指定城市的天气预报信息
    
    优先从数据库缓存获取，如果数据超过1小时则自动更新。
    
    参数:
    - city: 城市名称（如：杭州、北京、上海）
    
    返回:
    - WeatherResponse: 包含当前天气、预报、空气质量等数据
    """
    try:
        weather_service = WeatherService()
        app_logger.info(f"Fetching weather forecast for city: {city}")
        result = await weather_service.get_weather(city, db)
        return result
    except ValueError as e:
        app_logger.warning(f"Value error fetching forecast for {city}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        app_logger.error(f"Unexpected error fetching forecast for {city}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取天气预报失败，请稍后重试"
        )
