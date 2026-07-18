'use client'

import { TrendingUp, Activity, FileText, Eye, ArrowUp, ArrowDown, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Area, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { FadeIn } from '@/components/motion'
import type { PublicStatisticsOverview } from './types'

const FALLBACK_MONTHLY = [
  { month: '1月', articles: 8, views: 12450, likes: 320 },
  { month: '2月', articles: 12, views: 18920, likes: 485 },
  { month: '3月', articles: 15, views: 24680, likes: 620 },
  { month: '4月', articles: 10, views: 21340, likes: 540 },
  { month: '5月', articles: 18, views: 28750, likes: 780 },
  { month: '6月', articles: 22, views: 34560, likes: 950 },
]

const FALLBACK_WEEKLY = [
  { day: '周一', visitors: 145, engagement: 78 },
  { day: '周二', visitors: 168, engagement: 85 },
  { day: '周三', visitors: 152, engagement: 72 },
  { day: '周四', visitors: 178, engagement: 90 },
  { day: '周五', visitors: 165, engagement: 82 },
  { day: '周六', visitors: 132, engagement: 65 },
  { day: '周日', visitors: 128, engagement: 60 },
]

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const

function buildMonthlyChartData(stats: PublicStatisticsOverview | null) {
  if (!stats?.monthly_stats?.length) {
    return { data: FALLBACK_MONTHLY, isFallback: true as const }
  }
  const data = stats.monthly_stats.map((item) => ({
    month: `${item.month}月`,
    articles: item.articles,
    views: item.views,
    likes: 0,
  }))
  return { data, isFallback: false as const }
}

function buildWeeklyChartData(stats: PublicStatisticsOverview | null) {
  if (!stats) {
    return { data: FALLBACK_WEEKLY, isFallback: true as const }
  }
  const articleByDate = new Map(
    (stats.daily_articles ?? []).map((d) => [d.date, d.count])
  )
  const commentByDate = new Map(
    (stats.daily_comments ?? []).map((d) => [d.date, d.count])
  )
  // 最近 7 天（含今天），无数据补 0
  const days: { day: string; visitors: number; engagement: number }[] = []
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    // 兼容后端可能返回的 date 字符串格式
    const articles =
      articleByDate.get(iso) ??
      articleByDate.get(String(d.toLocaleDateString('en-CA'))) ??
      0
    const comments =
      commentByDate.get(iso) ??
      commentByDate.get(String(d.toLocaleDateString('en-CA'))) ??
      0
    days.push({
      day: DAY_LABELS[d.getDay()],
      // 公开接口暂无真实 UV，用「当日发文 + 评论」作为活跃度代理指标
      visitors: articles + comments,
      engagement: comments,
    })
  }
  const hasAny = days.some((x) => x.visitors > 0 || x.engagement > 0)
  if (!hasAny) {
    return { data: FALLBACK_WEEKLY, isFallback: true as const }
  }
  return { data: days, isFallback: false as const }
}


export function StatsCharts({ stats }: { stats: PublicStatisticsOverview | null }) {
  const { data: monthlyStatsData, isFallback: monthlyFallback } = buildMonthlyChartData(stats)
  const { data: weeklyActivityData, isFallback: weeklyFallback } = buildWeeklyChartData(stats)

  const monthlyTotal = monthlyStatsData.reduce((sum, item) => sum + item.articles, 0)
  const monthlyViewsTotal = monthlyStatsData.reduce((sum, item) => sum + item.views, 0)
  const monthlyAvg = monthlyStatsData.length
    ? Math.round(monthlyTotal / monthlyStatsData.length)
    : 0
  const firstMonth = monthlyStatsData[0]?.articles ?? 0
  const lastMonth = monthlyStatsData[monthlyStatsData.length - 1]?.articles ?? 0
  const monthlyGrowth =
    firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0

  const weeklyVisitorsTotal = weeklyActivityData.reduce((sum, item) => sum + item.visitors, 0)
  const weeklyAvg = weeklyActivityData.length
    ? Math.round(weeklyVisitorsTotal / weeklyActivityData.length)
    : 0
  const peakDay = weeklyActivityData.reduce(
    (max, item) => (item.visitors > max.visitors ? item : max),
    weeklyActivityData[0] ?? { day: '-', visitors: 0, engagement: 0 }
  )
  const engagementRate =
    weeklyVisitorsTotal > 0
      ? Math.round(
          (weeklyActivityData.reduce((sum, item) => sum + item.engagement, 0) /
            weeklyVisitorsTotal) *
            100
        )
      : 0

  const overviewLabel =
    stats && !monthlyFallback
      ? `文章 ${stats.total_articles} · 阅读 ${stats.total_views} · 评论 ${stats.total_comments}`
      : monthlyFallback
        ? '示例数据'
        : '真实数据'

  return (
    <FadeIn>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="glass-card backdrop-blur-xl bg-card/40 border-glass-border p-5 sm:p-6 overflow-hidden hover:shadow-[0_0_40px_var(--shadow-tech-cyan),0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <motion.div 
              className="p-2 rounded-lg bg-tech-cyan/20"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <TrendingUp className="w-5 h-5 text-tech-cyan" />
            </motion.div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">月度统计</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-glass/30 px-3 py-1.5 rounded-full border border-glass-border/50">
            <Activity className="w-3.5 h-3.5" />
            <span title={overviewLabel}>
              {monthlyFallback ? '示例 · 6个月' : '近6个月'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <motion.div 
            className="p-3 rounded-xl bg-glass/30 border border-glass-border/50 text-center"
            whileHover={{ y: -3, borderColor: 'rgba(6, 182, 212, 0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <FileText className="w-3.5 h-3.5 text-tech-cyan" />
              <span className="text-[10px] text-muted-foreground">文章数</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-tech-cyan">
              {monthlyTotal}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {monthlyGrowth >= 0 ? (
                <ArrowUp className="w-3 h-3 text-green-500" />
              ) : (
                <ArrowDown className="w-3 h-3 text-red-500" />
              )}
              <span className={`text-xs font-medium ${monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(monthlyGrowth).toFixed(1)}%
              </span>
            </div>
          </motion.div>

          <motion.div 
            className="p-3 rounded-xl bg-glass/30 border border-glass-border/50 text-center"
            whileHover={{ y: -3, borderColor: 'rgba(6, 182, 212, 0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[10px] text-muted-foreground">访问量</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-500">
              {(monthlyViewsTotal / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              月均 {Math.round(monthlyAvg)}
            </div>
          </motion.div>

          <motion.div 
            className="p-3 rounded-xl bg-glass/30 border border-glass-border/50 text-center"
            whileHover={{ y: -3, borderColor: 'rgba(6, 182, 212, 0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] text-muted-foreground">月均</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-orange-500">
              {monthlyAvg}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              稳定增长
            </div>
          </motion.div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyStatsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientArticles" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="rgba(255,255,255,0.1)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgba(255,255,255,0.5)' }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.1)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgba(255,255,255,0.5)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                padding: '8px 12px'
              }}
              itemStyle={{ color: '#06b6d4', fontWeight: 600 }}
            />
            <Bar 
              dataKey="articles" 
              fill="url(#gradientArticles)" 
              radius={[6, 6, 0, 0]} 
              name="文章数"
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="glass-card backdrop-blur-xl bg-card/40 border-glass-border p-5 sm:p-6 overflow-hidden hover:shadow-[0_0_40px_var(--shadow-tech-cyan),0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <motion.div 
              className="p-2 rounded-lg bg-tech-cyan/20"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Activity className="w-5 h-5 text-tech-cyan" />
            </motion.div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">周活跃度</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-glass/30 px-3 py-1.5 rounded-full border border-glass-border/50">
            <span>{weeklyFallback ? '示例数据' : '近7日活跃'}</span>
            <motion.span 
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <motion.div 
            className="p-3 rounded-xl bg-glass/30 border border-glass-border/50 text-center"
            whileHover={{ y: -3, borderColor: 'rgba(6, 182, 212, 0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-tech-cyan" />
              <span className="text-[10px] text-muted-foreground">
                {weeklyFallback ? '本周访客' : '本周活跃'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-tech-cyan">
              {weeklyVisitorsTotal}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              日均 {weeklyAvg}
            </div>
          </motion.div>

          <motion.div 
            className="p-3 rounded-xl bg-glass/30 border border-glass-border/50 text-center"
            whileHover={{ y: -3, borderColor: 'rgba(6, 182, 212, 0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-[10px] text-muted-foreground">互动率</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-pink-500">
              {engagementRate}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              高于平均
            </div>
          </motion.div>

          <motion.div 
            className="p-3 rounded-xl bg-glass/30 border border-glass-border/50 text-center"
            whileHover={{ y: -3, borderColor: 'rgba(6, 182, 212, 0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[10px] text-muted-foreground">峰值日</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-500">
              {peakDay.day}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {peakDay.visitors} 人
            </div>
          </motion.div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="rgba(255,255,255,0.1)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgba(255,255,255,0.5)' }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.1)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgba(255,255,255,0.5)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                padding: '8px 12px'
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gradientVisitors)"
              name="访客数"
              dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="engagement"
              stroke="#ec4899"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gradientEngagement)"
              name="互动数"
              dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
    </FadeIn>
  )
}

