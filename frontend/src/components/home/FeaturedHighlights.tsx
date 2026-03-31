'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Pin, Star, TrendingUp, ArrowRight, Eye, Heart, Flame, Clock, AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPopularArticles } from '@/lib/api/articles'
import { staggerContainer, staggerItem, slideDown, VIEWPORT } from '@/lib/animation-utils'
import ScrollReveal from './decorations/ScrollReveal'

interface HighlightItem {
  id: string
  type: 'pinned' | 'featured' | 'trending' | 'latest'
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  link: string
  badge: string
  color: string
  stats: {
    views?: number
    likes?: number
    comments?: number
  }
  category?: string
  readTime?: string
}

// 增强的动画变体
const titleVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

const enhancedCardVariants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.9,
    rotateX: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

const floatingBadgeVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
    },
  },
}

// 闪烁星星装饰
function SparkleDecoration({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("absolute pointer-events-none", className)}
      animate={{
        scale: [0.8, 1.2, 0.8],
        opacity: [0.4, 1, 0.4],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Sparkles className="w-4 h-4 text-tech-cyan/60" />
    </motion.div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

function formatReadTime(content: string): string {
  const wordsPerMinute = 200
  const wordCount = content.length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min`
}

// 增强的卡片组件
function HighlightCard({ item, index }: { item: HighlightItem; index: number }) {
  const shouldReduceMotion = useReducedMotion()
  const Icon = item.icon
  
  return (
    <motion.div
      variants={enhancedCardVariants}
      whileHover={shouldReduceMotion ? {} : { 
        y: -10,
        scale: 1.02,
        transition: { 
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }
      }}
      className="group h-full"
      style={{ perspective: '1000px' }}
    >
      <a
        href={item.link}
        className={cn(
          'block h-full backdrop-blur-xl border rounded-2xl',
          'p-5 sm:p-6 transition-all duration-300',
          'hover:shadow-2xl hover:shadow-tech-cyan/10 dark:hover:shadow-tech-cyan/20',
          'cursor-pointer relative overflow-hidden',
          'bg-card/80 border-border hover:border-tech-cyan/40',
          'dark:bg-card/90 dark:border-glass-border dark:hover:border-tech-cyan/50',
        )}
      >
        {/* 悬浮光效层 */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
          }}
        />
        
        {/* 角落装饰 */}
        <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-2xl">
          <motion.div
            className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-tech-cyan/20 to-transparent rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.2,
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <motion.div
              whileHover={shouldReduceMotion ? {} : { 
                rotate: 360,
                scale: 1.1,
              }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }}
              className={cn(
                'p-3 rounded-xl bg-gradient-to-br',
                item.color,
                'text-white shadow-lg relative'
              )}
            >
              <Icon className="w-6 h-6" />
              {/* 图标发光效果 */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-white/30"
                animate={{
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.3,
                }}
              />
            </motion.div>
            
            <div className="flex flex-col gap-2 items-end">
              <motion.span
                variants={floatingBadgeVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-full',
                  'bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/30',
                  'shadow-sm relative'
                )}
              >
                {item.badge}
                {/* 徽章闪烁 */}
                <motion.span
                  className="absolute inset-0 rounded-full bg-tech-cyan/30"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: index * 0.5,
                  }}
                />
              </motion.span>
              {item.category && (
                <span className="text-[10px] sm:text-xs text-muted-foreground bg-glass/50 px-2 py-1 rounded">
                  {item.category}
                </span>
              )}
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-tech-cyan transition-colors duration-300">
            {item.title}
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
            {item.description}
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {item.readTime && (
                <motion.div 
                  className="flex items-center gap-1.5"
                  whileHover={{ x: 2 }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.readTime}</span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-glass-border/50">
              <div className="flex items-center gap-3">
                {item.stats.views && (
                  <motion.div 
                    className="flex items-center gap-1 text-muted-foreground"
                    whileHover={{ scale: 1.05, color: '#06b6d4' }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{formatNumber(item.stats.views)}</span>
                  </motion.div>
                )}
                {item.stats.likes && (
                  <motion.div 
                    className="flex items-center gap-1 text-muted-foreground"
                    whileHover={{ scale: 1.05, color: '#ec4899' }}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{formatNumber(item.stats.likes)}</span>
                  </motion.div>
                )}
              </div>

              <motion.div 
                className="flex items-center text-tech-cyan text-sm font-medium"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <span className="text-xs sm:text-sm">阅读</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <ArrowRight className="w-4 h-4 ml-1" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </a>
    </motion.div>
  )
}

export default function FeaturedHighlights() {
  const [highlights, setHighlights] = useState<HighlightItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true)
        setError(null)
        const articles = await getPopularArticles({ limit: 6 })

        const mappedHighlights: HighlightItem[] = articles.map((article, index) => {
          const type: HighlightItem['type'] = index === 0 ? 'pinned' : index === 1 ? 'featured' : index === 2 ? 'trending' : 'latest'
          const badgeMap = { pinned: '置顶', featured: '精选', trending: '热门', latest: '最新' }
          const colorMap = { 
            pinned: 'from-red-500 to-orange-500',
            featured: 'from-tech-cyan to-tech-sky',
            trending: 'from-purple-500 to-pink-500',
            latest: 'from-green-500 to-emerald-500'
          }
          const iconMap = { pinned: Pin, featured: Star, trending: Flame, latest: TrendingUp }
          
          return {
            id: article.id,
            type,
            title: article.title,
            description: article.excerpt || article.content.substring(0, 100) + '...',
            icon: iconMap[type],
            link: `/articles/${article.id}`,
            badge: badgeMap[type],
            color: colorMap[type],
            category: article.category_id,
            readTime: formatReadTime(article.content),
            stats: {
              views: article.view_count,
              likes: article.likes_count,
              comments: article.comments_count
            }
          }
        })
        
        setHighlights(mappedHighlights)
      } catch (err) {
        console.error('Failed to fetch articles:', err)
        setError(err instanceof Error ? err.message : '获取文章失败')
      } finally {
        setLoading(false)
      }
    }

    fetchHighlights()
  }, [])

  if (error) {
    return (
      <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10 bg-gradient-to-b from-muted/30 to-transparent dark:from-background dark:to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10 bg-gradient-to-b from-muted/30 to-transparent dark:from-background dark:to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-12 h-12 text-tech-cyan animate-spin" />
            <p className="text-muted-foreground ml-4">加载中...</p>
          </div>
        </div>
      </section>
    )
  }

  if (highlights.length === 0 && !loading) {
    return (
      <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10 bg-gradient-to-b from-muted/30 to-transparent dark:from-background dark:to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无精选文章</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10 bg-gradient-to-b from-muted/30 to-transparent dark:from-background dark:to-transparent">
      {/* 装饰元素 */}
      <SparkleDecoration className="top-10 left-[10%]" />
      <SparkleDecoration className="top-20 right-[15%]" />
      <SparkleDecoration className="bottom-20 left-[5%]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区域 - 滚动触发入场 */}
        <ScrollReveal animation="slideDown" className="mb-6 sm:mb-8">
          <motion.div
            className="flex items-center gap-3"
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT.ONCE}
          >
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-1 h-7 sm:h-8 bg-gradient-to-b from-tech-cyan to-tech-sky rounded-full"
                animate={shouldReduceMotion ? {} : {
                  boxShadow: [
                    '0 0 10px rgba(6, 182, 212, 0.3)',
                    '0 0 25px rgba(6, 182, 212, 0.6)',
                    '0 0 10px rgba(6, 182, 212, 0.3)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                精选推荐
              </h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-glass-border/50 to-transparent" />
            <motion.span 
              className="text-xs sm:text-sm text-muted-foreground"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              {highlights.length} 篇精选
            </motion.span>
          </motion.div>
        </ScrollReveal>

        {/* 卡片网格 - 交错入场动画 */}
        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT.ONCE}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          {highlights.map((item, index) => (
            <HighlightCard key={item.id} item={item} index={index} />
          ))}
        </motion.div>

        {/* 查看更多按钮 - 淡入上浮 */}
        <ScrollReveal animation="fadeIn" delay={0.4} className="mt-8 sm:mt-10">
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.a
              href="/articles"
              className="inline-flex items-center gap-2 px-6 py-3 backdrop-blur-xl border rounded-full transition-all duration-300 cursor-pointer group bg-card/80 border-border text-foreground hover:bg-card hover:border-tech-cyan/50 hover:shadow-lg hover:shadow-tech-cyan/10 dark:bg-card/90 dark:border-glass-border dark:hover:bg-card dark:hover:border-tech-cyan/40 dark:hover:shadow-tech-cyan/15"
              whileHover={{
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)',
              }}
            >
              <span className="text-sm sm:text-base font-medium">查看更多精选</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.a>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  )
}
