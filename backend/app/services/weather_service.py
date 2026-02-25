import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.schemas.weather import WeatherResponse
from app.utils.logger import app_logger
from app.crud import weather as weather_crud


class WeatherService:
    ALAPI_BASE_URL = "https://v3.alapi.cn/api/tianqi"
    CACHE_DURATION_MINUTES = 60  # 缓存1小时

    def __init__(self):
        if not settings.ALAPI_TOKEN:
            app_logger.warning("ALAPI_TOKEN is not configured in environment variables")

    def _is_cache_expired(self, updated_at: Optional[datetime]) -> bool:
        """判断缓存是否过期"""
        if not updated_at:
            return True
        expiration_time = updated_at + timedelta(minutes=self.CACHE_DURATION_MINUTES)
        return datetime.now(timezone.utc) > expiration_time

    def _weather_to_response(self, db_weather) -> WeatherResponse:
        """将数据库天气记录转换为 WeatherResponse"""
        import uuid

        return WeatherResponse(
            request_id=str(uuid.uuid4()),
            success=True,
            message="success",
            code=200,
            data={
                "city": db_weather.city,
                "city_en": db_weather.city.lower() if db_weather.city else "",
                "province": db_weather.province or "",
                "province_en": (db_weather.province.lower() if db_weather.province else ""),
                "city_id": "",
                "date": db_weather.updated_at.strftime("%Y-%m-%d") if db_weather.updated_at else "",
                "update_time": db_weather.updated_at.strftime("%Y-%m-%d %H:%M:%S") if db_weather.updated_at else "",
                "weather": db_weather.weather,
                "weather_code": "",
                "temp": float(db_weather.temperature) if db_weather.temperature and db_weather.temperature.replace('.', '').isdigit() else 0,
                "min_temp": float(db_weather.temp_min) if db_weather.temp_min and db_weather.temp_min.replace('.', '').isdigit() else 0,
                "max_temp": float(db_weather.temp_max) if db_weather.temp_max and db_weather.temp_max.replace('.', '').isdigit() else 0,
                "wind": db_weather.wind_direction or "",
                "wind_speed": db_weather.wind_speed or "",
                "wind_power": db_weather.wind_meter or "",
                "rain": "0",
                "rain_24h": "0",
                "humidity": db_weather.humidity or "",
                "visibility": db_weather.visibility or "",
                "pressure": db_weather.pressure or "",
                "tail_number": "不限行",
                "air": db_weather.air_quality or "",
                "air_pm25": "",
                "sunrise": "",
                "sunset": "",
                "aqi": {
                    "air": db_weather.air_quality or "",
                    "air_level": "",
                    "air_tips": "",
                    "pm25": "",
                    "pm10": "",
                    "co": "",
                    "no2": "",
                    "so2": "",
                    "o3": ""
                },
                "index": [],
                "alarm": [],
                "hour": []
            },
            time=0,
            usage=0
        )

    async def _fetch_from_api(self, city: str) -> WeatherResponse:
        """从第三方API获取天气数据"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            body = {
                "token": settings.ALAPI_TOKEN,
                "city": city.strip()
            }
            
            app_logger.info(f"Requesting weather data from ALAPI for city: {city}")
            
            response = await client.post(
                self.ALAPI_BASE_URL,
                json=body
            )
            response.raise_for_status()
            
            result = response.json()
            
            if not result.get("success", False):
                error_msg = result.get("message", "获取天气数据失败")
                app_logger.error(f"ALAPI error: {error_msg}")
                raise ValueError(error_msg)
            
            app_logger.success(f"Successfully fetched weather data from ALAPI for {city}")
            return WeatherResponse(**result)

    def _save_to_db(self, db: Session, city: str, weather_response: WeatherResponse) -> None:
        """将天气数据保存到数据库"""
        data = weather_response.data
        if not data:
            return
        
        try:
            # 根据更新时间判断是否为白天
            is_daytime = True
            if data.update_time:
                try:
                    hour = int(data.update_time.split(' ')[1].split(':')[0])
                    is_daytime = 6 <= hour < 18
                except:
                    pass
            
            weather_crud.create_or_update_weather(
                db=db,
                city=data.city or city,
                province=data.province,
                country=None,  # API 响应中没有 country 字段
                weather=data.weather,
                weather_img=data.weather_code,  # 使用 weather_code 作为 weather_img
                temperature=str(data.temp),
                temp_min=str(data.min_temp) if data.min_temp is not None else None,
                temp_max=str(data.max_temp) if data.max_temp is not None else None,
                wind_direction=data.wind,
                wind_speed=data.wind_speed,
                wind_meter=data.wind_power,
                humidity=data.humidity,
                visibility=data.visibility,
                pressure=data.pressure,
                air_quality=data.air,
                is_daytime=is_daytime
            )
        except Exception as e:
            app_logger.error(f"Error saving weather to database: {e}")

    async def get_weather(self, city: str, db: Session) -> WeatherResponse:
        """获取天气数据，优先从数据库缓存获取"""
        if not settings.ALAPI_TOKEN:
            raise ValueError("ALAPI_TOKEN 未配置，请检查环境变量")

        if not city or len(city.strip()) == 0:
            raise ValueError("城市名称不能为空")

        city = city.strip()
        
        try:
            # 1. 先从数据库查询
            db_weather = weather_crud.get_weather_by_city(db, city)
            
            # 2. 检查缓存是否有效（1小时内）
            if db_weather and not self._is_cache_expired(db_weather.updated_at):
                app_logger.info(f"Cache hit for weather data: {city} (updated at {db_weather.updated_at})")
                return self._weather_to_response(db_weather)
            
            # 3. 缓存不存在或已过期，调用第三方API
            app_logger.info(f"Cache miss or expired for weather data: {city}, fetching from ALAPI")
            weather_response = await self._fetch_from_api(city)
            
            # 4. 保存到数据库（即使API返回数据，也尝试保存）
            if weather_response.success and weather_response.data:
                try:
                    self._save_to_db(db, city, weather_response)
                except Exception as e:
                    app_logger.warning(f"Failed to save weather to database: {e}")
            
            return weather_response
            
        except httpx.HTTPStatusError as e:
            app_logger.error(f"HTTP error fetching weather data: {e.response.status_code}")
            # 如果API请求失败但数据库有数据，返回缓存数据
            if db_weather:
                app_logger.info(f"Returning stale cache for {city} after API error")
                return self._weather_to_response(db_weather)
            raise ValueError(f"天气服务请求失败: HTTP {e.response.status_code}")
        except httpx.TimeoutException:
            app_logger.error("Timeout fetching weather data from ALAPI")
            # 超时情况下也尝试返回缓存数据
            db_weather = weather_crud.get_weather_by_city(db, city)
            if db_weather:
                app_logger.info(f"Returning stale cache for {city} after timeout")
                return self._weather_to_response(db_weather)
            raise ValueError("天气服务请求超时")
        except httpx.RequestError as e:
            app_logger.error(f"Request error fetching weather data: {e}")
            db_weather = weather_crud.get_weather_by_city(db, city)
            if db_weather:
                app_logger.info(f"Returning stale cache for {city} after request error")
                return self._weather_to_response(db_weather)
            raise ValueError("天气服务请求错误")
        except Exception as e:
            app_logger.error(f"Unexpected error fetching weather data: {e}")
            # 如果有缓存数据，返回缓存
            try:
                db_weather = weather_crud.get_weather_by_city(db, city)
                if db_weather:
                    app_logger.info(f"Returning stale cache for {city} after error")
                    return self._weather_to_response(db_weather)
            except:
                pass
            raise ValueError(f"获取天气数据时发生错误: {str(e)}")



