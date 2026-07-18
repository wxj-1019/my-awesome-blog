'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Pin,
  Star,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import FormInput from '@/components/admin/FormInput'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'
interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  is_published: boolean
  is_featured: boolean
  is_pinned: boolean
  view_count: number
  created_at: string
  updated_at: string
  author?: {
    username: string
    full_name?: string
  }
  category?: {
    name: string
  }
}
export default function ArticlesPage() {
  const { success, error } = useToast();
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; article: Article | null }>({ 
    open: false, 
    article: null 
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const pageSize = 10
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      
      const data = await adminApi.articles.list({
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        published_only: false
      })
      
      let filteredArticles = Array.isArray(data) ? data : []
      
      if (filter === 'published') {
        filteredArticles = filteredArticles.filter((a: Article) => a.is_published)
      } else if (filter === 'draft') {
        filteredArticles = filteredArticles.filter((a: Article) => !a.is_published)
      }
      
      if (searchQuery) {
        filteredArticles = filteredArticles.filter((a: Article) => 
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      setArticles(filteredArticles)
      setTotal(filteredArticles.length)
    } catch (err) {
      console.error('Failed to fetch articles:', err)
      error('加载文章列表失败')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filter, searchQuery, error])
  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchArticles()
  }
  const deleteArticle = async () => {
    if (!deleteDialog.article) {return}
    
    try {
      setActionLoading(deleteDialog.article.id)
      await adminApi.articles.delete(deleteDialog.article.id)
      success('文章已删除')
      fetchArticles()
    } catch (err) {
      console.error('Failed to delete article:', err)
      error('删除文章失败，请重试')
    } finally {
      setActionLoading(null)
      setDeleteDialog({ open: false, article: null })
    }
  }
  const togglePublish = async (article: Article) => {
    try {
      setActionLoading(article.id)
      await adminApi.articles.update(article.id, { is_published: !article.is_published })
      success(article.is_published ? '文章已下架' : '文章已发布')
      fetchArticles()
    } catch (err) {
      console.error('Failed to toggle publish:', err)
      error('操作失败，请重试')
    } finally {
      setActionLoading(null)
    }
  }
  const toggleFeature = async (article: Article) => {
    try {
      setActionLoading(article.id)
      await adminApi.articles.update(article.id, { is_featured: !article.is_featured })
      success(article.is_featured ? '已取消精选' : '已设为精选')
      fetchArticles()
    } catch (err) {
      console.error('Failed to toggle feature:', err)
      error('操作失败，请重试')
    } finally {
      setActionLoading(null)
    }
  }
  const togglePin = async (article: Article) => {
    try {
      setActionLoading(article.id)
      await adminApi.articles.update(article.id, { is_pinned: !article.is_pinned })
      success(article.is_pinned ? '已取消置顶' : '已置顶')
      fetchArticles()
    } catch (err) {
      console.error('Failed to toggle pin:', err)
      error('操作失败，请重试')
    } finally {
      setActionLoading(null)
    }
  }
  const toggleSelectAll = () => {
    if (selectedArticles.size === articles.length) {
      setSelectedArticles(new Set())
    } else {
      setSelectedArticles(new Set(articles.map(a => a.id)))
    }
  }
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedArticles)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedArticles(newSelected)
  }
  const totalPages = Math.ceil(total / pageSize)
  const filterButtons: { key: 'all' | 'published' | 'draft'; label: string; count: number }[] = useMemo(() => [
    { key: 'all', label: '全部', count: articles.length },
    { key: 'published', label: '已发布', count: articles.filter(a => a.is_published).length },
    { key: 'draft', label: '草稿', count: articles.filter(a => !a.is_published).length },
  ], [articles])
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCardAdmin className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <FileText className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  文章管理
                </h1>
                <p className="text-foreground/60 mt-0.5">管理您的博客文章内容</p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/admin/articles/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-tech-cyan to-tech-sky text-white dark:text-gray-100 rounded-xl hover:shadow-lg hover:shadow-tech-cyan/25 transition-all duration-300 font-medium"
              >
                <Plus className="w-5 h-5" />
                新建文章
              </Link>
            </motion.div>
          </div>
        </GlassCardAdmin>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GlassCardAdmin className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <FormInput
                placeholder="搜索文章标题或摘要..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
                onClear={() => {
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="bg-glass/30"
              />
            </form>
            
            <div className="flex items-center gap-2">
              <motion.button
                onClick={fetchArticles}
                className="p-2.5 rounded-xl bg-glass/30 hover:bg-glass/50 border border-glass-border/30 transition-all duration-200"
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
              >
                <RefreshCw className={cn("w-5 h-5 text-foreground/60", loading && "animate-spin")} />
              </motion.button>
              
              <div className="flex rounded-xl overflow-hidden border border-glass-border/30 bg-glass/20">
                {filterButtons.map((btn) => (
                  <motion.button
                    key={btn.key}
                    onClick={() => { setFilter(btn.key); setCurrentPage(1); }}
                    className={cn(
                      "px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2",
                      filter === btn.key 
                        ? "bg-gradient-to-r from-tech-cyan to-tech-sky text-white dark:text-gray-100" 
                        : "text-foreground/70 hover:text-foreground hover:bg-glass/30"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {btn.label}
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-xs",
                      filter === btn.key 
                        ? "bg-white/20" 
                        : "bg-glass/30"
                    )}>
                      {btn.count}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </GlassCardAdmin>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCardAdmin className="overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <motion.div className="relative">
                <motion.div 
                  className="w-12 h-12 border-3 border-tech-cyan/20 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute inset-0 w-12 h-12 border-3 border-transparent border-t-tech-cyan rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <p className="text-foreground/60">加载中...</p>
            </div>
          ) : articles.length === 0 ? (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-tech-cyan/20 to-tech-sky/20 flex items-center justify-center"
                animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <FileText className="w-10 h-10 text-tech-cyan/50" />
              </motion.div>
              <h3 className="text-lg font-medium text-foreground/80 mb-2">暂无文章</h3>
              <p className="text-foreground/50 mb-6">开始创建您的第一篇博客文章吧</p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/admin/articles/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tech-cyan to-tech-sky text-white dark:text-gray-100 rounded-xl font-medium hover:shadow-lg hover:shadow-tech-cyan/25 transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  创建第一篇文章
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-glass/40 to-glass/20 border-b border-glass-border/50">
                    <tr>
                      <th className="px-4 py-4 text-left">
                        <motion.input
                          type="checkbox"
                          checked={selectedArticles.size === articles.length && articles.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-glass-border text-tech-cyan focus:ring-tech-cyan/50 cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">文章信息</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">分类</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">浏览量</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">时间</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-foreground/70 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/30">
                    <AnimatePresence>
                      {articles.map((article, index) => (
                        <motion.tr 
                          key={article.id} 
                          className={cn(
                            "hover:bg-glass/20 transition-colors group",
                            selectedArticles.has(article.id) && "bg-tech-cyan/5"
                          )}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          layout
                        >
                          <td className="px-4 py-4">
                            <motion.input
                              type="checkbox"
                              checked={selectedArticles.has(article.id)}
                              onChange={() => toggleSelect(article.id)}
                              className="w-4 h-4 rounded border-glass-border text-tech-cyan focus:ring-tech-cyan/50 cursor-pointer"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <motion.div
                                className={cn(
                                  "p-2 rounded-lg",
                                  article.is_published ? "bg-green-500/10" : "bg-foreground/5"
                                )}
                                whileHover={{ scale: 1.05 }}
                              >
                                {article.is_pinned ? (
                                  <Pin className="w-4 h-4 text-purple-500" />
                                ) : (
                                  <FileText className={cn(
                                    "w-4 h-4",
                                    article.is_published ? "text-green-500" : "text-foreground/40"
                                  )} />
                                )}
                              </motion.div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate max-w-xs group-hover:text-tech-cyan transition-colors">
                                  {article.title}
                                </p>
                                <p className="text-sm text-foreground/50 truncate">/{article.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              <motion.span 
                                className={cn(
                                  "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full",
                                  article.is_published 
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                                    : "bg-foreground/5 text-foreground/60"
                                )}
                                whileHover={{ scale: 1.05 }}
                              >
                                {article.is_published ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    已发布
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    草稿
                                  </>
                                )}
                              </motion.span>
                              {article.is_featured && (
                                <motion.span 
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring" }}
                                >
                                  <Star className="w-3 h-3" />
                                  精选
                                </motion.span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-foreground/70">
                              {article.category?.name || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-foreground/70">
                              <Eye className="w-4 h-4 text-foreground/40" />
                              <span className="text-sm font-medium">{article.view_count?.toLocaleString() || 0}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-foreground/70">
                                {article.created_at ? new Date(article.created_at).toLocaleDateString('zh-CN') : '-'}
                              </span>
                              <span className="text-xs text-foreground/40">
                                {article.author?.full_name || article.author?.username || '未知'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1">
                              {[
                                { 
                                  icon: Pin, 
                                  onClick: () => togglePin(article),
                                  active: article.is_pinned,
                                  activeColor: 'text-purple-500 bg-purple-500/10',
                                  tooltip: article.is_pinned ? '取消置顶' : '置顶'
                                },
                                { 
                                  icon: Star, 
                                  onClick: () => toggleFeature(article),
                                  active: article.is_featured,
                                  activeColor: 'text-yellow-500 bg-yellow-500/10',
                                  tooltip: article.is_featured ? '取消精选' : '精选'
                                },
                                { 
                                  icon: article.is_published ? XCircle : CheckCircle2, 
                                  onClick: () => togglePublish(article),
                                  active: false,
                                  activeColor: '',
                                  hoverColor: article.is_published ? 'text-orange-500 hover:bg-orange-500/10' : 'text-green-500 hover:bg-green-500/10',
                                  tooltip: article.is_published ? '下架' : '发布'
                                },
                              ].map((action) => (
                                <motion.button
                                  key={action.tooltip}
                                  onClick={action.onClick}
                                  disabled={actionLoading === article.id}
                                  className={cn(
                                    "p-2 rounded-lg transition-all duration-200",
                                    action.active ? action.activeColor : action.hoverColor || 'text-foreground/40 hover:text-foreground/70 hover:bg-glass/30',
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                  )}
                                  title={action.tooltip}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <action.icon className="w-4 h-4" />
                                </motion.button>
                              ))}
                              
                              <motion.a
                                href={`/admin/articles/${article.id}`}
                                className="p-2 text-foreground/40 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-all duration-200"
                                title="编辑"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Edit className="w-4 h-4" />
                              </motion.a>
                              
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Link
                                  href={`/posts/${article.slug}`}
                                  target="_blank"
                                  className="p-2 text-foreground/40 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-all duration-200 inline-block"
                                  title="预览"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </motion.div>
                              
                              <motion.button
                                onClick={() => setDeleteDialog({ open: true, article })}
                                disabled={actionLoading === article.id}
                                className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title="删除"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <motion.div 
                  className="px-6 py-4 border-t border-glass-border/30 flex items-center justify-between bg-glass/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-sm text-foreground/60">
                    共 <span className="font-medium text-foreground/80">{total}</span> 条记录，
                    第 <span className="font-medium text-foreground/80">{currentPage}</span>/{totalPages} 页
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 py-2 text-sm border border-glass-border/50 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-glass/30 transition-all duration-200"
                      whileHover={{ scale: currentPage === 1 ? 1 : 1.02 }}
                      whileTap={{ scale: currentPage === 1 ? 1 : 0.98 }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      上一页
                    </motion.button>
                    <motion.button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-4 py-2 text-sm border border-glass-border/50 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-glass/30 transition-all duration-200"
                      whileHover={{ scale: currentPage === totalPages ? 1 : 1.02 }}
                      whileTap={{ scale: currentPage === totalPages ? 1 : 0.98 }}
                    >
                      下一页
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </GlassCardAdmin>
      </motion.div>
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, article: null })}
        onConfirm={deleteArticle}
        title="确认删除文章"
        description={`确定要删除文章「${deleteDialog.article?.title}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}