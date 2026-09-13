'use client'

/**
 * 首页第二/三幕数据面板。
 *
 * 按读者动线拆成两个导出：
 * - StatsHighlights（第二幕 · 仪表）：热门篇章列表打头，读者内容优先；
 * - StatsDeepPanel（第三幕 · 洋流）：作者名片、友链与阅读统计图表，
 *   归入深层水域的「数据航迹」。
 * 两者各自独立拉取数据，避免跨幕的重复请求。
 */

import dynamic from 'next/dynamic'
import { useState, useEffect, type ReactNode } from 'react'
import FriendLinks from './FriendLinks'
import ProfileCard from './ProfileCard'
import { FadeIn } from '@/components/motion'
import { getPopularArticles } from '@/lib/api/articles'
import {
  getPublicStatistics,
  type PublicStatisticsOverview,
} from '@/services/statisticsService'
import { friendLinkService } from '@/services/friendLinkService'
import logger from '@/utils/logger'
import type { Article as BackendArticle } from '@/types'
import type { StatsArticle } from './stats/types'

// 经 charts-bundle 共享 recharts 依赖，避免与 ReadingStats 各复制一份图表库
const StatsCharts = dynamic(
  () => import('./stats/charts-bundle').then((m) => m.StatsCharts),
  { ssr: false }
)

// 友链：真实数据优先，接口失败时回退到占位内容
const fallbackFriendLinks: { id: string; name: string; url: string; favicon: string; description?: string }[] = [
  {
    id: '1',
    name: 'Next.js',
    url: 'https://nextjs.org',
    favicon: '/assets/nextjs-logo.svg',
    description: '生产就绪的React框架',
  },
  {
    id: '2',
    name: 'Vercel',
    url: 'https://vercel.com',
    favicon: '/assets/vercel-logo.svg',
    description: '开发. 预览. 部署.',
  },
  {
    id: '3',
    name: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    favicon: '/assets/tailwind-logo.svg',
    description: '快速构建现代网站',
  },
  {
    id: '4',
    name: 'Radix UI',
    url: 'https://www.radix-ui.com',
    favicon: '/assets/radix-logo.svg',
    description: '无样式、可访问的UI组件',
  },
]

const formatArticleForDisplay = (article: BackendArticle): StatsArticle => ({
  id: article.id,
  title: article.title,
  excerpt: article.excerpt || '',
  category: article.categories?.[0]?.name || '未分类',
  date: article.published_at,
  likes: article.likes_count || 0,
  comments: article.comments_count || 0,
  image: article.cover_image || undefined,
})

/** 共享的加载态/错误态包装 */
function PanelShell({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean
  error: string | null
  onRetry: () => void
  children: ReactNode
}) {
  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent" />
          数据加载中…
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-destructive text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 transition-colors text-sm"
        >
          重试
        </button>
      </div>
    )
  }
  return <>{children}</>
}

/** 共享的容器底：极淡网格 + 顶线，不与阅读内容抢戏 */
function PanelBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-tech-cyan/20 to-transparent" />
      <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(6,182,212,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,.4)_1px,transparent_1px)] [background-size:56px_56px]" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// 第二幕 · 仪表：热门篇章（读者内容打头）
// ---------------------------------------------------------------------------

export function StatsHighlights() {
  const [articles, setArticles] = useState<StatsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHighlights = async () => {
    try {
      setLoading(true)
      setError(null)
      const backendArticles = await getPopularArticles(6)
      setArticles(backendArticles.map(formatArticleForDisplay))
    } catch (err) {
      logger.error('获取热门篇章失败:', err)
      setError('热门篇章加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHighlights()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 挂载时拉取一次
  }, [])

  return (
    <section className="relative overflow-hidden py-6 sm:py-8">
      <PanelBackdrop />
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <PanelShell loading={loading} error={error} onRetry={loadHighlights}>
          {articles.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              还没有热门篇章，发布文章后这里会展示最多阅读的内容
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((article, index) => (
                <FadeIn key={article.id} delay={Math.min(index * 0.05, 0.3)}>
                  <div className="group h-full rounded-2xl border border-glass-border bg-glass/40 backdrop-blur-xl p-5 hover:border-tech-cyan/40 hover:bg-glass/60 transition-colors duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-foreground group-hover:text-tech-cyan transition-colors leading-snug">
                        {article.title}
                      </h3>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums px-2 py-1 rounded-full bg-primary/10">
                        {article.likes} 赞
                      </span>
                    </div>
                    {article.excerpt ? (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    ) : null}
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
        </PanelShell>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 第三幕 · 洋流：作者名片 + 友链 + 阅读统计（深层水域的数据航迹）
// ---------------------------------------------------------------------------

export function StatsDeepPanel() {
  const [publicStats, setPublicStats] = useState<PublicStatisticsOverview | null>(null)
  const [friendLinks, setFriendLinks] = useState<
    { id: string; name: string; url: string; favicon: string; description?: string }[]
  >(fallbackFriendLinks)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDeepData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [stats, links] = await Promise.all([
        getPublicStatistics(),
        friendLinkService
          .getFriendLinks({ is_active: true, limit: 12 })
          .catch(() => [] as typeof fallbackFriendLinks),
      ])
      setPublicStats(stats)
      // 友链：真实数据优先，接口失败/为空时才回退占位
      if (links.length > 0) {
        // service 与组件的 FriendLink 类型定义独立，显式映射字段
        setFriendLinks(links.map((l) => ({
          id: l.id,
          name: l.name,
          url: l.url,
          favicon: l.favicon ?? '',
          description: l.description ?? undefined,
        })))
      }
    } catch (err) {
      logger.error('获取洋流数据失败:', err)
      setError('数据加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDeepData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 挂载时拉取一次
  }, [])

  return (
    <section className="relative overflow-hidden py-6 sm:py-8">
      <PanelBackdrop />
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <PanelShell loading={loading} error={error} onRetry={loadDeepData}>
          <FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-4 flex flex-col gap-6">
                <ProfileCard />
                <FriendLinks links={friendLinks} />
              </div>
              <div className="lg:col-span-8">
                <StatsCharts stats={publicStats} />
              </div>
            </div>
          </FadeIn>
        </PanelShell>
      </div>
    </section>
  )
}
