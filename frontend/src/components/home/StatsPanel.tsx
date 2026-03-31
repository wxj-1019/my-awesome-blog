'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowRight, Heart, MessageCircle, Calendar, AlertCircle, RefreshCw, TrendingUp, Activity, FileText, Eye, ArrowUp, ArrowDown, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { useLoading } from '@/context/loading-context'
import ArticleCardSkeleton from './ArticleCardSkeleton'
import FriendLinks from './FriendLinks'
import ProfileCard from './ProfileCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts'
import { getPopularArticles } from '@/services/articleService'
import logger from '@/utils/logger'
import type { Article as BackendArticle } from '@/types'
import ScrollReveal from './decorations/ScrollReveal'
import { staggerContainer, staggerItem, VIEWPORT } from '@/lib/animation-utils'

interface FriendLink {
  id: string
  name: string
  url: string
  favicon: string
  description?: string
}

interface Article {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  likes: number
  comments: number
  image?: string
}

const mockFriendLinks: FriendLink[] = [
  {
    id: '1',
    name: 'Next.js',
    url: 'https://nextjs.org',
    favicon: '/assets/nextjs-logo.svg',
    description: '生产就绪的React框架'
  },
  {
    id: '2',
    name: 'Vercel',
    url: 'https://vercel.com',
    favicon: '/assets/vercel-logo.svg',
    description: '开发. 预览. 部署.'
  },
  {
    id: '3',
    name: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    favicon: '/assets/tailwind-logo.svg',
    description: '快速构建现代网站'
  },
  {
    id: '4',
    name: 'Radix UI',
    url: 'https://www.radix-ui.com',
    favicon: '/assets/radix-logo.svg',
    description: '无样式、可访问的UI组件'
  }
]

const formatArticleForDisplay = (article: BackendArticle): Article => ({
  id: article.id,
  title: article.title,
  excerpt: article.excerpt || '',
  category: article.categories?.[0]?.name || '未分类',
  date: article.published_at,
  likes: article.likes_count || 0,
  comments: article.comments_count || 0,
  image: article.cover_image || undefined
})

const monthlyStatsData = [
  { month: '1月', articles: 8, views: 12450, likes: 320 },
  { month: '2月', articles: 12, views: 18920, likes: 485 },
  { month: '3月', articles: 15, views: 24680, likes: 620 },
  { month: '4月', articles: 10, views: 21340, likes: 540 },
  { month: '5月', articles: 18, views: 28750, likes: 780 },
  { month: '6月', articles: 22, views: 34560, likes: 950 }
]

const weeklyActivityData = [
  { day: '周一', visitors: 145, engagement: 78 },
  { day: '周二', visitors: 168, engagement: 85 },
  { day: '周三', visitors: 152, engagement: 72 },
  { day: '周四', visitors: 178, engagement: 90 },
  { day: '周五', visitors: 165, engagement: 82 },
  { day: '周六', visitors: 132, engagement: 65 },
  { day: '周日', visitors: 128, engagement: 60 }
]

// 数字滚动动画组件
function AnimatedNumber({ value, suffix = '', prefix = '', duration = 2000 }: { 
  value: number
  suffix?: string
  prefix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [displayValue, setDisplayValue] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!isInView || shouldReduceMotion) {
      setDisplayValue(value)
      return
    }

    const startTime = performance.now()
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.round(value * easeOutQuart))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [isInView, value, duration, shouldReduceMotion])

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toLocaleString()
  }

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {prefix}{formatNumber(displayValue)}{suffix}
    </motion.span>
  )
}

// 增强的文章卡片
function ArticleCard({ article, index }: { article: Article; index: number }) {
  const [imageError, setImageError] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.article
      role="article"
      aria-label={article.title}
      tabIndex={0}
      className="group"
      variants={staggerItem}
      whileHover={shouldReduceMotion ? {} : { 
        y: -4,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
    >
      <Card
        className="glass-card backdrop-blur-xl bg-card/40 hover:bg-card/60 border-glass-border hover:border-tech-cyan/30 transition-all duration-300 overflow-hidden cursor-pointer relative"
      >
        {/* 悬停光效 */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
          }}
        />
        
        <CardContent className="p-0 relative z-10">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden relative">
              <motion.img
                src={imageError ? '/assets/avatar.jpg' : (article.image || '/assets/avatar.jpg')}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              />
              {/* 图片悬停遮罩 */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            </div>

            <div className="flex-1 p-4 sm:p-6 flex flex-col">
              <div className="flex items-start justify-between gap-4 flex-1">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground group-hover:text-tech-cyan transition-colors duration-300">
                    {article.title}
                  </h3>

                  <p className="text-muted-foreground mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">
                    {article.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <motion.div 
                      className="flex items-center gap-1"
                      whileHover={{ x: 2 }}
                    >
                      <Calendar className="w-4 h-4" />
                      <time>{article.date}</time>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-1"
                      whileHover={{ scale: 1.05, color: '#ec4899' }}
                    >
                      <Heart className="w-4 h-4" />
                      <span>{article.likes}</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{article.comments}</span>
                    </motion.div>
                    <span className="px-2 sm:px-3 py-1 rounded-full bg-tech-cyan/20 text-tech-cyan text-xs font-medium">
                      {article.category}
                    </span>
                  </div>
                </div>

                <motion.div 
                  className="flex-shrink-0"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <div
                    className="w-10 h-10 rounded-full bg-tech-cyan/20 flex items-center justify-center group-hover:bg-tech-cyan transition-colors duration-300"
                  >
                    <ArrowRight className="w-5 h-5 text-tech-cyan group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.article>
  )
}

// 文章列表组件
function ArticleList({ articles, loading, error, onRetry }: { articles: Article[]; loading: boolean; error: string | null; onRetry: () => void }) {
  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">
          最新文章
        </h2>
        <div className="space-y-4 sm:space-y-6">
          {[1, 2, 3].map((i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">
          最新文章
        </h2>
        <Card className="p-6 sm:p-8 text-center">
          <AlertCircle className="w-14 h-14 sm:w-16 sm:h-16 text-error mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">加载失败</h3>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            重新加载
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ScrollReveal animation="slideDown">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">
          最新文章
        </h2>
      </ScrollReveal>

      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT.ONCE}
        className="space-y-4 sm:space-y-6"
      >
        {articles.map((article, index) => (
          <ArticleCard key={article.id} article={article} index={index} />
        ))}
      </motion.div>

      <ScrollReveal animation="fadeIn" delay={0.3}>
        <div className="text-center pt-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="link"
              className="text-tech-cyan hover:text-tech-lightcyan group inline-flex items-center gap-1"
            >
              查看更多文章
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Button>
          </motion.div>
        </div>
      </ScrollReveal>
    </div>
  )
}

// 统计图表组件
function StatsCharts() {
  const shouldReduceMotion = useReducedMotion()
  
  const monthlyTotal = monthlyStatsData.reduce((sum, item) => sum + item.articles, 0)
  const monthlyViewsTotal = monthlyStatsData.reduce((sum, item) => sum + item.views, 0)
  const monthlyAvg = Math.round(monthlyTotal / monthlyStatsData.length)
  const monthlyGrowth = ((monthlyStatsData[5].articles - monthlyStatsData[0].articles) / monthlyStatsData[0].articles * 100)

  const weeklyVisitorsTotal = weeklyActivityData.reduce((sum, item) => sum + item.visitors, 0)
  const weeklyAvg = Math.round(weeklyVisitorsTotal / weeklyActivityData.length)
  const peakDay = weeklyActivityData.reduce((max, item) => item.visitors > max.visitors ? item : max)
  const engagementRate = Math.round((weeklyActivityData.reduce((sum, item) => sum + item.engagement, 0) / weeklyVisitorsTotal * 100))

  return (
    <ScrollReveal animation="slideUp">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 月度统计卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Card className="glass-card backdrop-blur-xl bg-card/40 border-glass-border p-5 sm:p-6 overflow-hidden hover:shadow-[0_0_40px_var(--shadow-tech-cyan),0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="p-2 rounded-lg bg-tech-cyan/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <TrendingUp className="w-5 h-5 text-tech-cyan" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">月度统计</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-glass/30 px-3 py-1.5 rounded-full border border-glass-border/50">
                <Activity className="w-3.5 h-3.5" />
                <span>6个月数据</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: FileText, label: '文章数', value: monthlyTotal, color: 'text-tech-cyan', suffix: '' },
                { icon: Eye, label: '访问量', value: Math.round(monthlyViewsTotal / 1000), color: 'text-purple-500', suffix: 'k' },
                { icon: TrendingUp, label: '月均', value: monthlyAvg, color: 'text-orange-500', suffix: '' },
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="p-3 rounded-xl bg-glass/30 border border-glass-border/50 text-center"
                  whileHover={{ y: -3, borderColor: 'rgba(6, 182, 212, 0.3)' }}
                  transition={{ duration: 0.2 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  custom={index}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                  {stat.label === '文章数' && (
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
                  )}
                </motion.div>
              ))}
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
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.1)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                <YAxis stroke="rgba(255,255,255,0.1)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
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
                <Bar dataKey="articles" fill="url(#gradientArticles)" radius={[6, 6, 0, 0]} name="文章数" maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* 周活跃度卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Card className="glass-card backdrop-blur-xl bg-card/40 border-glass-border p-5 sm:p-6 overflow-hidden hover:shadow-[0_0_40px_var(--shadow-tech-cyan),0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="p-2 rounded-lg bg-tech-cyan/20"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <Activity className="w-5 h-5 text-tech-cyan" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">周活跃度</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-glass/30 px-3 py-1.5 rounded-full border border-glass-border/50">
                <span>实时数据</span>
                <motion.span 
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: Users, label: '本周访客', value: weeklyVisitorsTotal, color: 'text-tech-cyan' },
                { icon: Activity, label: '互动率', value: engagementRate, color: 'text-pink-500', suffix: '%' },
                { icon: TrendingUp, label: '峰值日', value: peakDay.visitors, color: 'text-green-500' },
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="p-3 rounded-xl bg-glass/30 border border-glass-border/50 text-center"
                  whileHover={{ y: -3, borderColor: 'rgba(6, 182, 212, 0.3)' }}
                  transition={{ duration: 0.2 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  custom={index}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
                    <AnimatedNumber value={stat.value} suffix={stat.suffix || ''} />
                  </div>
                </motion.div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.1)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                <YAxis stroke="rgba(255,255,255,0.1)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
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
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="visitors" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#gradientVisitors)" name="访客数" />
                <Area type="monotone" dataKey="engagement" stroke="#ec4899" strokeWidth={2.5} fillOpacity={1} fill="url(#gradientEngagement)" name="互动数" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>
    </ScrollReveal>
  )
}

// 主组件
export default function StatsPanel() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const { showLoading, hideLoading } = useLoading()

  useEffect(() => {
    const fetchArticles = async () => {
      showLoading()
      setLoading(true)
      setError(null)
      
      try {
        logger.log('正在获取热门文章...')
        const backendArticles = await getPopularArticles(3)
        logger.log(`成功获取 ${backendArticles.length} 篇热门文章`)
        
        const formattedArticles = backendArticles.map(formatArticleForDisplay)
        setArticles(formattedArticles)
      } catch (err) {
        logger.error('获取热门文章失败:', err)
        setError(err instanceof Error ? err.message : '获取文章失败')
      } finally {
        hideLoading()
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  const handleRetry = () => {
    setError(null)
    showLoading()
    setLoading(true)
    
    const fetchArticles = async () => {
      try {
        logger.log('重新获取热门文章...')
        const backendArticles = await getPopularArticles(3)
        logger.log(`成功获取 ${backendArticles.length} 篇热门文章`)
        
        const formattedArticles = backendArticles.map(formatArticleForDisplay)
        setArticles(formattedArticles)
      } catch (err) {
        logger.error('重新获取热门文章失败:', err)
        setError(err instanceof Error ? err.message : '获取文章失败')
      } finally {
        hideLoading()
        setLoading(false)
      }
    }

    fetchArticles()
  }

  return (
    <section className="py-8 sm:py-10 md:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* 左侧边栏 - 从左滑入 */}
          <ScrollReveal animation="slideLeft" className="lg:col-span-4">
            <div className="flex flex-col gap-6">
              <ProfileCard />
              <FriendLinks links={mockFriendLinks} />
            </div>
          </ScrollReveal>

          {/* 右侧文章列表 - 从右滑入 */}
          <ScrollReveal animation="slideRight" className="lg:col-span-8">
            <ArticleList articles={articles} loading={loading} error={error} onRetry={handleRetry} />
          </ScrollReveal>
        </div>

        {/* 统计图表 - 从下方淡入 */}
        <div className="mt-6 lg:mt-8">
          <StatsCharts />
        </div>
      </div>
    </section>
  )
}
