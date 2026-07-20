'use client'

import { useState, useEffect } from 'react'
import FriendLinks from './FriendLinks'
import ProfileCard from './ProfileCard'
import { FadeIn } from '@/components/motion'
import { useLoading } from '@/context/loading-context'
import { getPopularArticles } from '@/services/articleService'
import {
  getPublicStatistics,
  type PublicStatisticsOverview,
} from '@/services/statisticsService'
import logger from '@/utils/logger'
import type { Article as BackendArticle } from '@/types'
import { StatsArticleList } from './stats/StatsArticleList'
import { StatsCharts } from './stats/StatsCharts'
import type { StatsArticle } from './stats/types'

interface FriendLink {
  id: string
  name: string
  url: string
  favicon: string
  description?: string
}

const mockFriendLinks: FriendLink[] = [
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

export default function StatsPanel() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [articles, setArticles] = useState<StatsArticle[]>([])
  const [publicStats, setPublicStats] = useState<PublicStatisticsOverview | null>(null)
  const { showLoading, hideLoading } = useLoading()

  const loadPanelData = async () => {
    showLoading()
    setLoading(true)
    setError(null)

    try {
      logger.log('正在获取热门文章与公开统计...')
      const [backendArticles, stats] = await Promise.all([
        getPopularArticles(3),
        getPublicStatistics(),
      ])
      logger.log(`成功获取 ${backendArticles.length} 篇热门文章`)
      setArticles(backendArticles.map(formatArticleForDisplay))
      setPublicStats(stats)
    } catch (err) {
      logger.error('获取首页面板数据失败:', err)
      setError(err instanceof Error ? err.message : '获取文章失败')
    } finally {
      hideLoading()
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPanelData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 挂载时拉取一次
  }, [])

  const handleRetry = () => {
    void loadPanelData()
  }

  return (
    <section className="relative overflow-hidden py-6 sm:py-8">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-tech-cyan/25 to-transparent" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(6,182,212,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,.45)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute right-[8%] top-16 h-44 w-44 rounded-full border border-tech-cyan/10 shadow-[0_0_80px_rgba(6,182,212,.1)]" />
      </div>
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-4 flex flex-col gap-6">
              <ProfileCard />
              <FriendLinks links={mockFriendLinks} />
            </div>

            <div className="lg:col-span-8">
              <StatsArticleList
                articles={articles}
                loading={loading}
                error={error}
                onRetry={handleRetry}
              />
            </div>
          </div>
        </FadeIn>

        <FadeIn className="mt-6 lg:mt-8" delay={0.1}>
          <StatsCharts stats={publicStats} />
        </FadeIn>
      </div>
    </section>
  )
}
