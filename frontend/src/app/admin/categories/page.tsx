'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { Plus, Edit, Trash2, X, Folder, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import Button from '@/components/admin/Button'
import FormInput from '@/components/admin/FormInput'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  color: string
  icon: string
  sort_order: number
  is_active: boolean
  articles_count?: number
}

export default function CategoriesPage() {
  const { success, error } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; category: Category | null }>({ 
    open: false, 
    category: null 
  })
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#06b6d4',
    icon: 'folder'
  })

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminApi.categories.list()
      const categoriesData = Array.isArray(data) ? data : []
      setCategories(categoriesData)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      error('加载分类列表失败')
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCategory) {
        await adminApi.categories.update(editingCategory.id, formData)
        success('分类已更新')
      } else {
        await adminApi.categories.create(formData)
        success('分类已创建')
      }
      
      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', slug: '', description: '', color: '#06b6d4', icon: 'folder' })
      fetchCategories()
    } catch (err: unknown) {
      console.error('Failed to save category:', err)
      let errorMessage = '保存分类失败，请重试'
      
      if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          errorMessage = String((err as { message: unknown }).message)
        }
        if ('status' in err) {
          const status = (err as { status: unknown }).status
          if (status === 401) {
            errorMessage = '未登录或登录已过期，请重新登录'
          } else if (status === 403) {
            errorMessage = '没有权限执行此操作'
          }
        }
      }
      
      error(errorMessage)
    }
  }

  const deleteCategory = async () => {
    if (!deleteDialog.category) {return}
    
    try {
      await adminApi.categories.delete(deleteDialog.category.id)
      success('分类已删除')
      fetchCategories()
    } catch (err) {
      console.error('Failed to delete category:', err)
      error('删除分类失败，请重试')
    } finally {
      setDeleteDialog({ open: false, category: null })
    }
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color || '#06b6d4',
      icon: category.icon || 'folder'
    })
    setShowModal(true)
  }

  const colorOptions = [
    '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', 
    '#10b981', '#ef4444', '#3b82f6', '#6366f1'
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCardAdmin className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Folder className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  分类管理
                </h1>
                <p className="text-foreground/60 mt-0.5">管理文章分类</p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => {
                  setEditingCategory(null)
                  setFormData({ name: '', slug: '', description: '', color: '#06b6d4', icon: 'folder' })
                  setShowModal(true)
                }}
                variant="primary"
                leftIcon={Plus}
              >
                新建分类
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
        <GlassCardAdmin className="p-6">
          {loading ? (
            <LoadingState message="加载中..." size="md" variant="dots" />
          ) : categories.length === 0 ? (
            <EmptyState
              variant="create"
              title="暂无分类"
              description="开始创建您的第一个文章分类"
              action={{
                label: '创建第一个分类',
                onClick: () => setShowModal(true),
                icon: Plus
              }}
              icon={Folder}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    className="relative overflow-hidden rounded-2xl border-2 border-glass-border/30 hover:border-tech-cyan/50 p-6 bg-glass/10 hover:bg-glass/20 backdrop-blur-lg transition-all duration-300 cursor-pointer group"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    layout
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-tech-cyan/5 to-tech-sky/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <motion.div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: category.color }}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <span className="text-xl font-bold text-white dark:text-gray-100">
                            {category.name.charAt(0)}
                          </span>
                        </motion.div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <motion.button
                            onClick={(e) => { e.stopPropagation(); openEditModal(category) }}
                            className="p-2 text-foreground/60 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-all duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, category }) }}
                            className="p-2 text-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-foreground text-lg group-hover:text-tech-cyan transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-foreground/50 font-mono">
                        /{category.slug}
                      </p>
                      
                      {category.description && (
                        <p className="mt-3 text-sm text-foreground/70 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      
                      <div className="mt-4 flex items-center gap-2">
                        <motion.span
                          className="px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${category.color}20`,
                            color: category.color
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          {category.articles_count || 0} 篇文章
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </GlassCardAdmin>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />
            <motion.div 
              className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-2.5 rounded-xl bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5 text-tech-cyan" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {editingCategory ? '编辑分类' : '新建分类'}
                  </h2>
                </div>
                <motion.button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-foreground/60 hover:text-foreground hover:bg-glass/10 rounded-xl transition-all duration-200"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    分类名称
                  </label>
                  <FormInput
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入分类名称"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Slug
                  </label>
                  <FormInput
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="输入URL友好的标识符"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="输入分类描述（可选）"
                    className="w-full px-4 py-3 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all duration-200 bg-glass/10 text-foreground placeholder:text-foreground/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    颜色
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {colorOptions.map((color) => (
                      <motion.button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          "w-10 h-10 rounded-xl transition-transform shadow-md",
                          formData.color === color && "ring-2 ring-offset-2 ring-tech-cyan scale-110"
                        )}
                        style={{ backgroundColor: color }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-glass-border/30">
                  <motion.button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 text-foreground hover:bg-glass/10 rounded-xl font-medium transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-tech-cyan to-tech-sky text-white dark:text-gray-100 rounded-xl font-medium hover:shadow-lg hover:shadow-tech-cyan/25 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingCategory ? '保存' : '创建'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, category: null })}
        onConfirm={deleteCategory}
        title="确认删除分类"
        description={`确定要删除分类「${deleteDialog.category?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
