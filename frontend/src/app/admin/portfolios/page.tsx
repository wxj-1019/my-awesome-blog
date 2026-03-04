'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, 
  Search, 
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Github,
  Star,
  Calendar,
  X,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import Button from '@/components/admin/Button'
import FormInput from '@/components/admin/FormInput'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import LoadingState from '@/components/admin/LoadingState'
import EmptyState from '@/components/admin/EmptyState'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'

interface PortfolioItem {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image: string | null
  demo_url: string | null
  github_url: string | null
  technologies: string[]
  start_date: string | null
  end_date: string | null
  status: 'completed' | 'in_progress' | 'planned'
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  completed: { label: '已完成', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  in_progress: { label: '进行中', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  planned: { label: '计划中', color: 'bg-gray-500/20 text-gray-400 dark:text-gray-500 dark:text-gray-400 border-gray-500/30', icon: Sparkles },
}

export default function PortfoliosPage() {
  const { success, error } = useToast()
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; portfolio: PortfolioItem | null }>({ 
    open: false, 
    portfolio: null 
  })
  const [editDialog, setEditDialog] = useState<{ open: boolean; portfolio: PortfolioItem | null; mode: 'create' | 'edit' }>({ 
    open: false, 
    portfolio: null,
    mode: 'create'
  })
  const pageSize = 12

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    cover_image: '',
    demo_url: '',
    github_url: '',
    technologies: '',
    status: 'completed',
    is_featured: false,
  })

  const fetchPortfolios = useCallback(async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * pageSize
      
      const data: any = await adminApi.portfolio.list({
        skip,
        limit: pageSize,
        is_active: true
      })
      
      let filteredData = Array.isArray(data) ? data : []
      
      if (searchQuery) {
        filteredData = filteredData.filter((p: PortfolioItem) => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.technologies?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      }
      
      if (statusFilter) {
        filteredData = filteredData.filter((p: PortfolioItem) => p.status === statusFilter)
      }
      
      setPortfolios(filteredData)
      setTotalCount(filteredData.length)
    } catch (err) {
      console.error('Failed to fetch portfolios:', err)
      error('加载作品集失败')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, statusFilter, error])

  useEffect(() => {
    fetchPortfolios()
  }, [fetchPortfolios])

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      cover_image: '',
      demo_url: '',
      github_url: '',
      technologies: '',
      status: 'completed',
      is_featured: false,
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setEditDialog({ open: true, portfolio: null, mode: 'create' })
  }

  const openEditDialog = (portfolio: PortfolioItem) => {
    setFormData({
      title: portfolio.title,
      slug: portfolio.slug,
      description: portfolio.description || '',
      cover_image: portfolio.cover_image || '',
      demo_url: portfolio.demo_url || '',
      github_url: portfolio.github_url || '',
      technologies: portfolio.technologies?.join(', ') || '',
      status: portfolio.status,
      is_featured: portfolio.is_featured,
    })
    setEditDialog({ open: true, portfolio, mode: 'edit' })
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      error('请输入作品标题')
      return
    }

    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || generateSlug(formData.title),
        description: formData.description.trim() || null,
        cover_image: formData.cover_image.trim() || null,
        demo_url: formData.demo_url.trim() || null,
        github_url: formData.github_url.trim() || null,
        technologies: formData.technologies.split(',').map(t => t.trim()).filter(Boolean),
        status: formData.status,
        is_featured: formData.is_featured,
      }

      if (editDialog.mode === 'create') {
        await adminApi.portfolio.create(payload)
        success('作品创建成功')
      } else if (editDialog.portfolio) {
        await adminApi.portfolio.update(editDialog.portfolio.id, payload)
        success('作品更新成功')
      }

      setEditDialog({ open: false, portfolio: null, mode: 'create' })
      fetchPortfolios()
    } catch (err) {
      console.error('Failed to save portfolio:', err)
      error(editDialog.mode === 'create' ? '创建作品失败' : '更新作品失败')
    }
  }

  const deletePortfolio = async () => {
    if (!deleteDialog.portfolio) return
    
    try {
      await adminApi.portfolio.delete(deleteDialog.portfolio.id)
      success('作品已删除')
      fetchPortfolios()
    } catch (err) {
      console.error('Failed to delete portfolio:', err)
      error('删除作品失败，请重试')
    } finally {
      setDeleteDialog({ open: false, portfolio: null })
    }
  }

  const toggleFeatured = async (portfolio: PortfolioItem) => {
    try {
      await adminApi.portfolio.update(portfolio.id, { is_featured: !portfolio.is_featured })
      success(portfolio.is_featured ? '已取消精选' : '已设为精选')
      fetchPortfolios()
    } catch (err) {
      console.error('Failed to toggle featured:', err)
      error('更新精选状态失败')
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCardAdmin className="p-6" variant="primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Briefcase className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  作品集管理
                </h1>
                <p className="text-foreground/60 mt-0.5 flex items-center gap-4">
                  <span>管理展示的作品项目</span>
                  <span className="text-xs px-2 py-0.5 bg-tech-cyan/20 text-tech-cyan rounded-full">
                    共 {totalCount} 个作品
                  </span>
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={openCreateDialog}
                variant="primary"
                leftIcon={Plus}
              >
                新建作品
              </Button>
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
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <FormInput
                type="text"
                placeholder="搜索作品名称、描述或技术栈..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={Search}
              />
            </div>
            
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => { setStatusFilter(''); setCurrentPage(1); }}
                  variant={statusFilter === '' ? 'primary' : 'ghost'}
                  className={cn(statusFilter === '' && "bg-tech-cyan")}
                >
                  全部
                </Button>
              </motion.div>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <motion.div key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => { setStatusFilter(key); setCurrentPage(1); }}
                    variant={statusFilter === key ? 'primary' : 'ghost'}
                    className={cn(statusFilter === key && "bg-tech-cyan")}
                  >
                    <config.icon className="w-4 h-4 mr-1" />
                    {config.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCardAdmin>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {loading ? (
          <div className="p-12">
            <GlassCardAdmin variant="secondary">
              <LoadingState message="加载中..." size="md" variant="dots" />
            </GlassCardAdmin>
          </div>
        ) : portfolios.length === 0 ? (
          <GlassCardAdmin className="p-12">
            <EmptyState
              variant="search"
              title={searchQuery || statusFilter ? '未找到匹配的作品' : '暂无作品'}
              description={searchQuery || statusFilter ? '尝试调整搜索条件' : '点击「新建作品」添加您的第一个作品'}
              icon={Briefcase}
            />
          </GlassCardAdmin>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {portfolios.map((portfolio, index) => {
                const statusInfo = STATUS_CONFIG[portfolio.status]
                return (
                  <motion.div
                    key={portfolio.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlassCardAdmin 
                      className="overflow-hidden group hover:-translate-y-1 transition-transform duration-200"
                      variant="secondary"
                    >
                      {portfolio.cover_image ? (
                        <div className="aspect-video bg-glass/20 relative overflow-hidden">
                          <img 
                            src={portfolio.cover_image} 
                            alt={portfolio.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {portfolio.is_featured && (
                            <div className="absolute top-2 right-2">
                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-tech-cyan/20 to-tech-sky/20 flex items-center justify-center relative">
                          <Briefcase className="w-12 h-12 text-tech-cyan/50" />
                          {portfolio.is_featured && (
                            <div className="absolute top-2 right-2">
                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-foreground line-clamp-1">{portfolio.title}</h3>
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded border flex-shrink-0",
                            statusInfo.color
                          )}>
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        {portfolio.description && (
                          <p className="text-sm text-foreground/60 line-clamp-2 mb-3">
                            {portfolio.description}
                          </p>
                        )}
                        
                        {portfolio.technologies && portfolio.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {portfolio.technologies.slice(0, 4).map((tech, i) => (
                              <span 
                                key={i}
                                className="px-2 py-0.5 text-xs bg-glass/30 text-foreground/70 rounded"
                              >
                                {tech}
                              </span>
                            ))}
                            {portfolio.technologies.length > 4 && (
                              <span className="px-2 py-0.5 text-xs text-foreground/50">
                                +{portfolio.technologies.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-3">
                          {portfolio.demo_url && (
                            <a
                              href={portfolio.demo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-tech-cyan hover:bg-tech-cyan/10 rounded transition-colors"
                              title="演示链接"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {portfolio.github_url && (
                            <a
                              href={portfolio.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-glass/20 rounded transition-colors"
                              title="GitHub"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-glass-border/30">
                          <motion.button
                            onClick={() => toggleFeatured(portfolio)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors",
                              portfolio.is_featured 
                                ? "text-yellow-400 bg-yellow-400/10" 
                                : "text-foreground/50 hover:text-yellow-400 hover:bg-yellow-400/10"
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Star className={cn("w-3 h-3", portfolio.is_featured && "fill-yellow-400")} />
                            {portfolio.is_featured ? '已精选' : '设为精选'}
                          </motion.button>
                          
                          <div className="flex items-center gap-1">
                            <motion.button
                              onClick={() => openEditDialog(portfolio)}
                              className="p-2 text-foreground/50 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title="编辑"
                            >
                              <Edit3 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => setDeleteDialog({ open: true, portfolio })}
                              className="p-2 text-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </GlassCardAdmin>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {totalPages > 1 && (
          <GlassCardAdmin className="mt-6 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground/50">
                共 {totalCount} 个作品，第 {currentPage}/{totalPages} 页
              </p>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-glass-border/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-glass/10 transition-all"
                  whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                  whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </motion.button>
                <motion.button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-glass-border/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-glass/10 transition-all"
                  whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                  whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </GlassCardAdmin>
        )}
      </motion.div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, portfolio: null })}
        onConfirm={deletePortfolio}
        title="确认删除作品"
        description={`确定要删除作品「${deleteDialog.portfolio?.title}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />

      <AnimatePresence>
        {editDialog.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setEditDialog({ open: false, portfolio: null, mode: 'create' })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <GlassCardAdmin className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">
                    {editDialog.mode === 'create' ? '新建作品' : '编辑作品'}
                  </h2>
                  <motion.button
                    onClick={() => setEditDialog({ open: false, portfolio: null, mode: 'create' })}
                    className="p-2 text-foreground/50 hover:text-foreground hover:bg-glass/20 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">
                        作品标题 <span className="text-red-400">*</span>
                      </label>
                      <FormInput
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                          const title = e.target.value
                          setFormData(prev => ({
                            ...prev,
                            title,
                            slug: prev.slug || generateSlug(title)
                          }))
                        }}
                        placeholder="输入作品标题"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Slug</label>
                      <FormInput
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="url-friendly-identifier"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-glass/30 border border-glass-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 resize-none"
                      rows={3}
                      placeholder="作品描述..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">封面图片</label>
                      <FormInput
                        type="text"
                        value={formData.cover_image}
                        onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">状态</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-glass/30 border border-glass-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan/50"
                      >
                        <option value="completed">已完成</option>
                        <option value="in_progress">进行中</option>
                        <option value="planned">计划中</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">演示链接</label>
                      <FormInput
                        type="text"
                        value={formData.demo_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, demo_url: e.target.value }))}
                        placeholder="https://demo.example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">GitHub 链接</label>
                      <FormInput
                        type="text"
                        value={formData.github_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                        placeholder="https://github.com/user/repo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      技术栈 <span className="text-foreground/40 text-xs">（用逗号分隔）</span>
                    </label>
                    <FormInput
                      type="text"
                      value={formData.technologies}
                      onChange={(e) => setFormData(prev => ({ ...prev, technologies: e.target.value }))}
                      placeholder="React, TypeScript, Tailwind CSS"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-glass/20 rounded-lg">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="w-4 h-4 rounded border-glass-border text-tech-cyan focus:ring-tech-cyan/50"
                    />
                    <label htmlFor="is_featured" className="text-sm text-foreground">
                      设为精选作品（将在首页展示）
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-glass-border/30">
                  <Button
                    onClick={() => setEditDialog({ open: false, portfolio: null, mode: 'create' })}
                    variant="ghost"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSave}
                    variant="primary"
                  >
                    {editDialog.mode === 'create' ? '创建' : '保存'}
                  </Button>
                </div>
              </GlassCardAdmin>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
