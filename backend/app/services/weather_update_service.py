from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.crud.weather import create_or_update_weather
from app.services.weather_service import WeatherService
from app.utils.logger import app_logger


class WeatherUpdateService:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.cities = ["杭州"]

    async def update_weather_for_city(self, city: str) -> None:
        db = SessionLocal()
        try:
            app_logger.info(f"Starting scheduled weather update for city: {city}")
            weather_service = WeatherService()
            weather_response = await weather_service.get_weather(city, db)
            
            if weather_response.data:
                data = weather_response.data
                
                create_or_update_weather(
                    db,
                    city=data.city,
                    province=data.province,
                    country='',
                    weather=data.weather,
                    weather_img=data.weather_code,
                    temperature=str(data.temp),
                    temp_min=str(data.min_temp),
                    temp_max=str(data.max_temp),
                    wind_direction=data.wind,
                    wind_speed=data.wind_speed,
                    wind_meter=data.wind_power,
                    humidity=data.humidity,
                    visibility=data.visibility,
                    pressure=data.pressure,
                    air_quality=data.air,
                    is_daytime=self.is_daytime(data.update_time)
                )
                
                app_logger.success(f"Successfully updated weather for {city}: {data.weather}, {data.temp}°C")
            else:
                app_logger.warning(f"No weather data received for {city}")
                
        except Exception as e:
            app_logger.error(f"Failed to update weather for {city}: {e}")
        finally:
            db.close()

    def is_daytime(self, update_time: str) -> bool:
        if not update_time:
            return True
        try:
            hour = int(update_time.split(':')[0])
            return 6 <= hour < 18
        except:
            return True

    async def update_all_cities(self) -> None:
        app_logger.info("Starting scheduled weather update for all cities")
        for city in self.cities:
            await self.update_weather_for_city(city)
        app_logger.success("Completed weather update for all cities")

    def add_city(self, city: str) -> None:
        if city not in self.cities:
            self.cities.append(city)
            app_logger.info(f"Added city to weather update schedule: {city}")

    def remove_city(self, city: str) -> None:
        if city in self.cities:
            self.cities.remove(city)
            app_logger.info(f"Removed city from weather update schedule: {city}")

    def start(self) -> None:
        app_logger.info("Starting weather update scheduler")
        
        self.scheduler.add_job(
            self.update_all_cities,
            CronTrigger(hour="*", minute=0),
            id="hourly_weather_update",
            name="Hourly Weather Update",
            replace_existing=True
        )
        
        self.scheduler.start()
        app_logger.success("Weather update scheduler started")

    async def initial_update(self) -> None:
        app_logger.info("Performing initial weather update on startup")
        await self.update_all_cities()

    def shutdown(self) -> None:
        app_logger.info("Shutting down weather update scheduler")
        self.scheduler.shutdown(wait=False)
        app_logger.info("Weather update scheduler stopped")


weather_update_service = WeatherUpdateService()
