import { MOCK_WEATHER } from '@/mock/weather';

const API_BASE_URL = ''; // 使用相对路径，走 Next.js rewrite 代理
const API_PATH = '/api/v1/weather';

export interface WeatherAQI {
  air: string;
  air_level: string;
  air_tips: string;
  pm25: string;
  pm10: string;
  co: string;
  no2: string;
  so2: string;
  o3: string;
}

export interface BackendWeatherCurrent {
  city: string;
  city_en: string;
  province: string;
  province_en: string;
  city_id: string;
  date: string;
  update_time: string;
  weather: string;
  weather_code: string;
  temp: number;
  min_temp: number;
  max_temp: number;
  wind: string;
  wind_speed: string;
  wind_power: string;
  rain: string;
  rain_24h: string;
  humidity: string;
  visibility: string;
  pressure: string;
  tail_number: string;
  air: string;
  air_pm25: string;
  sunrise: string;
  sunset: string;
  aqi: WeatherAQI;
  index: unknown[];
  alarm: unknown[];
  hour: unknown[];
}

export interface BackendWeatherResponse {
  request_id: string;
  success: boolean;
  message: string;
  code: number;
  data: BackendWeatherCurrent | null;
  time: number;
  usage: number;
}

export interface BackendWeatherData {
  city: string;
  province: string;
  country: string;
  weather: string;
  temperature: string;
  tempMin: string;
  tempMax: string;
  windDirection: string;
  windSpeed: string;
  humidity: string;
  visibility: string;
  pressure: string;
  airQuality: string;
  isDaytime: boolean;
  updateTime: string;
}

export const backendWeatherService = {
  async getCurrentWeather(city: string = '杭州'): Promise<BackendWeatherData> {
    try {
      const url = `${API_BASE_URL}${API_PATH}/current?city=${encodeURIComponent(city)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: BackendWeatherResponse = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || '获取天气数据失败');
      }
      
      const data = result.data;
      return {
        city: data.city,
        province: data.province,
        country: '',
        weather: data.weather,
        temperature: data.temp.toString(),
        tempMin: data.min_temp.toString(),
        tempMax: data.max_temp.toString(),
        windDirection: data.wind,
        windSpeed: data.wind_speed,
        humidity: data.humidity,
        visibility: data.visibility,
        pressure: data.pressure,
        airQuality: data.air,
        isDaytime: this.isDaytime(data.update_time),
        updateTime: data.update_time,
      };
    } catch (error) {
      console.error('Failed to fetch weather from backend:', error);
      return { ...MOCK_WEATHER, updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) };
    }
  },

  async getForecast(city: string = '杭州'): Promise<BackendWeatherData> {
    try {
      const url = `${API_BASE_URL}${API_PATH}/forecast?city=${encodeURIComponent(city)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: BackendWeatherResponse = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || '获取天气预报失败');
      }
      
      const data = result.data;
      return {
        city: data.city,
        province: data.province,
        country: '',
        weather: data.weather,
        temperature: data.temp.toString(),
        tempMin: data.min_temp.toString(),
        tempMax: data.max_temp.toString(),
        windDirection: data.wind,
        windSpeed: data.wind_speed,
        humidity: data.humidity,
        visibility: data.visibility,
        pressure: data.pressure,
        airQuality: data.air,
        isDaytime: this.isDaytime(data.update_time),
        updateTime: data.update_time,
      };
    } catch (error) {
      console.error('Failed to fetch forecast from backend:', error);
      return { ...MOCK_WEATHER, updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) };
    }
  },

  isDaytime(updateTime: string): boolean {
    if (!updateTime) {return true;}
    try {
      const hour = parseInt(updateTime.split(':')[0]);
      return hour >= 6 && hour < 18;
    } catch {
      return true;
    }
  },
};
