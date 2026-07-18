'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { Eye, Heart, MessageCircle, Pin, Sparkles, TrendingUp, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BlurIn, FadeIn, Stagger, StaggerItem, HoverLift } from '@/components/motion'
import { getFeaturedArticles, getPopularArticles } from '@/services/articleService'
import type { Article } from '@/types'
import logger from '@/utils/logger'

type HighlightType = 'pinned' | 'featured' | 'trending' | 'latest'

interface HighlightItem {
  id: string
  type: HighlightType
  title: string
  description: string
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

const TYPE_META: Record<
  HighlightType,
  { badge: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pinned: {
    badge: '置顶',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    icon: Pin,
  },
  featured: {
    badge: '精选',
    color: 'from-tech-cyan/20 to-tech-sky/10 border-tech-cyan/30',
    icon: Sparkles,
  },
  trending: {
    badge: '热门',
    color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30',
    icon: TrendingUp,
  },
  latest: {
    badge: '最新',
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
    icon: Clock,
  },
}

function mapArticlesToHighlights(articles: Article[]): HighlightItem[] {
  return articles.slice(0, 6).map((article, index) => {
    const type: HighlightType =
      index === 0 ? 'featured' : index < 3 ? 'trending' : 'latest'
    const meta = TYPE_META[type]
    const category =
      article.categories?.[0]?.name ||
      article.category?.name ||
      '未分类'

    return {
      id: article.id,
      type,
      title: article.title,
      description: article.excerpt || article.content?.slice(0, 120) || '',
      link: `/articles/${article.id}` as Route,
      badge: meta.badge,
      color: meta.color,
      stats: {
        views: article.view_count,
        likes: article.likes_count,
        comments: article.comments_count,
      },
      category,
      readTime: article.read_time ? `${article.read_time} 分钟` : undefined,
    }
  })
}

export default function FeaturedHighlights() {
  const [highlights, setHighlights] = useState<HighlightItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        let articles = await getFeaturedArticles(6)
        if (!articles.length) {
          articles = await getPopularArticles(6)
        }
        if (!cancelled) {
          setHighlights(mapArticlesToHighlights(articles))
        }
      } catch (error) {
        logger.error('加载精选文章失败:', error)
        if (!cancelled) {
          setHighlights([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const hero = highlights[0]
  const satellites = useMemo(() => highlights.slice(1, 4), [highlights])

  if (loading) {
    return (
      <section className="relative overflow-hidden py-6" aria-busy="true" aria-label="精选推荐加载中">
        <div className="container mx-auto px-4">
          <div className="h-8 w-40 rounded bg-glass/30 animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-48 rounded-xl bg-glass/20 animate-pulse" />
            <div className="space-y-4">
              <div className="h-20 rounded-xl bg-glass/20 animate-pulse" />
              <div className="h-20 rounded-xl bg-glass/20 animate-pulse" />
              <div className="h-20 rounded-xl bg-glass/20 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (highlights.length === 0) {
    return (
      <section className="relative overflow-hidden py-6">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无精选文章</p>
            </div>
          </FadeIn>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden py-6" aria-label="精选推荐">
      <div className="container mx-auto px-4">
        <BlurIn>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">精选推荐</h2>
        </BlurIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {hero && (
            <FadeIn className="lg:col-span-2" direction="up">
              <HoverLift strong>
                <Link
                  href={hero.link as Route}
                  data-testid="featured-hero-card"
                  className={cn(
                    'block h-full rounded-xl border bg-gradient-to-br p-5 sm:p-6',
                    'border-glass-border bg-glass/20 backdrop-blur-xl',
                    'hover:border-tech-cyan/40 transition-colors',
                    hero.color
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-tech-cyan/20 text-tech-cyan">
                      {hero.badge}
                    </span>
                    {hero.category && (
                      <span className="text-xs text-muted-foreground">{hero.category}</span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-2 line-clamp-2">
                    {hero.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {hero.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {hero.stats.views !== undefined && (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {hero.stats.views}
                      </span>
                    )}
                    {hero.stats.likes !== undefined && (
                      <span className="inline-flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {hero.stats.likes}
                      </span>
                    )}
                    {hero.stats.comments !== undefined && (
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {hero.stats.comments}
                      </span>
                    )}
                    {hero.readTime && <span>{hero.readTime}</span>}
                  </div>
                </Link>
              </HoverLift>
            </FadeIn>
          )}

          <Stagger className="flex flex-col gap-4" itemCount={satellites.length}>
            {satellites.map((item) => {
              const Icon = TYPE_META[item.type].icon
              return (
                <StaggerItem key={item.id}>
                  <HoverLift>
                    <Link
                      href={item.link as Route}
                      data-testid="featured-satellite-card"
                      className={cn(
                        'block rounded-xl border p-4 bg-glass/20 backdrop-blur-xl',
                        'border-glass-border hover:border-tech-cyan/40 transition-colors',
                        item.color
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-tech-cyan/10 text-tech-cyan">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold text-tech-cyan">
                              {item.badge}
                            </span>
                            {item.category && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                            {item.stats.views !== undefined && (
                              <span className="inline-flex items-center gap-0.5">
                                <Eye className="w-3 h-3" />
                                {item.stats.views}
                              </span>
                            )}
                            {item.stats.likes !== undefined && (
                              <span className="inline-flex items-center gap-0.5">
                                <Heart className="w-3 h-3" />
                                {item.stats.likes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </HoverLift>
                </StaggerItem>
              )
            })}
          </Stagger>
        </div>
      </div>
    </section>
  )
}
