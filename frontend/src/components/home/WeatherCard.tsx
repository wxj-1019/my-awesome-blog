'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  CloudLightning,
  CloudFog,
  Loader2,
  MapPin,
  Droplets,
  Wind,
  RefreshCw,
  Thermometer,
  Gauge,
  WindIcon,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import {
  backendWeatherService,
  type BackendWeatherData,
} from '@/services/backendWeatherService';
import { cn } from '@/lib/utils';

/** 收起 → 展开：统一时长，避免多阶段 setTimeout 造成不规则形变 */
const MORPH_MS = 420;

export default function WeatherCard() {
  const [weather, setWeather] = useState<BackendWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  /** 展开内容延迟挂载，等外壳 morph 过半再淡入，收起时先淡出再收壳 */
  const [showDetails, setShowDetails] = useState(false);
  const city = '杭州';
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const schedule = useCallback(
    (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timersRef.current.push(id);
    },
    []
  );

  const fetchWeather = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await backendWeatherService.getCurrentWeather(city);
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [city]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const toggleExpanded = () => {
    if (refreshing) return;
    clearTimers();

    if (!isExpanded) {
      setIsExpanded(true);
      // 外壳 morph 过半后再露出详情，避免圆角/尺寸跳变时内容挤压变形
      schedule(() => setShowDetails(true), Math.round(MORPH_MS * 0.45));
    } else {
      setShowDetails(false);
      schedule(() => setIsExpanded(false), Math.round(MORPH_MS * 0.35));
    }
  };

  const getWeatherIcon = (size: 'sm' | 'md' = 'sm') => {
    if (!weather) return null;
    const cls = size === 'md' ? 'w-6 h-6' : 'w-5 h-5';
    const weatherText = weather.weather.toLowerCase();

    if (weatherText.includes('晴')) {
      return <Sun className={cn(cls, 'text-yellow-400')} />;
    }
    if (weatherText.includes('多云') || weatherText.includes('阴')) {
      return <Cloud className={cn(cls, 'text-gray-300')} />;
    }
    if (weatherText.includes('雨')) {
      return <CloudRain className={cn(cls, 'text-blue-400')} />;
    }
    if (weatherText.includes('雪')) {
      return <Snowflake className={cn(cls, 'text-white')} />;
    }
    if (weatherText.includes('雷')) {
      return <CloudLightning className={cn(cls, 'text-yellow-500')} />;
    }
    if (weatherText.includes('雾')) {
      return <CloudFog className={cn(cls, 'text-gray-400')} />;
    }

    return <Sun className={cn(cls, 'text-yellow-400')} />;
  };

  const getAQILevel = () => {
    if (!weather?.airQuality) return { level: '未知', color: 'text-gray-400' };
    const aqi = parseInt(weather.airQuality.replace(/\D/g, ''), 10);

    if (aqi <= 50) return { level: '优', color: 'text-green-400' };
    if (aqi <= 100) return { level: '良', color: 'text-yellow-400' };
    if (aqi <= 150) return { level: '轻度', color: 'text-orange-400' };
    if (aqi <= 200) return { level: '中度', color: 'text-red-400' };
    return { level: '重度', color: 'text-red-600' };
  };

  const formatUpdateTime = () => {
    if (!weather?.updateTime) return '--:--';
    try {
      const timeStr = weather.updateTime.split(' ')[1] || weather.updateTime;
      const [h, m] = timeStr.split(':');
      return `${h}:${m}`;
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-fade-in-up">
      <GlassCard
        padding="none"
        hoverEffect={false}
        className={cn(
          'cursor-pointer overflow-hidden',
          /* 统一 ease：宽高、圆角、内边距同一条曲线，避免多阶段类名切换 */
          'transition-[width,height,max-height,border-radius,padding,box-shadow] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          'motion-reduce:transition-none motion-reduce:animate-none',
          isExpanded
            ? 'w-[min(20rem,calc(100vw-2rem))] max-h-[28rem] rounded-2xl p-4 shadow-2xl'
            : [
                'w-20 h-20 max-h-20 rounded-full p-0',
                'flex items-center justify-center',
                'animate-glass-float shadow-lg',
                'hover:shadow-xl hover:scale-[1.04]',
                'motion-reduce:hover:scale-100',
              ]
        )}
        onClick={(e) => {
          e.stopPropagation();
          toggleExpanded();
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? '收起天气详情' : '展开天气详情'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
      >
        {loading ? (
          <div
            className={cn(
              'flex flex-col items-center justify-center',
              isExpanded ? 'py-6 gap-2' : ''
            )}
          >
            <Loader2
              className={cn(
                'text-tech-cyan animate-spin',
                isExpanded ? 'w-8 h-8' : 'w-6 h-6'
              )}
            />
            {showDetails && (
              <p className="text-sm text-muted-foreground">加载中...</p>
            )}
          </div>
        ) : error ? (
          <div
            className={cn(
              'text-center',
              isExpanded ? 'py-4 px-2' : 'flex items-center justify-center'
            )}
          >
            <Cloud
              className={cn(
                'text-gray-400 mx-auto',
                isExpanded ? 'w-8 h-8 mb-2' : 'w-6 h-6'
              )}
            />
            {showDetails && (
              <>
                <p className="text-xs text-muted-foreground mb-2">{error}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchWeather();
                  }}
                  className="text-xs text-tech-cyan hover:text-tech-lightcyan transition-colors"
                >
                  重试
                </button>
              </>
            )}
          </div>
        ) : weather ? (
          <>
            {/* 收起态：圆形胶囊，仅图标 + 温度 */}
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-0.5',
                'transition-opacity duration-200 ease-out',
                'motion-reduce:transition-none',
                isExpanded
                  ? 'absolute inset-0 opacity-0 pointer-events-none'
                  : 'relative opacity-100'
              )}
              aria-hidden={isExpanded}
            >
              <div className="scale-125">{getWeatherIcon('sm')}</div>
              <p className="text-[11px] font-semibold text-white leading-none tabular-nums">
                {weather.temperature}°
              </p>
            </div>

            {/* 展开态：详情面板，固定圆角，随 max-height 展开 */}
            <div
              className={cn(
                'transition-opacity duration-300 ease-out',
                'motion-reduce:transition-none',
                showDetails
                  ? 'relative opacity-100'
                  : 'absolute inset-0 opacity-0 pointer-events-none h-0 overflow-hidden'
              )}
              aria-hidden={!showDetails}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getWeatherIcon('md')}
                    <div>
                      <p className="text-3xl font-bold text-white tabular-nums">
                        {weather.temperature}°
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {weather.weather}
                      </p>
                    </div>
                  </div>
                  {refreshing ? (
                    <Loader2 className="w-5 h-5 text-tech-cyan animate-spin" />
                  ) : (
                    <RefreshCw
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchWeather();
                      }}
                      className={cn(
                        'w-5 h-5 text-muted-foreground transition-[colors,transform]',
                        'hover:text-tech-cyan hover:rotate-180'
                      )}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[160px]">
                    {weather.city}, {weather.province}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-glass-border/30">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">温度</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-white tabular-nums">
                          {weather.temperature}°
                        </p>
                        {weather.tempMin && weather.tempMax && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {weather.tempMin}° ~ {weather.tempMax}°
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">风向</p>
                      <p className="text-sm font-semibold text-white">
                        {weather.windDirection}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-glass-border/30">
                  <div className="flex flex-col items-center gap-1">
                    <WindIcon className="w-3 h-3 text-blue-400" />
                    <p className="text-[10px] text-muted-foreground">风速</p>
                    <p className="text-sm font-semibold text-white">
                      {weather.windSpeed}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    <p className="text-[10px] text-muted-foreground">湿度</p>
                    <p className="text-sm font-semibold text-white">
                      {weather.humidity}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Gauge className="w-3 h-3 text-green-400" />
                    <p className="text-[10px] text-muted-foreground">气压</p>
                    <p className="text-sm font-semibold text-white">
                      {weather.pressure}
                    </p>
                  </div>
                </div>

                {weather.airQuality && (
                  <div className="pt-3 border-t border-glass-border/30">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">
                        空气质量
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-white">
                          {weather.airQuality}
                        </span>
                        <span className={cn('text-xs', getAQILevel().color)}>
                          ({getAQILevel().level})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-glass-border/30 text-[10px] text-muted-foreground">
                  <span>{weather.isDaytime ? '白天' : '夜间'}</span>
                  <span>更新: {formatUpdateTime()}</span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </GlassCard>
    </div>
  );
}
