'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion'
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
  if (isNaN(code)) {return <Cloud className={cn(size, 'text-muted-foreground')} />}

  if (code === 0 || code === 1) {return <Sun className={cn(size, 'text-warning')} />}
  if (code === 2 || code === 3) {return <CloudSun className={cn(size, 'text-warning')} />}
  if (code >= 4 && code <= 9) {return <Cloud className={cn(size, 'text-muted-foreground')} />}
  if (code >= 10 && code <= 19) {return <CloudRain className={cn(size, 'text-cat-1')} />}
  if (code >= 20 && code <= 25) {return <CloudSnow className={cn(size, 'text-cat-1')} />}
  if (code >= 26 && code <= 29) {return <CloudFog className={cn(size, 'text-muted-foreground')} />}
  if (code >= 30 && code <= 39) {return <Wind className={cn(size, 'text-cat-3')} />}
  if (code >= 40 && code === 49) {return <CloudFog className={cn(size, 'text-muted-foreground')} />}
  if (code >= 50) {return <CloudRain className={cn(size, 'text-cat-1')} />}

  return <Cloud className={cn(size, 'text-muted-foreground')} />
}

const getAQIColor = (level: string) => {
  switch (level) {
    case '优':
      return 'text-success bg-success/20 border-success/30'
    case '良':
      return 'text-warning bg-warning/20 border-warning/30'
    case '轻度污染':
      return 'text-warning bg-warning/20 border-warning/30'
    case '中度污染':
      return 'text-destructive bg-destructive/20 border-destructive/30'
    case '重度污染':
      return 'text-cat-2 bg-cat-2/20 border-cat-2/30'
    case '严重污染':
      return 'text-destructive bg-destructive/20 border-destructive/30'
    default:
      return 'text-muted-foreground bg-muted-foreground/20 border-muted-foreground/30'
  }
}

const MetricItem = ({
  icon: Icon,
  label,
  value,
  unit,
  color = 'text-muted-foreground',
}: {
  icon: React.ElementType
  label: string
  value: string | number
  unit?: string
  color?: string
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-foreground/5">
    <Icon className={cn('w-5 h-5', color)} />
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-foreground font-medium">
        {value}
        {unit && <span className="text-muted-foreground text-sm ml-1">{unit}</span>}
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

        if (response.success) {
          setWeatherData(response)
          setCurrentCity(city)

          setRecentCities(prev => {
            const filtered = prev.filter(c => c !== city)
            const updated = [city, ...filtered].slice(0, 5)
            localStorage.setItem('recentWeatherCities', JSON.stringify(updated))
            return updated
          })

          if (showToast) {toast.success(`已获取 ${city} 天气数据`)}
        } else {
          toast.error(response.message || '获取天气数据失败')
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

  // searchCity 仅用于初始化加载，加入依赖会导致输入过程中重复请求天气
   
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
    // searchCity 仅用于初始化加载，加入依赖会导致输入过程中重复请求天气
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <h1 className="text-2xl font-bold text-foreground">天气管理</h1>
          <p className="text-muted-foreground mt-1">查看城市天气信息</p>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="输入城市名称..."
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2.5 bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-tech-cyan transition-colors"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            查询
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-muted-foreground text-sm">热门城市:</span>
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
                  ? 'bg-tech-cyan text-foreground'
                  : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
              )}
            >
              {city.name}
            </button>
          ))}
        </div>

        {recentCities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-muted-foreground text-sm">最近查询:</span>
            {recentCities.map(city => (
              <button
                key={city}
                onClick={() => {
                  setSearchCity(city)
                  fetchWeather(city, true)
                }}
                className="px-3 py-1 rounded-full text-sm bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
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
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {current.province} · {current.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {getWeatherIcon(current.weather_code)}
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-5xl font-bold text-foreground">{current.temp}</span>
                              <span className="text-2xl text-muted-foreground">°C</span>
                            </div>
                            <p className="text-muted-foreground mt-1">{current.weather}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
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
                      <div className="text-right text-sm text-muted-foreground">
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
                        color="text-cat-1"
                      />
                      <MetricItem
                        icon={Eye}
                        label="能见度"
                        value={current.visibility}
                        color="text-cat-3"
                      />
                      <MetricItem
                        icon={Gauge}
                        label="气压"
                        value={current.pressure}
                        color="text-cat-2"
                      />
                      <MetricItem
                        icon={Wind}
                        label="风速"
                        value={current.wind_speed}
                        color="text-muted-foreground"
                      />
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Sunrise className="w-5 h-5 text-warning" />
                        <span className="text-sm">日出 {current.sunrise}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Sunset className="w-5 h-5 text-warning" />
                        <span className="text-sm">日落 {current.sunset}</span>
                      </div>
                    </div>
                  </GlassCardAdmin>

                  <GlassCardAdmin className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
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
                        <p className="text-muted-foreground text-sm">{current.aqi.air_tips}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between p-2 bg-foreground/5 rounded">
                            <span className="text-muted-foreground">PM2.5</span>
                            <span className="text-foreground">{current.aqi.pm25}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-foreground/5 rounded">
                            <span className="text-muted-foreground">PM10</span>
                            <span className="text-foreground">{current.aqi.pm10}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-foreground/5 rounded">
                            <span className="text-muted-foreground">CO</span>
                            <span className="text-foreground">{current.aqi.co}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-foreground/5 rounded">
                            <span className="text-muted-foreground">NO2</span>
                            <span className="text-foreground">{current.aqi.no2}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-foreground/5 rounded">
                            <span className="text-muted-foreground">SO2</span>
                            <span className="text-foreground">{current.aqi.so2}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-foreground/5 rounded">
                            <span className="text-muted-foreground">O3</span>
                            <span className="text-foreground">{current.aqi.o3}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">暂无空气质量数据</p>
                    )}
                  </GlassCardAdmin>
                </div>

                {current.alarm && current.alarm.length > 0 && (
                  <GlassCardAdmin className="p-4 border-warning/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-warning font-medium">天气预警</h4>
                        <div className="mt-2 space-y-2">
                          {current.alarm.map((alarm) => (
                            <div key={`${alarm.title}-${alarm.type}-${alarm.level}`} className="text-sm">
                              <span className="text-foreground">{alarm.title}</span>
                              <span className="text-muted-foreground ml-2">
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
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-tech-cyan" />
                      24小时预报
                    </h3>
                    <div className="overflow-x-auto">
                      <div className="flex gap-4 min-w-max pb-2">
                        {current.hour.slice(0, 12).map((hour) => (
                          <div
                            key={hour.time}
                            className="flex flex-col items-center p-3 rounded-lg bg-foreground/5 min-w-[80px]"
                          >
                            <span className="text-muted-foreground text-sm">{hour.time}</span>
                            <div className="my-2">{getWeatherIcon(hour.weather, 'w-8 h-8')}</div>
                            <span className="text-foreground font-medium">{hour.temp}°</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCardAdmin>
                )}

                {current.index && current.index.length > 0 && (
                  <GlassCardAdmin className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-tech-cyan" />
                      生活指数
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {current.index.slice(0, 8).map((item) => (
                        <div key={item.name} className="p-3 rounded-lg bg-foreground/5 border border-foreground/10">
                          <p className="text-muted-foreground text-sm">{item.name}</p>
                          <p className="text-foreground font-medium mt-1">{item.level}</p>
                          {item.tips && (
                            <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{item.tips}</p>
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
                  <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{weatherData.message || '未获取到天气数据'}</p>
                </div>
              </GlassCardAdmin>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
