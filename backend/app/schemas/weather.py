from typing import Optional, List, Any
from pydantic import BaseModel, Field


class WeatherAQI(BaseModel):
    air: Optional[str] = Field(default=None, description="空气质量指数")
    air_level: Optional[str] = Field(default=None, description="空气质量等级")
    air_tips: Optional[str] = Field(default=None, description="空气质量提示")
    pm25: Optional[str] = Field(default=None, description="PM2.5浓度")
    pm10: Optional[str] = Field(default=None, description="PM10浓度")
    co: Optional[str] = Field(default=None, description="CO浓度")
    no2: Optional[str] = Field(default=None, description="NO2浓度")
    so2: Optional[str] = Field(default=None, description="SO2浓度")
    o3: Optional[str] = Field(default=None, description="O3浓度")


class WeatherCurrent(BaseModel):
    city: str = Field(description="城市名称")
    city_en: Optional[str] = Field(default=None, description="城市英文名")
    province: Optional[str] = Field(default=None, description="省份")
    province_en: Optional[str] = Field(default=None, description="省份英文名")
    city_id: Optional[str] = Field(default=None, description="城市ID")
    date: Optional[str] = Field(default=None, description="日期")
    update_time: Optional[str] = Field(default=None, description="更新时间")
    weather: Optional[str] = Field(default=None, description="天气状况")
    weather_code: Optional[str] = Field(default=None, description="天气代码")
    temp: Optional[float] = Field(default=None, description="温度")
    min_temp: Optional[float] = Field(default=None, description="最低温度")
    max_temp: Optional[float] = Field(default=None, description="最高温度")
    wind: Optional[str] = Field(default=None, description="风向")
    wind_speed: Optional[str] = Field(default=None, description="风速")
    wind_power: Optional[str] = Field(default=None, description="风力等级")
    rain: Optional[str] = Field(default=None, description="降雨量")
    rain_24h: Optional[str] = Field(default=None, description="24小时降雨量")
    humidity: Optional[str] = Field(default=None, description="相对湿度")
    visibility: Optional[str] = Field(default=None, description="能见度")
    pressure: Optional[str] = Field(default=None, description="气压")
    tail_number: Optional[str] = Field(default=None, description="尾号")
    air: Optional[str] = Field(default=None, description="空气质量")
    air_pm25: Optional[str] = Field(default=None, description="PM2.5")
    sunrise: Optional[str] = Field(default=None, description="日出时间")
    sunset: Optional[str] = Field(default=None, description="日落时间")
    aqi: Optional[WeatherAQI] = Field(default=None, description="AQI详情")
    index: Optional[List[Any]] = Field(default=None, description="生活指数")
    alarm: Optional[List[Any]] = Field(default=None, description="预警信息")
    hour: Optional[List[Any]] = Field(default=None, description="24小时预报")


class WeatherResponse(BaseModel):
    request_id: Optional[str] = Field(default=None, description="请求ID")
    success: bool = Field(default=True, description="请求是否成功")
    message: Optional[str] = Field(default=None, description="响应消息")
    code: Optional[int] = Field(default=None, description="响应代码")
    data: Optional[WeatherCurrent] = Field(default=None, description="当前天气数据")
    time: Optional[int] = Field(default=None, description="响应时间戳")
    usage: Optional[int] = Field(default=None, description="API调用次数")


class WeatherRequest(BaseModel):
    city: str = Field(description="城市名称", min_length=1, max_length=50)
