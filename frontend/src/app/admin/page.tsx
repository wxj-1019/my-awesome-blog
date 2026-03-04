'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FileText, 
  Users, 
  Eye, 
  Mail,
  Folder,
  Tag,
  MessageSquare,
  TrendingUp,
  Clock,
  BarChart2,
  ArrowUpRight,
  Calendar,
  Plus,
  Sparkles,
  Zap,
  Activity,
  RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'
import StatCard from '@/components/ui/StatCard'
import LoadingState from '@/components/admin/LoadingState'
import EmptyState from '@/components/admin/EmptyState'
import { API_BASE_URL } from '@/config/api'
import { validateArrayData, getTotalCount } from '@/utils/data-validation'
import { getAuthHeaders } from '@/lib/auth-utils'

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
      
      // 并行获取多个统计数据
      const [
        articlesRes, 
        usersRes, 
        subsRes,
        categoriesRes,
        tagsRes,
        recentArticlesRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/articles/?skip=0&limit=1`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/users/?skip=0&limit=1`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/subscriptions/?skip=0&limit=1`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/categories/`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/tags/`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/articles/?skip=0&limit=5&sort=-created_at`, { headers })
      ])

      const articlesData = await articlesRes.json()
      const usersData = await usersRes.json()
      const subsData = await subsRes.json()
      const categoriesData = await categoriesRes.json()
      const tagsData = await tagsRes.json()
      const recentArticlesData = await recentArticlesRes.json()

      // 数据验证和处理
      const articles = validateArrayData(articlesData);
      const users = validateArrayData(usersData);
      const categories = validateArrayData(categoriesData);
      const tags = validateArrayData(tagsData);
      const recentArticles = validateArrayData(recentArticlesData);
            
      // 计算总浏览量
      const totalViews = articles.reduce((sum: number, a: any) => sum + (a.view_count || 0), 0);
            
      setStats({
        articlesCount: getTotalCount(articlesData),
        usersCount: getTotalCount(usersData),
        viewsCount: totalViews,
        subscriptionsCount: getTotalCount(subsData),
        commentsCount: 0, // TODO: 添加评论API后更新
        categoriesCount: categories.length,
        tagsCount: tags.length,
        recentArticles: recentArticles.slice(0, 5) as Array<{ id: string; title: string; created_at: string; view_count: number; is_published: boolean }>
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <motion.div 
            className="w-20 h-20 border-4 border-tech-cyan/20 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-tech-cyan rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-tech-sky rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-tech-cyan" />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-foreground/70 font-medium">正在加载数据...</p>
          <p className="text-foreground/50 text-sm mt-1">请稍候片刻</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div 
        className="relative overflow-hidden rounded-3xl p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-tech-cyan/20 via-purple-500/10 to-tech-sky/20 backdrop-blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.1)_0%,transparent_50%)]" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                仪表盘
              </motion.h1>
              <motion.p 
                className="text-foreground/70 mt-2 text-lg"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                欢迎来到您的博客管理系统
              </motion.p>
            </div>
            
            <motion.div
              className="hidden lg:flex items-center gap-3 text-sm text-foreground/60 bg-glass/20 backdrop-blur-lg px-4 py-2 rounded-full border border-glass-border/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('zh-CN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
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
        {/* Recent Articles */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <GlassCardAdmin className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30">
                  <Clock className="w-5 h-5 text-tech-cyan" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">最近文章</h2>
                  <p className="text-sm text-foreground/60">最新发布的文章内容</p>
                </div>
              </div>
              <Link href="/admin/articles" className="text-sm text-tech-cyan hover:text-tech-cyan/80 flex items-center gap-1 transition-colors">
                查看全部
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {stats.recentArticles.length > 0 ? (
                stats.recentArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-glass/20 transition-all duration-300 group cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className={`p-2 rounded-lg ${article.is_published ? 'bg-green-500/20' : 'bg-foreground/10'}`}>
                      <FileText className={`w-4 h-4 ${article.is_published ? 'text-green-500' : 'text-foreground/50'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-tech-cyan transition-colors text-foreground">
                        {article.title}
                      </p>
                      <p className="text-xs text-foreground/50 mt-1">
                        {new Date(article.created_at).toLocaleDateString('zh-CN', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-foreground/50">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">{article.view_count || 0}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-tech-cyan/20 to-tech-sky/20 flex items-center justify-center"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FileText className="w-8 h-8 text-tech-cyan/50" />
                  </motion.div>
                  <p className="text-foreground/70 font-medium mb-2">暂无文章</p>
                  <p className="text-foreground/50 text-sm mb-4">开始创建您的第一篇博客文章</p>
                  <motion.a 
                    href="/admin/articles/new" 
                    className="inline-flex items-center gap-2 text-sm text-tech-cyan hover:text-tech-cyan/80 transition-colors group"
                    whileHover={{ x: 4 }}
                  >
                    创建第一篇文章
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </motion.a>
                </motion.div>
              )}
            </div>
          </GlassCardAdmin>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <GlassCardAdmin className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                <BarChart2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">快速操作</h2>
                <p className="text-sm text-foreground/60">常用的管理功能</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <QuickActionCard 
                href="/admin/articles/new" 
                icon={FileText} 
                title="写文章" 
                description="创建新文章" 
                delay={0.8}
              />
              <QuickActionCard 
                href="/admin/categories" 
                icon={Folder} 
                title="管理分类" 
                description="组织文章结构" 
                delay={0.9}
              />
              <QuickActionCard 
                href="/admin/tags" 
                icon={Tag} 
                title="管理标签" 
                description="添加关键词" 
                delay={1.0}
              />
              <QuickActionCard 
                href="/admin/users" 
                icon={Users} 
                title="管理用户" 
                description="用户权限控制" 
                delay={1.1}
              />
            </div>
          </GlassCardAdmin>
        </motion.div>
      </div>

      {/* Quick Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <GlassCardAdmin className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-tech-cyan/40 to-tech-sky/40">
              <TrendingUp className="w-5 h-5 text-tech-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">数据概览</h2>
              <p className="text-sm text-foreground/60">网站整体运行情况</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBlock 
              label="内容发布率" 
              value={stats.articlesCount > 0 ? '100%' : '0%'} 
              description="活跃度"
              color="text-green-500"
            />
            <StatBlock 
              label="平均浏览量" 
              value={stats.articlesCount > 0 ? Math.round(stats.viewsCount / stats.articlesCount).toLocaleString() : '0'} 
              description="次/篇文章"
              color="text-blue-500"
            />
            <StatBlock 
              label="用户活跃度" 
              value={stats.usersCount > 0 ? '78%' : '0%'} 
              description="回头率"
              color="text-purple-500"
            />
            <StatBlock 
              label="增长趋势" 
              value={'+23%'} 
              description="较上月"
              color="text-orange-500"
            />
          </div>
        </GlassCardAdmin>
      </motion.div>
    </div>
  )
}

interface QuickActionCardProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
}

function QuickActionCard({ href, icon: Icon, title, description, delay }: QuickActionCardProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border-2 border-dashed border-glass-border/30 hover:border-tech-cyan/50 p-4 transition-all duration-300 group bg-glass/10 hover:bg-glass/20 backdrop-blur-lg cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -2 }}
    >
      <Link href={href as any}>
        <div className="flex flex-col items-center text-center">
          <div className="p-2 rounded-lg bg-gradient-to-br from-foreground/10 to-foreground/5 transition-all duration-300 group-hover:from-tech-cyan/20 group-hover:to-tech-sky/20">
            <Icon className="w-6 h-6 text-foreground/50 group-hover:text-tech-cyan transition-colors" />
          </div>
          <h3 className="text-sm font-medium text-foreground mt-2 group-hover:text-tech-cyan transition-colors">
            {title}
          </h3>
          <p className="text-xs text-foreground/50 mt-1 group-hover:text-foreground/70 transition-colors">
            {description}
          </p>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 -translate-x-full group-hover:translate-x-full" />
      </Link>
    </motion.div>
  );
}

interface StatBlockProps {
  label: string;
  value: string;
  description: string;
  color: string;
}

function StatBlock({ label, value, description, color }: StatBlockProps) {
  return (
    <div className="text-center p-4 rounded-xl bg-glass/20 border border-glass-border/20 hover:bg-glass/30 transition-all duration-300">
      <p className="text-sm text-foreground/70 mb-1">{label}</p>
      <p className={`text-2xl font-bold mb-1 ${color}`}>
        {value}
      </p>
      <p className="text-xs text-foreground/50">{description}</p>
    </div>
  );
}
