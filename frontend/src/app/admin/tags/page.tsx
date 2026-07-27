'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { Plus, Edit, Trash2, Tag as TagIcon, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import Button from '@/components/admin/Button'
import FormInput from '@/components/admin/FormInput'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'

interface Tag {
  id: string
  name: string
  slug: string
  description: string
  color: string
  articles_count?: number
}

export default function TagsPage() {
  const { success, error } = useToast()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tag: Tag | null }>({ 
    open: false, 
    tag: null 
  })
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#06b6d4'
  })

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminApi.tags.list()
      const tagsData = data && typeof data === 'object' && 'items' in data && Array.isArray((data as Record<string, unknown>).items)
        ? (data as Record<string, unknown>).items as Tag[]
        : Array.isArray(data) ? data as Tag[] : []
      setTags(tagsData)
    } catch (err) {
      console.error('Failed to fetch tags:', err)
      error('加载标签列表失败')
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTag) {
        await adminApi.tags.update(editingTag.id, formData)
        success('标签已更新')
      } else {
        await adminApi.tags.create(formData)
        success('标签已创建')
      }
      
      setShowModal(false)
      setEditingTag(null)
      setFormData({ name: '', slug: '', description: '', color: '#06b6d4' })
      fetchTags()
    } catch (err) {
      console.error('Failed to save tag:', err)
      error('保存标签失败，请重试')
    }
  }

  const deleteTag = async () => {
    if (!deleteDialog.tag) {return}
    
    try {
      await adminApi.tags.delete(deleteDialog.tag.id)
      success('标签已删除')
      fetchTags()
    } catch (err) {
      console.error('Failed to delete tag:', err)
      error('删除标签失败，请重试')
    } finally {
      setDeleteDialog({ open: false, tag: null })
    }
  }

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || '',
      color: tag.color || '#06b6d4'
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
                <TagIcon className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  标签管理
                </h1>
                <p className="text-foreground/60 mt-0.5">管理文章标签</p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => {
                  setEditingTag(null)
                  setFormData({ name: '', slug: '', description: '', color: '#06b6d4' })
                  setShowModal(true)
                }}
                variant="primary"
                leftIcon={Plus}
              >
                新建标签
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
          ) : tags.length === 0 ? (
            <EmptyState
              variant="create"
              title="暂无标签"
              description="开始创建您的第一个文章标签"
              action={{
                label: '创建第一个标签',
                onClick: () => setShowModal(true),
                icon: Plus
              }}
              icon={TagIcon}
            />
          ) : (
            <div className="flex flex-wrap gap-3">
              <AnimatePresence>
                {tags.map((tag, index) => (
                  <GlassCardAdmin variant="selectable" entrance={false}
                    key={tag.id}
                    className={'group rounded-2xl px-4 py-3'}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -2, scale: 1.05 }}
                    layout
                  >
                    <div className="flex items-center gap-3">
                      <motion.span
                        className="w-4 h-4 rounded-full shadow-lg shadow-tech-cyan/20"
                        style={{ backgroundColor: tag.color }}
                        animate={{
                          boxShadow: `0 0 ${tag.color}40`
                        }}
                        whileHover={{ scale: 1.2 }}
                      />
                      <span className="font-medium text-foreground font-semibold">
                        {tag.name}
                      </span>
                      <span className="text-sm text-foreground/50 px-2 py-0.5 bg-glass/20 rounded-full">
                        {tag.articles_count || 0}
                      </span>
                      
                      <motion.div 
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={false}
                        animate={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      >
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(tag)
                          }}
                          className="p-1.5 text-foreground/40 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialog({ open: true, tag })
                          }}
                          className="p-1.5 text-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    </div>
                  </GlassCardAdmin>
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
              className="relative bg-background/95 backdrop-blur-xl border border-glass-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-2 rounded-lg bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5 text-tech-cyan" />
                  </motion.div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {editingTag ? '编辑标签' : '新建标签'}
                  </h2>
                </div>
                <motion.button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-foreground/40 hover:text-foreground hover:bg-glass/20 rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <FormInput
                  label="标签名称"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入标签名称"
                  required
                />
                
                <FormInput
                  label="Slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="标签的唯一标识"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="标签描述（可选）"
                    className="w-full px-4 py-3 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 focus:border-transparent transition-colors duration-200 text-foreground placeholder:text-foreground/30"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    颜色
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <motion.button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          "w-8 h-8 rounded-full transition-transform duration-200 shadow-lg",
                          formData.color === color && "ring-2 ring-offset-2 ring-tech-cyan scale-110 shadow-tech-cyan/40"
                        )}
                        style={{ backgroundColor: color, boxShadow: formData.color === color ? `0 0 20px ${color}40` : `0 4px 6px -1px ${color}30` }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-glass-border/30">
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    variant="ghost"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    {editingTag ? '保存' : '创建'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, tag: null })}
        onConfirm={deleteTag}
        title="确认删除标签"
        description={`确定要删除标签「${deleteDialog.tag?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
