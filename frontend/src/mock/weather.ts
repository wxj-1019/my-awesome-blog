import type { BackendWeatherData } from '@/services/backendWeatherService';

export const MOCK_WEATHER: BackendWeatherData = {
  city: '杭州',
  province: '浙江',
  country: '',
  weather: '多云',
  temperature: '24',
  tempMin: '18',
  tempMax: '28',
  windDirection: '东南风',
  windSpeed: '3级',
  humidity: '65%',
  visibility: '10km',
  pressure: '1012hPa',
  airQuality: '良',
  isDaytime: true,
  updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
};
