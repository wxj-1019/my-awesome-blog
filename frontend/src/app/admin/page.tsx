'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import StatCard from '@/components/ui/StatCard'
import { API_BASE_URL } from '@/config/api'
import { validateArrayData, getTotalCount } from '@/utils/data-validation'
import { getAuthHeaders } from '@/lib/auth-utils'
import LoadingSpinner from '@/components/admin/dashboard/LoadingSpinner'
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader'
import RecentArticles from '@/components/admin/dashboard/RecentArticles'
import QuickActions from '@/components/admin/dashboard/QuickActions'
import StatBlock from '@/components/admin/dashboard/StatBlock'
import type { Article } from '@/types'
import {
  FileText,
  Users,
  Eye,
  Mail,
  Folder,
  Tag,
} from 'lucide-react'

interface Stats {
  articlesCount: number
  usersCount: number
  viewsCount: number
  subscriptionsCount: number
  commentsCount: number
  categoriesCount: number
  tagsCount: number
  recentArticles: Array<{
    id: string
    title: string
    created_at: string
    view_count: number
    is_published: boolean
  }>
}

interface StatCardItem {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  href?: string
  trend: { value: number; isPositive: boolean }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    articlesCount: 0,
    usersCount: 0,
    viewsCount: 0,
    subscriptionsCount: 0,
    commentsCount: 0,
    categoriesCount: 0,
    tagsCount: 0,
    recentArticles: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const headers = getAuthHeaders()

      const [
        articlesRes,
        usersRes,
        subsRes,
        categoriesRes,
        tagsRes,
        recentArticlesRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/articles/?skip=0&limit=1`, { headers }),
        fetch(`${API_BASE_URL}/users/?skip=0&limit=1`, { headers }),
        fetch(`${API_BASE_URL}/subscriptions/?skip=0&limit=1`, { headers }),
        fetch(`${API_BASE_URL}/categories/`, { headers }),
        fetch(`${API_BASE_URL}/tags/`, { headers }),
        fetch(`${API_BASE_URL}/articles/?skip=0&limit=5&sort=-created_at`, { headers })
      ])

      const articlesData = await articlesRes.json()
      const usersData = await usersRes.json()
      const subsData = await subsRes.json()
      const categoriesData = await categoriesRes.json()
      const tagsData = await tagsRes.json()
      const recentArticlesData = await recentArticlesRes.json()

      const articles = validateArrayData<Article>(articlesData)
      const categories = validateArrayData(categoriesData)
      const tags = validateArrayData(tagsData)
      const recentArticles = validateArrayData<Article>(recentArticlesData)

      const totalViews = articles.reduce((sum, a) => sum + (a.view_count || 0), 0)

      setStats({
        articlesCount: getTotalCount(articlesData),
        usersCount: getTotalCount(usersData),
        viewsCount: totalViews,
        subscriptionsCount: getTotalCount(subsData),
        commentsCount: 0,
        categoriesCount: categories.length,
        tagsCount: tags.length,
        recentArticles: recentArticles.slice(0, 5) as Stats['recentArticles']
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards: StatCardItem[] = [
    {
      label: '文章总数',
      value: stats.articlesCount,
      icon: FileText,
      color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      href: '/admin/articles',
      trend: { value: 12, isPositive: true }
    },
    {
      label: '用户总数',
      value: stats.usersCount,
      icon: Users,
      color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      href: '/admin/users',
      trend: { value: 8, isPositive: true }
    },
    {
      label: '总浏览量',
      value: stats.viewsCount.toLocaleString(),
      icon: Eye,
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      trend: { value: 23, isPositive: true }
    },
    {
      label: '订阅用户',
      value: stats.subscriptionsCount,
      icon: Mail,
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      href: '/admin/subscriptions',
      trend: { value: 5, isPositive: true }
    },
    {
      label: '分类数量',
      value: stats.categoriesCount,
      icon: Folder,
      color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      href: '/admin/categories',
      trend: { value: 0, isPositive: true }
    },
    {
      label: '标签数量',
      value: stats.tagsCount,
      icon: Tag,
      color: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      href: '/admin/tags',
      trend: { value: 15, isPositive: true }
    },
  ]

  const overviewBlocks = [
    {
      label: '内容发布率',
      value: stats.articlesCount > 0 ? '100%' : '0%',
      description: '活跃度',
      color: 'text-green-500'
    },
    {
      label: '平均浏览量',
      value: stats.articlesCount > 0 ? Math.round(stats.viewsCount / stats.articlesCount).toLocaleString() : '0',
      description: '次/篇文章',
      color: 'text-blue-500'
    },
    {
      label: '用户活跃度',
      value: stats.usersCount > 0 ? '78%' : '0%',
      description: '回头率',
      color: 'text-purple-500'
    },
    {
      label: '增长趋势',
      value: '+23%',
      description: '较上月',
      color: 'text-orange-500'
    },
  ]

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-8">
      <DashboardHeader />

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <StatCard
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              href={stat.href}
              trend={stat.trend}
              animationDelay={index * 100}
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentArticles articles={stats.recentArticles} />
        <QuickActions />
      </div>

      <StatBlock blocks={overviewBlocks} />
    </div>
  )
}
