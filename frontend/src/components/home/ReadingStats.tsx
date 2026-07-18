'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Clock, TrendingUp, Target, Eye, Heart, Calendar, MessageSquare } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import GlassCard from '@/components/ui/GlassCard'
import { cn } from '@/lib/utils'
import { getPublicStatistics, type PublicStatisticsOverview } from '@/services/statisticsService'

const FALLBACK_HEATMAP = Array.from({ length: 49 }, (_, index) => ({
  week: Math.floor(index / 7),
  day: index % 7,
  count: 0,
  date: '',
}))

const FALLBACK_READING_TREND = [
  { month: '1月', articles: 0, time: 0, likes: 0 },
  { month: '2月', articles: 0, time: 0, likes: 0 },
  { month: '3月', articles: 0, time: 0, likes: 0 },
  { month: '4月', articles: 0, time: 0, likes: 0 },
  { month: '5月', articles: 0, time: 0, likes: 0 },
  { month: '6月', articles: 0, time: 0, likes: 0 },
]

const categoryPreferenceData = [
  { category: '前端开发', hours: 45, percentage: 35, color: '#06b6d4' },
  { category: '后端开发', hours: 32, percentage: 25, color: '#8b5cf6' },
  { category: 'DevOps', hours: 20, percentage: 16, color: '#10b981' },
  { category: '设计', hours: 18, percentage: 14, color: '#f59e0b' },
  { category: '其他', hours: 12, percentage: 10, color: '#6b7280' }
]

function HeatmapCell({ count, date }: { count: number; date: string }) {
  const getIntensity = (count: number) => {
    if (count === 0) {return 'bg-gray-800/50 dark:bg-gray-900/50'}
    if (count < 3) {return 'bg-tech-cyan/30'}
    if (count < 6) {return 'bg-tech-cyan/60'}
    if (count < 9) {return 'bg-tech-cyan/80'}
    return 'bg-tech-cyan'
  }

  return (
    <div
      className={cn(
        'w-6 h-6 sm:w-8 sm:h-8 rounded-sm',
        'transition-all duration-200',
        'hover:scale-125 hover:shadow-lg',
        'cursor-pointer',
        getIntensity(count)
      )}
      title={`${date}: ${count}篇文章`}
      role="gridcell"
      aria-label={`${date}阅读${count}篇文章`}
    />
  )
}

export default function ReadingStats() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'trends'>('overview')
  const [publicStats, setPublicStats] = useState<PublicStatisticsOverview | null>(null)

  useEffect(() => {
    void getPublicStatistics().then(setPublicStats)
  }, [])

  const readingTrendData = useMemo(() => {
    if (!publicStats?.monthly_stats.length) {
      return FALLBACK_READING_TREND
    }
    return publicStats.monthly_stats.map((item) => ({
      month: `${item.month}月`,
      articles: item.articles,
      time: 0,
      likes: 0,
    }))
  }, [publicStats])

  const heatmapData = useMemo(() => {
    if (!publicStats?.daily_articles.length) {
      return FALLBACK_HEATMAP
    }
    const counts = new Map(publicStats.daily_articles.map((item) => [item.date, item.count]))
    return Array.from({ length: 49 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (48 - index))
      const key = date.toISOString().slice(0, 10)
      return {
        week: Math.floor(index / 7),
        day: date.getDay(),
        count: counts.get(key) ?? 0,
        date: key,
      }
    })
  }, [publicStats])

  const readingStats = [
    { label: '已发布文章', value: String(publicStats?.total_articles ?? 0), unit: '篇', icon: BookOpen, color: 'from-tech-cyan to-tech-sky' },
    { label: '累计阅读', value: String(publicStats?.total_views ?? 0), unit: '次', icon: Eye, color: 'from-purple-500 to-pink-500' },
    { label: '读者评论', value: String(publicStats?.total_comments ?? 0), unit: '条', icon: MessageSquare, color: 'from-yellow-500 to-orange-500' },
    { label: '数据来源', value: publicStats ? '实时' : '暂无', unit: '公开统计', icon: Heart, color: 'from-red-500 to-pink-500' },
  ]

  const periods = [
    { id: 'week' as const, label: '本周' },
    { id: 'month' as const, label: '本月' },
    { id: 'year' as const, label: '全年' }
  ]

  const tabs = [
    { id: 'overview' as const, label: '概览', icon: Eye },
    { id: 'heatmap' as const, label: '热力图', icon: Calendar },
    { id: 'trends' as const, label: '趋势', icon: TrendingUp }
  ]

  return (
    <GlassCard className="relative overflow-hidden rounded-2xl p-5 sm:p-6 md:p-7" aria-label="阅读统计">
      <div data-testid="reading-cockpit-layer" className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(6,182,212,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,.45)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tech-cyan/70 to-transparent" />
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full border border-tech-cyan/10 shadow-[0_0_80px_rgba(6,182,212,.12)]" />
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-tech-cyan to-tech-sky">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">内容统计</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {publicStats ? '基于公开聚合数据' : '暂无真实数据，图表显示为 0'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={cn(
                'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200',
                selectedPeriod === period.id
                  ? 'bg-tech-cyan text-white shadow-lg shadow-tech-cyan/30'
                  : 'text-muted-foreground hover:bg-gray-800/50 hover:text-foreground'
              )}
              aria-label={`切换到${period.label}数据`}
              aria-pressed={selectedPeriod === period.id}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 mb-5">
        <div className="flex items-center gap-2 border-b border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors relative',
                  activeTab === tab.id
                    ? 'text-tech-cyan'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label={`查看${tab.label}数据`}
                aria-pressed={activeTab === tab.id}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tech-cyan rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {readingStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className={cn(
                    'p-3 sm:p-4 rounded-xl',
                    'bg-gradient-to-br',
                    stat.color,
                    'text-white'
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 mb-1.5 sm:mb-2 opacity-80" />
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm opacity-80">
                    {stat.unit}
                  </div>
                  <div className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 opacity-70">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-xl bg-glass/20 border border-glass-border">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3">分类偏好（示例）</h4>
              <div className="space-y-2.5 sm:space-y-3">
                {categoryPreferenceData.map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                      <span className="text-foreground">{item.category}</span>
                      <span className="text-muted-foreground">{item.hours}h ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-glass/20 border border-glass-border">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3">内容目标（示例）</h4>
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-tech-cyan" />
                    <span className="text-foreground">阅读文章</span>
                  </div>
                  <span className="text-tech-cyan font-bold text-xs sm:text-sm">18/20</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                  <div className="h-full bg-tech-cyan rounded-full" style={{ width: '90%' }} />
                </div>
                <div className="flex items-center justify-between mt-2 sm:mt-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-tech-cyan" />
                    <span className="text-foreground">阅读时长</span>
                  </div>
                  <span className="text-tech-cyan font-bold text-xs sm:text-sm">45/60h</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                  <div className="h-full bg-tech-cyan rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="p-3.5 sm:p-4 rounded-xl bg-glass/20 border border-glass-border">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">阅读热力图</h4>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <span>少</span>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-tech-cyan/30" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-tech-cyan/60" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-tech-cyan/80" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-tech-cyan" />
                </div>
                <span>多</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                <div key={day} className="text-[10px] sm:text-xs text-center text-muted-foreground mb-1.5 sm:mb-2">
                  {day}
                </div>
              ))}

              {heatmapData.map((item) => (
                <HeatmapCell key={`${item.week}-${item.day}`} count={item.count} date={item.date} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="p-3.5 sm:p-4 rounded-xl bg-glass/20 border border-glass-border">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3 sm:mb-4">阅读趋势</h4>

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={readingTrendData}>
                <defs>
                  <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area
                  type="monotone"
                  dataKey="articles"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorArticles)"
                  name="文章数"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
