'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Pin, Star, TrendingUp, ArrowRight, Eye, Heart, Flame, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPopularArticles } from '@/lib/api/articles'

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4
    }
  }
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

export default function FeaturedHighlights() {
  const [highlights, setHighlights] = useState<HighlightItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true)
        setError(null)
        const articles = await getPopularArticles({ limit: 6 })
        console.log('获取到的文章数据:', articles)

        const mappedHighlights: HighlightItem[] = articles.map((article, index) => {
          console.log(`处理文章 ${index + 1}:`, article.title)
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
      <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10 bg-gradient-to-b from-tech-darkblue to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-400 text-center">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10 bg-gradient-to-b from-tech-darkblue to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-12 h-12 text-tech-cyan animate-spin" />
            <p className="text-gray-400 ml-4">加载中...</p>
          </div>
        </div>
      </section>
    )
  }

  if (highlights.length === 0 && !loading) {
    return (
      <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10 bg-gradient-to-b from-tech-darkblue to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-400">暂无精选文章</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10 bg-gradient-to-b from-tech-darkblue to-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-tech-cyan to-tech-sky rounded-full animate-pulse-glow" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              精选推荐
            </h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-glass-border/50 to-transparent" />
          <span className="text-xs sm:text-sm text-gray-400">
            {highlights.length} 篇精选
          </span>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          {highlights.map((item, index) => (
            <motion.div
              key={item.id}
              variants={cardVariants}
              whileHover={{ 
                y: -8,
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className="group"
            >
              <a
                href={item.link}
                className={cn(
                  'block h-full bg-glass/30 backdrop-blur-xl border border-glass-border rounded-2xl',
                  'p-5 sm:p-6 transition-all duration-300',
                  'hover:shadow-2xl hover:shadow-tech-cyan/10',
                  'cursor-pointer relative overflow-hidden',
                  'before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none',
                  'before:bg-gradient-to-br before:from-white/5 before:to-transparent',
                  'group-hover:before:from-white/10'
                )}
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={cn(
                        'p-3 rounded-xl bg-gradient-to-br',
                        item.color,
                        'text-white shadow-lg'
                      )}
                    >
                      <item.icon className="w-6 h-6" />
                    </motion.div>
                    <div className="flex flex-col gap-2 items-end">
                      <span
                        className={cn(
                          'px-2.5 py-1 text-xs font-semibold rounded-full',
                          'bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/30',
                          'shadow-sm'
                        )}
                      >
                        {item.badge}
                      </span>
                      {item.category && (
                        <span className="text-[10px] sm:text-xs text-gray-400 bg-glass/50 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-tech-cyan transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {item.readTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{item.readTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-glass-border/50">
                      <div className="flex items-center gap-3">
                        {item.stats.views && (
                          <div className="flex items-center gap-1 group-hover:text-tech-cyan transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{formatNumber(item.stats.views)}</span>
                          </div>
                        )}
                        {item.stats.likes && (
                          <div className="flex items-center gap-1 group-hover:text-pink-400 transition-colors">
                            <Heart className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{formatNumber(item.stats.likes)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center text-tech-cyan text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                        <span className="text-xs sm:text-sm">阅读</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-tech-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
              </a>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 sm:mt-10 text-center"
        >
          <a
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-glass/30 backdrop-blur-xl border border-glass-border rounded-full text-white hover:bg-glass/50 hover:border-tech-cyan/50 hover:shadow-lg hover:shadow-tech-cyan/10 transition-all duration-300 cursor-pointer group"
          >
            <span className="text-sm sm:text-base font-medium">查看更多精选</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
