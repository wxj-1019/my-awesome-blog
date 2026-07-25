'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { Plus, Edit, Trash2, Type, Sparkles, Power, PowerOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import Button from '@/components/admin/Button'
import FormInput from '@/components/admin/FormInput'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'

interface TypewriterContent {
  id: string
  content: string
  description?: string
  is_active: boolean
  priority: number
  created_at: string
  updated_at?: string
}

export default function TypewriterPage() {
  const { success, error } = useToast()
  const [contents, setContents] = useState<TypewriterContent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContent, setEditingContent] = useState<TypewriterContent | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; content: TypewriterContent | null }>({ 
    open: false, 
    content: null 
  })
  const [formData, setFormData] = useState({
    content: '',
    description: '',
    is_active: true,
    priority: 0
  })

  const fetchContents = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminApi.typewriter.list({ active_only: false })
      setContents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch typewriter contents:', err)
      error('加载打字机内容失败')
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingContent) {
        await adminApi.typewriter.update(editingContent.id, formData)
        success('打字机内容已更新')
      } else {
        await adminApi.typewriter.create(formData)
        success('打字机内容已创建')
      }
      
      setShowModal(false)
      setEditingContent(null)
      setFormData({ content: '', description: '', is_active: true, priority: 0 })
      fetchContents()
    } catch (err) {
      console.error('Failed to save typewriter content:', err)
      error('保存失败，请重试')
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.content) {return}
    
    try {
      await adminApi.typewriter.delete(deleteDialog.content.id)
      success('打字机内容已删除')
      fetchContents()
    } catch (err) {
      console.error('Failed to delete typewriter content:', err)
      error('删除失败，请重试')
    } finally {
      setDeleteDialog({ open: false, content: null })
    }
  }

  const handleToggleActive = async (content: TypewriterContent) => {
    try {
      if (content.is_active) {
        await adminApi.typewriter.deactivate(content.id)
        success('已停用')
      } else {
        await adminApi.typewriter.update(content.id, { is_active: true })
        success('已启用')
      }
      fetchContents()
    } catch (err) {
      console.error('Failed to toggle active:', err)
      error('操作失败')
    }
  }

  const openEditModal = (content: TypewriterContent) => {
    setEditingContent(content)
    setFormData({
      content: content.content,
      description: content.description || '',
      is_active: content.is_active,
      priority: content.priority
    })
    setShowModal(true)
  }

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
                <Type className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  打字机内容管理
                </h1>
                <p className="text-foreground/60 mt-0.5">管理首页打字机效果显示的文字</p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => {
                  setEditingContent(null)
                  setFormData({ content: '', description: '', is_active: true, priority: 0 })
                  setShowModal(true)
                }}
                variant="primary"
                leftIcon={Plus}
              >
                新建内容
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
          ) : contents.length === 0 ? (
            <EmptyState
              variant="create"
              title="暂无打字机内容"
              description="开始创建首页打字机效果显示的文字"
              action={{
                label: '创建第一个内容',
                onClick: () => setShowModal(true),
                icon: Plus
              }}
              icon={Type}
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {contents.sort((a, b) => a.priority - b.priority).map((content, index) => (
                  <motion.div
                    key={content.id}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border-2 p-4 transition-colors duration-300 cursor-pointer",
                      content.is_active 
                        ? "border-glass-border/30 hover:border-tech-cyan/50 bg-glass/10 hover:bg-glass/20" 
                        : "border-gray-500/30 bg-gray-500/5 hover:bg-gray-500/10 opacity-60"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -2 }}
                    layout
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-sm font-mono px-2 py-0.5 rounded",
                            content.is_active ? "bg-tech-cyan/20 text-tech-cyan" : "bg-gray-500/20 text-gray-400"
                          )}>
                            #{content.priority}
                          </span>
                          <p className="font-medium text-foreground truncate">
                            {content.content}
                          </p>
                          {content.is_active ? (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Power className="w-3 h-3" /> 启用
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <PowerOff className="w-3 h-3" /> 停用
                            </span>
                          )}
                        </div>
                        {content.description && (
                          <p className="text-sm text-foreground/50 mt-1 truncate">
                            {content.description}
                          </p>
                        )}
                      </div>
                      
                      <motion.div 
                        className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleActive(content)
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-colors duration-200",
                            content.is_active 
                              ? "text-green-400 hover:bg-green-500/10" 
                              : "text-gray-400 hover:bg-gray-500/10"
                          )}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {content.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(content)
                          }}
                          className="p-2 text-foreground/40 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialog({ open: true, content })
                          }}
                          className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
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
              className="relative bg-background/95 backdrop-blur-xl border border-glass-border/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
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
                    {editingContent ? '编辑打字机内容' : '新建打字机内容'}
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    显示内容 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={3}
                    placeholder="输入打字机效果显示的文字"
                    className="w-full px-4 py-3 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 focus:border-transparent transition-colors duration-200 text-foreground placeholder:text-foreground/30 resize-none"
                    required
                  />
                </div>
                
                <FormInput
                  label="描述（可选）"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="内容描述或备注"
                />
                
                <FormInput
                  label="优先级（数字越小越靠前）"
                  type="number"
                  value={formData.priority.toString()}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors duration-300",
                      formData.is_active ? "bg-tech-cyan" : "bg-gray-500/30"
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                      animate={{ left: formData.is_active ? "28px" : "4px" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                  <span className="text-sm text-foreground/70">
                    {formData.is_active ? '启用' : '停用'}
                  </span>
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
                    {editingContent ? '保存' : '创建'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, content: null })}
        onConfirm={handleDelete}
        title="确认删除"
        description={`确定要删除打字机内容「${deleteDialog.content?.content?.slice(0, 30)}...」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
