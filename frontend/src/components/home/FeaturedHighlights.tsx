'use client'

import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { BlurIn } from '@/components/motion'
import EmptyState from '@/components/ui/EmptyState'
import { getFeaturedArticles, getPopularArticles } from '@/services/articleService'
import type { Article } from '@/types'
import logger from '@/utils/logger'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import FeaturedReel from '@/components/home/narrative/FeaturedReel'
import {
  REEL_TYPE_META,
  type ReelHighlightItem,
  type ReelHighlightType,
} from '@/components/home/narrative/ReelCard'
import { cn } from '@/lib/utils'

function mapArticlesToHighlights(articles: Article[]): ReelHighlightItem[] {
  return articles.slice(0, 6).map((article, index) => {
    const type: ReelHighlightType =
      index === 0 ? 'featured' : index < 3 ? 'trending' : 'latest'
    const meta = REEL_TYPE_META[type]
    const category =
      article.categories?.[0]?.name || article.category?.name || '未分类'

    return {
      id: article.id,
      type,
      title: article.title,
      description: article.excerpt || article.content?.slice(0, 120) || '',
      link: `/articles/${article.id}`,
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

/**
 * 第一幕 · 展厅：数据加载 + 电影胶片卷轴。
 */
export default function FeaturedHighlights() {
  const [highlights, setHighlights] = useState<ReelHighlightItem[]>([])
  const [loading, setLoading] = useState(true)
  const reduced = useReducedMotion()
  const skeletonPulse = reduced ? '' : 'animate-pulse'

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

  if (loading) {
    return (
      <section
        className="relative overflow-hidden py-6"
        aria-busy="true"
        aria-label="精选推荐加载中"
      >
        <div className="container mx-auto px-4">
          <div className={cn('h-8 w-40 rounded bg-glass/30 mb-6', skeletonPulse)} />
          <div className="flex gap-4 overflow-hidden">
            <div className={cn('h-48 min-w-[70%] rounded-2xl bg-glass/20', skeletonPulse)} />
            <div className={cn('h-48 min-w-[50%] rounded-2xl bg-glass/15', skeletonPulse)} />
          </div>
        </div>
      </section>
    )
  }

  if (highlights.length === 0) {
    return (
      <section className="relative overflow-hidden py-6" aria-label="精选推荐">
        <div className="container mx-auto px-4">
          <EmptyState
            size="sm"
            compact
            icon={BookOpen}
            title="暂无精选文章"
            description="精选内容准备中，请稍后再来"
          />
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden py-6" aria-label="精选推荐">
      <div className="container mx-auto px-4">
        <BlurIn>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            精选推荐
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            横向胶片 · 拖拽或方向键浏览展厅
          </p>
        </BlurIn>
        <FeaturedReel items={highlights} />
      </div>
    </section>
  )
}
