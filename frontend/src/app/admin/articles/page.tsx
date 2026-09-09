'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion } from '@/lib/framer-motion'
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
  RefreshCw,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import FormInput from '@/components/admin/FormInput'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'
import DataTable, { type Column } from '@/components/ui/DataTable'
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
  // 当前页未过滤的原始数据，用于筛选按钮计数（否则计数基于已过滤列表，恒为错误值）
  const [pageItems, setPageItems] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  // 防抖后的搜索词：fetchArticles 依赖它而不是 searchQuery，避免每次击键都发请求
  const [debouncedSearch, setDebouncedSearch] = useState('')
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
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      
      const page = await adminApi.articles.list({
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        published_only: false
      }) as { items?: Article[]; total?: number }

      const items = Array.isArray(page?.items) ? page.items : []

      /* 注意：filter / searchQuery 目前仍是「当前页内」的客户端过滤，
         过滤后不再改写 total —— total 必须始终是服务端返回的总条数，
         否则总页数会被算成当前页条数，翻页恒为 1 页（此前即为此故障）。 */
      let visible = items

      if (filter === 'published') {
        visible = visible.filter((a: Article) => a.is_published)
      } else if (filter === 'draft') {
        visible = visible.filter((a: Article) => !a.is_published)
      }

      if (debouncedSearch) {
        visible = visible.filter((a: Article) =>
          a.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          a.excerpt?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      }

      setPageItems(items)
      setArticles(visible)
      setTotal(typeof page?.total === 'number' ? page.total : items.length)
      // 翻页/筛选/搜索后清空选择，避免跨页残留不可见的选中项
      setSelectedArticles(new Set())
    } catch (err) {
      console.error('Failed to fetch articles:', err)
      error('加载文章列表失败')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filter, debouncedSearch, error])
  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // 立即应用搜索词（跳过防抖）；列表由 fetchArticles 的副作用触发，无需重复调用
    setCurrentPage(1)
    setDebouncedSearch(searchQuery.trim())
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
  /* DataTable 列定义：保留原有的图标、状态徽章与操作按钮组。
     选择列的勾选状态由本页 selectedArticles 持有（未用 DataTable 内置 selectable），
     以便批量操作后清空选择能与表格显示保持一致。 */
  const articleColumns: Column<Article>[] = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedArticles.size === articles.length && articles.length > 0}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded border-glass-border text-primary focus:ring-ring/50 cursor-pointer"
          aria-label="全选"
        />
      ),
      width: 48,
      render: (_v, article) => (
        <input
          type="checkbox"
          checked={selectedArticles.has(article.id)}
          onChange={() => toggleSelect(article.id)}
          className="w-4 h-4 rounded border-glass-border text-primary focus:ring-ring/50 cursor-pointer"
          aria-label={`选择《${article.title}》`}
        />
      ),
    },
    {
      key: 'title',
      title: '文章信息',
      render: (_v, article) => (
        <div className="flex items-center gap-3">
          <motion.div
            className={cn('p-2 rounded-lg shrink-0', article.is_published ? 'bg-success/10' : 'bg-foreground/5')}
            whileHover={{ scale: 1.05 }}
          >
            {article.is_pinned ? (
              <Pin className="w-4 h-4 text-accent" />
            ) : (
              <FileText className={cn('w-4 h-4', article.is_published ? 'text-success' : 'text-foreground/40')} />
            )}
          </motion.div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate max-w-xs group-hover:text-primary transition-colors">
              {article.title}
            </p>
            <p className="text-sm text-foreground/50 truncate">/{article.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'is_published',
      title: '状态',
      render: (_v, article) => (
        <div className="flex flex-wrap gap-1.5">
          <motion.span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full',
              article.is_published ? 'bg-success/10 text-success' : 'bg-foreground/5 text-foreground/60'
            )}
            whileHover={{ scale: 1.05 }}
          >
            {article.is_published ? (
              <><CheckCircle2 className="w-3 h-3" />已发布</>
            ) : (
              <><XCircle className="w-3 h-3" />草稿</>
            )}
          </motion.span>
          {article.is_featured && (
            <motion.span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-warning/10 text-warning"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              <Star className="w-3 h-3" />精选
            </motion.span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      title: '分类',
      render: (_v, article) => (
        <span className="text-sm text-foreground/70">{article.category?.name || '-'}</span>
      ),
    },
    {
      key: 'view_count',
      title: '浏览量',
      render: (_v, article) => (
        <div className="flex items-center gap-1.5 text-foreground/70">
          <Eye className="w-4 h-4 text-foreground/40" />
          <span className="text-sm font-medium">{article.view_count?.toLocaleString() || 0}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      title: '时间',
      render: (_v, article) => (
        <div
          className="text-sm text-foreground/70 tabular-nums"
          title={`作者：${article.author?.full_name || article.author?.username || '未知'}`}
        >
          {article.created_at ? new Date(article.created_at).toLocaleDateString('zh-CN') : '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      cellClassName: 'text-right',
      render: (_v, article) => (
        <div className="flex items-center justify-end gap-1">
          {[
            {
              icon: Pin,
              onClick: () => togglePin(article),
              active: article.is_pinned,
              activeColor: 'text-accent bg-accent/10',
              tooltip: article.is_pinned ? '取消置顶' : '置顶',
            },
            {
              icon: Star,
              onClick: () => toggleFeature(article),
              active: article.is_featured,
              activeColor: 'text-warning bg-warning/10',
              tooltip: article.is_featured ? '取消精选' : '精选',
            },
            {
              icon: article.is_published ? XCircle : CheckCircle2,
              onClick: () => togglePublish(article),
              active: false,
              activeColor: '',
              hoverColor: article.is_published
                ? 'text-warning hover:bg-warning/10'
                : 'text-success hover:bg-success/10',
              tooltip: article.is_published ? '下架' : '发布',
            },
          ].map((action) => (
            <motion.button
              key={action.tooltip}
              onClick={action.onClick}
              disabled={actionLoading === article.id}
              className={cn(
                'p-2 rounded-lg transition-colors duration-200',
                action.active ? action.activeColor : action.hoverColor || 'text-foreground/40 hover:text-foreground/70 hover:bg-glass/30',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title={action.tooltip}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <action.icon className="w-4 h-4" />
            </motion.button>
          ))}

          {/* 用 next/link 保持 SPA 内导航，避免 <a> 触发整页刷新 */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link
              href={`/admin/articles/${article.id}`}
              className="p-2 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200 inline-block"
              title="编辑"
              aria-label={`编辑 ${article.title}`}
            >
              <Edit className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link
              href={`/posts/${article.slug}`}
              target="_blank"
              className="p-2 text-foreground/40 hover:text-success hover:bg-success/10 rounded-lg transition-colors duration-200 inline-block"
              title="预览"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </motion.div>

          <span className="w-px h-5 bg-border/60 mx-0.5" aria-hidden="true" />
          <motion.button
            onClick={() => setDeleteDialog({ open: true, article })}
            disabled={actionLoading === article.id}
            className="p-2 text-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors duration-200 disabled:opacity-50"
            title="删除"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      ),
    },
  ]

  const filterButtons: { key: 'all' | 'published' | 'draft'; label: string; count: number }[] = useMemo(() => [
    { key: 'all', label: '全部', count: pageItems.length },
    { key: 'published', label: '已发布', count: pageItems.filter(a => a.is_published).length },
    { key: 'draft', label: '草稿', count: pageItems.filter(a => !a.is_published).length },
  ], [pageItems])
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-tech-cyan to-tech-sky text-foreground rounded-xl hover:shadow-lg hover:shadow-tech-cyan/25 transition-colors duration-300 font-medium"
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
                className="p-2.5 rounded-xl bg-glass/30 hover:bg-glass/50 border border-glass-border/30 transition-colors duration-200"
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
                      "px-4 py-2.5 text-sm font-medium transition-colors duration-200 flex items-center gap-2 scroll-mt-24",
                      filter === btn.key
                        ? "bg-gradient-to-r from-tech-cyan to-tech-sky text-foreground"
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tech-cyan to-tech-sky text-foreground rounded-xl font-medium hover:shadow-lg hover:shadow-tech-cyan/25 transition-colors duration-300"
                >
                  <Plus className="w-5 h-5" />
                  创建第一篇文章
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            /* 表格与分页改用 DataTable 基座（服务端模式）：
               data 为当前页，total/page 由本页持有，翻页回调触发重新取数。
               toolbar={false} —— 本页已有自己的搜索框与「全部/已发布/草稿」筛选按钮。
               选择列做成普通列，勾选状态仍由本页的 selectedArticles 持有，
               这样批量操作后清空选择能与表格保持一致。 */
            <DataTable<Article>
              data={articles}
              keyField="id"
              toolbar={false}
              pageSize={pageSize}
              columns={articleColumns}
              serverSide={{
                total,
                page: currentPage,
                onPageChange: setCurrentPage,
              }}
            />
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
