'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Search,
  RefreshCw,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  CloudSun,
  Zap,
} from 'lucide-react'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'
import { Button } from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'
import { adminApi } from '@/lib/admin-api-client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface WeatherAQI {
  air: string
  air_level: string
  air_tips: string
  pm25: string
  pm10: string
  co: string
  no2: string
  so2: string
  o3: string
}

interface WeatherCurrent {
  city: string
  city_en: string
  province: string
  province_en: string
  city_id: string
  date: string
  update_time: string
  weather: string
  weather_code: string
  temp: number
  min_temp: number
  max_temp: number
  wind: string
  wind_speed: string
  wind_power: string
  rain: string
  rain_24h: string
  humidity: string
  visibility: string
  pressure: string
  tail_number: string
  air: string
  air_pm25: string
  sunrise: string
  sunset: string
  aqi: WeatherAQI
  index: Array<{
    name: string
    level: string
    tips: string
  }>
  alarm: Array<{
    title: string
    type: string
    level: string
  }>
  hour: Array<{
    time: string
    weather: string
    temp: number
  }>
}

interface WeatherResponse {
  request_id: string
  success: boolean
  message: string
  code: number
  data: WeatherCurrent | null
  time: number
  usage: number
}

const POPULAR_CITIES = [
  { name: '北京', province: '北京' },
  { name: '上海', province: '上海' },
  { name: '广州', province: '广东' },
  { name: '深圳', province: '广东' },
  { name: '杭州', province: '浙江' },
  { name: '成都', province: '四川' },
  { name: '武汉', province: '湖北' },
  { name: '西安', province: '陕西' },
]

const getWeatherIcon = (weatherCode: string, size = 'w-12 h-12') => {
  const code = parseInt(weatherCode)
  if (isNaN(code)) return <Cloud className={cn(size, 'text-gray-400 dark:text-gray-500 dark:text-gray-400')} />

  if (code === 0 || code === 1) return <Sun className={cn(size, 'text-yellow-400')} />
  if (code === 2 || code === 3) return <CloudSun className={cn(size, 'text-yellow-300')} />
  if (code >= 4 && code <= 9) return <Cloud className={cn(size, 'text-gray-400 dark:text-gray-500 dark:text-gray-400')} />
  if (code >= 10 && code <= 19) return <CloudRain className={cn(size, 'text-blue-400')} />
  if (code >= 20 && code <= 25) return <CloudSnow className={cn(size, 'text-blue-200')} />
  if (code >= 26 && code <= 29) return <CloudFog className={cn(size, 'text-gray-400 dark:text-gray-500 dark:text-gray-400')} />
  if (code >= 30 && code <= 39) return <Wind className={cn(size, 'text-cyan-400')} />
  if (code >= 40 && code === 49) return <CloudFog className={cn(size, 'text-gray-400 dark:text-gray-500 dark:text-gray-400')} />
  if (code >= 50) return <CloudRain className={cn(size, 'text-blue-400')} />

  return <Cloud className={cn(size, 'text-gray-400 dark:text-gray-500 dark:text-gray-400')} />
}

const getAQIColor = (level: string) => {
  switch (level) {
    case '优':
      return 'text-green-400 bg-green-500/20 border-green-500/30'
    case '良':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
    case '轻度污染':
      return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
    case '中度污染':
      return 'text-red-400 bg-red-500/20 border-red-500/30'
    case '重度污染':
      return 'text-purple-400 bg-purple-500/20 border-purple-500/30'
    case '严重污染':
      return 'text-red-600 bg-red-600/20 border-red-600/30'
    default:
      return 'text-gray-400 dark:text-gray-500 dark:text-gray-400 bg-gray-500/20 border-gray-500/30'
  }
}

const MetricItem = ({
  icon: Icon,
  label,
  value,
  unit,
  color = 'text-gray-400 dark:text-gray-500 dark:text-gray-400',
}: {
  icon: React.ElementType
  label: string
  value: string | number
  unit?: string
  color?: string
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
    <Icon className={cn('w-5 h-5', color)} />
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-xs">{label}</p>
      <p className="text-white dark:text-gray-100 font-medium">
        {value}
        {unit && <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">{unit}</span>}
      </p>
    </div>
  </div>
)

export default function WeatherAdminPage() {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchCity, setSearchCity] = useState('杭州')
  const [currentCity, setCurrentCity] = useState('杭州')
  const [recentCities, setRecentCities] = useState<string[]>([])

  const fetchWeather = useCallback(
    async (city: string, showToast = false) => {
      try {
        setLoading(true)
        const response = await adminApi.get<WeatherResponse>('/weather/current', {
          params: { city },
        })

        if (response.data.success) {
          setWeatherData(response.data)
          setCurrentCity(city)

          setRecentCities(prev => {
            const filtered = prev.filter(c => c !== city)
            const updated = [city, ...filtered].slice(0, 5)
            localStorage.setItem('recentWeatherCities', JSON.stringify(updated))
            return updated
          })

          if (showToast) toast.success(`已获取 ${city} 天气数据`)
        } else {
          toast.error(response.data.message || '获取天气数据失败')
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error)
        toast.error('获取天气数据失败')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const saved = localStorage.getItem('recentWeatherCities')
    if (saved) {
      try {
        const cities = JSON.parse(saved)
        setRecentCities(cities)
        if (cities.length > 0) {
          setSearchCity(cities[0])
        }
      } catch {
        setRecentCities([])
      }
    }
    fetchWeather(searchCity)
  }, [fetchWeather])

  const handleSearch = () => {
    if (searchCity.trim()) {
      fetchWeather(searchCity.trim(), true)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const current = weatherData?.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white dark:text-gray-100">天气管理</h1>
          <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1">查看城市天气信息</p>
        </div>
        <Button
          variant="glass"
          onClick={() => fetchWeather(currentCity, true)}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          刷新
        </Button>
      </div>

      <GlassCardAdmin className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="输入城市名称..."
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2.5 bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg text-white dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-tech-cyan transition-colors"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            查询
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">热门城市:</span>
          {POPULAR_CITIES.map(city => (
            <button
              key={city.name}
              onClick={() => {
                setSearchCity(city.name)
                fetchWeather(city.name, true)
              }}
              className={cn(
                'px-3 py-1 rounded-full text-sm transition-colors cursor-pointer',
                currentCity === city.name
                  ? 'bg-tech-cyan text-white dark:text-gray-100'
                  : 'bg-white/5 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:bg-white/10 hover:text-white dark:text-gray-100'
              )}
            >
              {city.name}
            </button>
          ))}
        </div>

        {recentCities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">最近查询:</span>
            {recentCities.map(city => (
              <button
                key={city}
                onClick={() => {
                  setSearchCity(city)
                  fetchWeather(city, true)
                }}
                className="px-3 py-1 rounded-full text-sm bg-white/5 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:bg-white/10 hover:text-white dark:text-gray-100 transition-colors cursor-pointer"
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </GlassCardAdmin>

      {loading && !weatherData && (
        <GlassCardAdmin className="p-6">
          <LoadingState message="获取天气数据..." />
        </GlassCardAdmin>
      )}

      <AnimatePresence mode="wait">
        {weatherData && !loading && (
          <motion.div
            key={currentCity}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {current ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <GlassCardAdmin className="p-6 lg:col-span-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {current.province} · {current.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {getWeatherIcon(current.weather_code)}
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-5xl font-bold text-white dark:text-gray-100">{current.temp}</span>
                              <span className="text-2xl text-gray-400 dark:text-gray-500 dark:text-gray-400">°C</span>
                            </div>
                            <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1">{current.weather}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Thermometer className="w-4 h-4" />
                            {current.min_temp}° ~ {current.max_temp}°
                          </span>
                          <span className="flex items-center gap-1">
                            <Wind className="w-4 h-4" />
                            {current.wind} {current.wind_power}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1 justify-end">
                          <Calendar className="w-4 h-4" />
                          {current.date}
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Clock className="w-4 h-4" />
                          {current.update_time}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                      <MetricItem
                        icon={Droplets}
                        label="湿度"
                        value={current.humidity}
                        unit="%"
                        color="text-blue-400"
                      />
                      <MetricItem
                        icon={Eye}
                        label="能见度"
                        value={current.visibility}
                        color="text-cyan-400"
                      />
                      <MetricItem
                        icon={Gauge}
                        label="气压"
                        value={current.pressure}
                        color="text-purple-400"
                      />
                      <MetricItem
                        icon={Wind}
                        label="风速"
                        value={current.wind_speed}
                        color="text-gray-400 dark:text-gray-500 dark:text-gray-400"
                      />
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 dark:text-gray-400">
                        <Sunrise className="w-5 h-5 text-orange-400" />
                        <span className="text-sm">日出 {current.sunrise}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 dark:text-gray-400">
                        <Sunset className="w-5 h-5 text-orange-300" />
                        <span className="text-sm">日落 {current.sunset}</span>
                      </div>
                    </div>
                  </GlassCardAdmin>

                  <GlassCardAdmin className="p-6">
                    <h3 className="text-lg font-semibold text-white dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-tech-cyan" />
                      空气质量
                    </h3>
                    {current.aqi ? (
                      <div className="space-y-4">
                        <div
                          className={cn(
                            'p-4 rounded-lg border text-center',
                            getAQIColor(current.aqi.air_level)
                          )}
                        >
                          <p className="text-3xl font-bold">{current.aqi.air}</p>
                          <p className="text-sm mt-1">{current.aqi.air_level}</p>
                        </div>
                        <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm">{current.aqi.air_tips}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between p-2 bg-white/5 rounded">
                            <span className="text-gray-500 dark:text-gray-400">PM2.5</span>
                            <span className="text-white dark:text-gray-100">{current.aqi.pm25}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-white/5 rounded">
                            <span className="text-gray-500 dark:text-gray-400">PM10</span>
                            <span className="text-white dark:text-gray-100">{current.aqi.pm10}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-white/5 rounded">
                            <span className="text-gray-500 dark:text-gray-400">CO</span>
                            <span className="text-white dark:text-gray-100">{current.aqi.co}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-white/5 rounded">
                            <span className="text-gray-500 dark:text-gray-400">NO2</span>
                            <span className="text-white dark:text-gray-100">{current.aqi.no2}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-white/5 rounded">
                            <span className="text-gray-500 dark:text-gray-400">SO2</span>
                            <span className="text-white dark:text-gray-100">{current.aqi.so2}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-white/5 rounded">
                            <span className="text-gray-500 dark:text-gray-400">O3</span>
                            <span className="text-white dark:text-gray-100">{current.aqi.o3}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400">暂无空气质量数据</p>
                    )}
                  </GlassCardAdmin>
                </div>

                {current.alarm && current.alarm.length > 0 && (
                  <GlassCardAdmin className="p-4 border-yellow-500/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-yellow-400 font-medium">天气预警</h4>
                        <div className="mt-2 space-y-2">
                          {current.alarm.map((alarm, index) => (
                            <div key={index} className="text-sm">
                              <span className="text-white dark:text-gray-100">{alarm.title}</span>
                              <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400 ml-2">
                                ({alarm.type} - {alarm.level})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCardAdmin>
                )}

                {current.hour && current.hour.length > 0 && (
                  <GlassCardAdmin className="p-6">
                    <h3 className="text-lg font-semibold text-white dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-tech-cyan" />
                      24小时预报
                    </h3>
                    <div className="overflow-x-auto">
                      <div className="flex gap-4 min-w-max pb-2">
                        {current.hour.slice(0, 12).map((hour, index) => (
                          <div
                            key={index}
                            className="flex flex-col items-center p-3 rounded-lg bg-white/5 min-w-[80px]"
                          >
                            <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm">{hour.time}</span>
                            <div className="my-2">{getWeatherIcon(hour.weather, 'w-8 h-8')}</div>
                            <span className="text-white dark:text-gray-100 font-medium">{hour.temp}°</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCardAdmin>
                )}

                {current.index && current.index.length > 0 && (
                  <GlassCardAdmin className="p-6">
                    <h3 className="text-lg font-semibold text-white dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-tech-cyan" />
                      生活指数
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {current.index.slice(0, 8).map((item, index) => (
                        <div key={index} className="p-3 rounded-lg bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/5">
                          <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm">{item.name}</p>
                          <p className="text-white dark:text-gray-100 font-medium mt-1">{item.level}</p>
                          {item.tips && (
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">{item.tips}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </GlassCardAdmin>
                )}
              </>
            ) : (
              <GlassCardAdmin className="p-6">
                <div className="text-center py-8">
                  <Cloud className="w-12 h-12 text-gray-400 dark:text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400">{weatherData.message || '未获取到天气数据'}</p>
                </div>
              </GlassCardAdmin>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
