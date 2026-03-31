'use client'

import { useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { BookOpen, Clock, TrendingUp, Target, Eye, Heart, MessageSquare, Calendar } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import GlassCard from '@/components/ui/GlassCard'
import { cn } from '@/lib/utils'
import ScrollReveal from './decorations/ScrollReveal'
import { staggerContainer, staggerItem, VIEWPORT } from '@/lib/animation-utils'

const heatmapData = [
  3, 1, 5, 7, 2, 4, 6, 8, 0, 3, 5, 9, 1, 4,
  2, 6, 8, 3, 5, 7, 1, 4, 9, 2, 6, 0, 3, 8,
  5, 1, 7, 4, 2, 9, 6, 3, 8, 0, 5, 7, 1, 4,
  6, 2, 3, 8, 5, 1, 9, 4, 7, 0, 6, 2, 3, 8
].map((count, i) => ({
  week: Math.floor(i / 7),
  day: i % 7,
  count,
  date: `2025-${Math.floor(i / 7) + 1}-${(i % 7) + 1}`
}))

const readingTrendData = [
  { month: '1月', articles: 12, time: 480, likes: 320 },
  { month: '2月', articles: 15, time: 600, likes: 450 },
  { month: '3月', articles: 18, time: 720, likes: 580 },
  { month: '4月', articles: 14, time: 560, likes: 420 },
  { month: '5月', articles: 20, time: 800, likes: 650 },
  { month: '6月', articles: 22, time: 880, likes: 720 }
]

const categoryPreferenceData = [
  { category: '前端开发', hours: 45, percentage: 35, color: '#06b6d4' },
  { category: '后端开发', hours: 32, percentage: 25, color: '#8b5cf6' },
  { category: 'DevOps', hours: 20, percentage: 16, color: '#10b981' },
  { category: '设计', hours: 18, percentage: 14, color: '#f59e0b' },
  { category: '其他', hours: 12, percentage: 10, color: '#6b7280' }
]

const readingStats = [
  { label: '总阅读时长', value: '45.2', unit: '小时', icon: Clock, color: 'from-tech-cyan to-tech-sky' },
  { label: '已读文章', value: '101', unit: '篇', icon: BookOpen, color: 'from-purple-500 to-pink-500' },
  { label: '平均评分', value: '4.5', unit: '分', icon: Star, color: 'from-yellow-500 to-orange-500' },
  { label: '收藏数', value: '68', unit: '个', icon: Heart, color: 'from-red-500 to-pink-500' }
]

function Star({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function HeatmapCell({ count, date, index }: { count: number; date: string; index: number }) {
  const prefersReducedMotion = useReducedMotion()
  
  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-800/50 dark:bg-gray-900/50'
    if (count < 3) return 'bg-tech-cyan/30'
    if (count < 6) return 'bg-tech-cyan/60'
    if (count < 9) return 'bg-tech-cyan/80'
    return 'bg-tech-cyan'
  }

  return (
    <motion.div
      className={cn(
        'w-6 h-6 sm:w-8 sm:h-8 rounded-sm',
        'transition-all duration-200',
        'cursor-pointer',
        getIntensity(count)
      )}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: prefersReducedMotion ? 0 : index * 0.01,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={prefersReducedMotion ? undefined : { 
        scale: 1.25, 
        boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)',
        transition: { duration: 0.2 }
      }}
      title={`${date}: ${count}篇文章`}
      role="gridcell"
      aria-label={`${date}阅读${count}篇文章`}
    />
  )
}

// 图表渐进显示动画包装组件
function AnimatedChart({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}

export default function ReadingStats() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'trends'>('overview')
  const prefersReducedMotion = useReducedMotion()

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
    <GlassCard className="rounded-2xl p-5 sm:p-6 md:p-7" aria-label="阅读统计">
      <ScrollReveal animation="slideDown">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-tech-cyan to-tech-sky"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">阅读统计</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">追踪你的阅读习惯</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {periods.map((period, index) => (
              <motion.button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={cn(
                  'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200',
                  selectedPeriod === period.id
                    ? 'bg-tech-cyan text-white shadow-lg shadow-tech-cyan/30'
                    : 'text-muted-foreground hover:bg-gray-800/50 hover:text-foreground'
                )}
                initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: prefersReducedMotion ? 0 : index * 0.1
                }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                aria-label={`切换到${period.label}数据`}
                aria-pressed={selectedPeriod === period.id}
              >
                {period.label}
              </motion.button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <div className="mb-5">
        <div className="flex items-center gap-2 border-b border-white/10">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors relative',
                  activeTab === tab.id
                    ? 'text-tech-cyan'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: prefersReducedMotion ? 0 : index * 0.1
                }}
                whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                aria-label={`查看${tab.label}数据`}
                aria-pressed={activeTab === tab.id}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-tech-cyan rounded-full"
                    layoutId="activeTabIndicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            className="space-y-5"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
              variants={staggerContainer(0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT.ONCE}
            >
              {readingStats.map((stat) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    className={cn(
                      'p-3 sm:p-4 rounded-xl',
                      'bg-gradient-to-br',
                      stat.color,
                      'text-white'
                    )}
                    variants={staggerItem}
                    whileHover={prefersReducedMotion ? undefined : { 
                      scale: 1.03, 
                      y: -4,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
                  </motion.div>
                )
              })}
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
              variants={staggerContainer(0.15)}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT.ONCE}
            >
              <motion.div 
                className="p-3.5 sm:p-4 rounded-xl bg-glass/20 border border-glass-border"
                variants={staggerItem}
                whileHover={prefersReducedMotion ? undefined : { 
                  y: -4, 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  borderColor: 'rgba(6, 182, 212, 0.3)'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3">分类偏好</h4>
                <div className="space-y-2.5 sm:space-y-3">
                  {categoryPreferenceData.map((item, index) => (
                    <motion.div 
                      key={item.category}
                      initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.4, 
                        delay: prefersReducedMotion ? 0 : index * 0.1 
                      }}
                    >
                      <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                        <span className="text-foreground">{item.category}</span>
                        <span className="text-muted-foreground">{item.hours}h ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={prefersReducedMotion ? false : { width: 0 }}
                          whileInView={{ width: `${item.percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ 
                            duration: 0.8, 
                            delay: prefersReducedMotion ? 0 : index * 0.1 + 0.2,
                            ease: [0.25, 0.1, 0.25, 1]
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                className="p-3.5 sm:p-4 rounded-xl bg-glass/20 border border-glass-border"
                variants={staggerItem}
                whileHover={prefersReducedMotion ? undefined : { 
                  y: -4, 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  borderColor: 'rgba(6, 182, 212, 0.3)'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3">本月目标</h4>
                <div className="space-y-2.5 sm:space-y-3">
                  {[
                    { icon: Target, label: '阅读文章', current: 18, total: 20, percentage: 90 },
                    { icon: Clock, label: '阅读时长', current: 45, total: 60, percentage: 75 }
                  ].map((goal, index) => (
                    <motion.div 
                      key={goal.label}
                      initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.4, 
                        delay: prefersReducedMotion ? 0 : index * 0.15 
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <goal.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-tech-cyan" />
                          <span className="text-foreground">{goal.label}</span>
                        </div>
                        <span className="text-tech-cyan font-bold text-xs sm:text-sm">
                          {goal.current}/{goal.total}{goal.label === '阅读时长' ? 'h' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5 sm:h-2 overflow-hidden mt-1">
                        <motion.div 
                          className="h-full bg-tech-cyan rounded-full"
                          initial={prefersReducedMotion ? false : { width: 0 }}
                          whileInView={{ width: `${goal.percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ 
                            duration: 1, 
                            delay: prefersReducedMotion ? 0 : index * 0.15 + 0.2,
                            ease: [0.25, 0.1, 0.25, 1]
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'heatmap' && (
          <motion.div 
            key="heatmap"
            className="space-y-3 sm:space-y-4"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="p-3.5 sm:p-4 rounded-xl bg-glass/20 border border-glass-border"
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h4 className="text-xs sm:text-sm font-semibold text-foreground">阅读热力图</h4>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <span>少</span>
                  <div className="flex gap-1">
                    <motion.div 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-tech-cyan/30"
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.2 }}
                    />
                    <motion.div 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-tech-cyan/60"
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.2 }}
                    />
                    <motion.div 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-tech-cyan/80"
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.2 }}
                    />
                    <motion.div 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-tech-cyan"
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.2 }}
                    />
                  </div>
                  <span>多</span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                  <motion.div 
                    key={day} 
                    className="text-[10px] sm:text-xs text-center text-muted-foreground mb-1.5 sm:mb-2"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: prefersReducedMotion ? 0 : index * 0.05 
                    }}
                  >
                    {day}
                  </motion.div>
                ))}

                {heatmapData.map((item, index) => (
                  <HeatmapCell 
                    key={`${item.week}-${item.day}`} 
                    count={item.count} 
                    date={item.date}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'trends' && (
          <motion.div 
            key="trends"
            className="space-y-3 sm:space-y-4"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="p-3.5 sm:p-4 rounded-xl bg-glass/20 border border-glass-border"
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3 sm:mb-4">阅读趋势</h4>

              <AnimatedChart delay={0.2}>
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
                      animationDuration={prefersReducedMotion ? 0 : 1500}
                      animationBegin={prefersReducedMotion ? 0 : 300}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </AnimatedChart>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
