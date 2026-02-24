from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.weather import Weather
from app.utils.logger import app_logger


def get_weather_by_city(db: Session, city: str) -> Optional[Weather]:
    db_weather = db.query(Weather).filter(Weather.city == city).order_by(Weather.updated_at.desc()).first()
    return db_weather


def get_weather_by_id(db: Session, weather_id: UUID) -> Optional[Weather]:
    db_weather = db.query(Weather).filter(Weather.id == weather_id).first()
    return db_weather


def get_all_weathers(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[Weather]:
    weathers = db.query(Weather).order_by(Weather.updated_at.desc()).offset(skip).limit(limit).all()
    return weathers


def get_weather_history(
    db: Session,
    city: str,
    skip: int = 0,
    limit: int = 24
) -> List[Weather]:
    weathers = db.query(Weather).filter(
        Weather.city == city
    ).order_by(
        Weather.updated_at.desc()
    ).offset(skip).limit(limit).all()
    return weathers


def create_weather(
    db: Session,
    city: str,
    province: Optional[str],
    country: Optional[str],
    weather: str,
    weather_img: Optional[str],
    temperature: str,
    temp_min: Optional[str],
    temp_max: Optional[str],
    wind_direction: Optional[str],
    wind_speed: Optional[str],
    wind_meter: Optional[str],
    humidity: Optional[str],
    visibility: Optional[str],
    pressure: Optional[str],
    air_quality: Optional[str],
    is_daytime: bool = True
) -> Weather:
    db_weather = Weather(
        city=city,
        province=province,
        country=country,
        weather=weather,
        weather_img=weather_img,
        temperature=temperature,
        temp_min=temp_min,
        temp_max=temp_max,
        wind_direction=wind_direction,
        wind_speed=wind_speed,
        wind_meter=wind_meter,
        humidity=humidity,
        visibility=visibility,
        pressure=pressure,
        air_quality=air_quality,
        is_daytime=is_daytime
    )
    db.add(db_weather)
    db.commit()
    db.refresh(db_weather)
    app_logger.info(f"Created weather record for {city}: {weather}, {temperature}")
    return db_weather


def update_weather(
    db: Session,
    db_weather: Weather,
    city: Optional[str] = None,
    province: Optional[str] = None,
    country: Optional[str] = None,
    weather: Optional[str] = None,
    weather_img: Optional[str] = None,
    temperature: Optional[str] = None,
    temp_min: Optional[str] = None,
    temp_max: Optional[str] = None,
    wind_direction: Optional[str] = None,
    wind_speed: Optional[str] = None,
    wind_meter: Optional[str] = None,
    humidity: Optional[str] = None,
    visibility: Optional[str] = None,
    pressure: Optional[str] = None,
    air_quality: Optional[str] = None,
    is_daytime: Optional[bool] = None
) -> Weather:
    update_data = {}
    if city is not None:
        update_data['city'] = city
    if province is not None:
        update_data['province'] = province
    if country is not None:
        update_data['country'] = country
    if weather is not None:
        update_data['weather'] = weather
    if weather_img is not None:
        update_data['weather_img'] = weather_img
    if temperature is not None:
        update_data['temperature'] = temperature
    if temp_min is not None:
        update_data['temp_min'] = temp_min
    if temp_max is not None:
        update_data['temp_max'] = temp_max
    if wind_direction is not None:
        update_data['wind_direction'] = wind_direction
    if wind_speed is not None:
        update_data['wind_speed'] = wind_speed
    if wind_meter is not None:
        update_data['wind_meter'] = wind_meter
    if humidity is not None:
        update_data['humidity'] = humidity
    if visibility is not None:
        update_data['visibility'] = visibility
    if pressure is not None:
        update_data['pressure'] = pressure
    if air_quality is not None:
        update_data['air_quality'] = air_quality
    if is_daytime is not None:
        update_data['is_daytime'] = is_daytime

    for field, value in update_data.items():
        setattr(db_weather, field, value)

    db.add(db_weather)
    db.commit()
    db.refresh(db_weather)
    app_logger.info(f"Updated weather record for {db_weather.city}: {db_weather.weather}, {db_weather.temperature}")
    return db_weather


def create_or_update_weather(
    db: Session,
    city: str,
    province: Optional[str],
    country: Optional[str],
    weather: str,
    weather_img: Optional[str],
    temperature: str,
    temp_min: Optional[str],
    temp_max: Optional[str],
    wind_direction: Optional[str],
    wind_speed: Optional[str],
    wind_meter: Optional[str],
    humidity: Optional[str],
    visibility: Optional[str],
    pressure: Optional[str],
    air_quality: Optional[str],
    is_daytime: bool = True
) -> Weather:
    existing_weather = get_weather_by_city(db, city)
    if existing_weather:
        return update_weather(
            db, existing_weather,
            city=city,
            province=province,
            country=country,
            weather=weather,
            weather_img=weather_img,
            temperature=temperature,
            temp_min=temp_min,
            temp_max=temp_max,
            wind_direction=wind_direction,
            wind_speed=wind_speed,
            wind_meter=wind_meter,
            humidity=humidity,
            visibility=visibility,
            pressure=pressure,
            air_quality=air_quality,
            is_daytime=is_daytime
        )
    else:
        return create_weather(
            db, city, province, country, weather, weather_img,
            temperature, temp_min, temp_max, wind_direction, wind_speed, wind_meter,
            humidity, visibility, pressure, air_quality, is_daytime
        )


def delete_weather(db: Session, weather_id: UUID) -> Optional[Weather]:
    db_weather = db.query(Weather).filter(Weather.id == weather_id).first()
    if db_weather:
        db.delete(db_weather)
        db.commit()
        app_logger.info(f"Deleted weather record for {db_weather.city}")
    return db_weather
