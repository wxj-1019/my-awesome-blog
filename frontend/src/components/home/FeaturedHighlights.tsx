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
      {/* 展厅光影：顶光 + 暗角 + 胶片齿孔，纯装饰 */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* 浅色模式暗角降强度，避免发灰压字 */}
        <style jsx>{`
          :global(.light) .gallery-vignette {
            opacity: 0.55;
          }
        `}</style>
        {/* 顶缝光：像展厅射灯从顶部打下 */}
        <div
          className="absolute inset-x-0 top-0 h-48"
          style={{
            background:
              'radial-gradient(ellipse 55% 100% at 50% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 75%)',
          }}
        />
        {/* 四角暗角：收拢视线到卷轴 */}
        <div
          className="gallery-vignette absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 125% 100% at 50% 50%, transparent 60%, color-mix(in srgb, var(--tech-darkblue) 16%, transparent) 100%)',
          }}
        />
        {/* 胶片齿孔：顶部一条极淡的打孔线，强化「卷轴展厅」 */}
        <div
          className="absolute inset-x-8 top-1 h-1.5 opacity-15"
          style={{
            background:
              'repeating-linear-gradient(to right, var(--primary) 0 8px, transparent 8px 26px)',
          }}
        />
      </div>
      <div className="relative z-10 container mx-auto px-4">
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
