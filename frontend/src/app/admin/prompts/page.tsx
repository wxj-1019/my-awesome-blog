'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { Plus, Edit, Trash2, FileText, Sparkles, Copy, Star, FolderPlus, Download, Code, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import { validateArrayData } from '@/utils/data-validation'
import Button from '@/components/admin/Button'
import FormInput from '@/components/admin/FormInput'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'
interface Prompt {
  id: string
  name: string
  version: string
  content: string
  description?: string
  category?: string
  is_active: boolean
  is_system: boolean
  variables?: Record<string, unknown>
  ab_test_group?: string
  ab_test_percentage?: number
  usage_count?: number
  folder_id?: string
  created_at: string
  updated_at?: string
}
interface PromptFolder {
  id: string
  name: string
  color?: string
  icon?: string
  parent_id?: string
}
export default function PromptsPage() {
  const { success, error } = useToast()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [, setFolders] = useState<PromptFolder[]>([]);
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [editingFolder, setEditingFolder] = useState<PromptFolder | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; prompt: Prompt | null }>({ open: false, prompt: null })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showCodePreview, setShowCodePreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    version: '1.0.0',
    content: '',
    description: '',
    category: '',
    is_active: true,
    is_system: false,
    variables: '',
    ab_test_group: '',
    ab_test_percentage: 50
  })
  const [folderForm, setFolderForm] = useState({
    name: '',
    color: '#06b6d4',
    icon: 'folder'
  })
  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (selectedCategory) {params.category = selectedCategory}
      const data = await adminApi.prompts.list(params)
      const rawItems = data && typeof data === 'object' && !Array.isArray(data) && 'items' in data
        ? (data as { items: unknown }).items
        : data
      setPrompts(validateArrayData<Prompt>(rawItems))
    } catch (err) {
      console.error('Failed to fetch prompts:', err)
      error('加载提示词列表失败')
    } finally {
      setLoading(false)
    }
  }, [error, selectedCategory])
  const fetchFolders = useCallback(async () => {
    try {
      const data = await adminApi.prompts.getFolders()
      setFolders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch folders:', err)
    }
  }, [])
  useEffect(() => {
    fetchPrompts()
    fetchFolders()
  }, [fetchPrompts, fetchFolders])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        variables: formData.variables ? JSON.parse(formData.variables) : undefined
      }
      
      if (editingPrompt) {
        await adminApi.prompts.update(editingPrompt.id, submitData)
        success('提示词已更新')
      } else {
        await adminApi.prompts.create(submitData)
        success('提示词已创建')
      }
      
      setShowModal(false)
      setEditingPrompt(null)
      resetForm()
      fetchPrompts()
    } catch (err) {
      console.error('Failed to save prompt:', err)
      error('保存失败，请重试')
    }
  }
  const handleDelete = async () => {
    if (!deleteDialog.prompt) {return}
    
    try {
      await adminApi.prompts.delete(deleteDialog.prompt.id)
      success('提示词已删除')
      fetchPrompts()
    } catch (err) {
      console.error('Failed to delete prompt:', err)
      error('删除失败，请重试')
    } finally {
      setDeleteDialog({ open: false, prompt: null })
    }
  }
  const handleDuplicate = async (prompt: Prompt) => {
    try {
      await adminApi.prompts.duplicate(prompt.id)
      success('提示词已复制')
      fetchPrompts()
    } catch (err) {
      console.error('Failed to duplicate prompt:', err)
      error('复制失败')
    }
  }
  const handleSetDefault = async (prompt: Prompt) => {
    try {
      await adminApi.prompts.setDefault(prompt.id)
      success('已设为默认提示词')
    } catch (err) {
      console.error('Failed to set default:', err)
      error('设置失败')
    }
  }
  const handleExport = async () => {
    try {
      const data = await adminApi.prompts.export()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prompts-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      success('导出成功')
    } catch (err) {
      console.error('Failed to export:', err)
      error('导出失败')
    }
  }
  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFolder) {
        await adminApi.prompts.updateFolder(editingFolder.id, folderForm)
        success('文件夹已更新')
      } else {
        await adminApi.prompts.createFolder(folderForm)
        success('文件夹已创建')
      }
      setShowFolderModal(false)
      setEditingFolder(null)
      setFolderForm({ name: '', color: '#06b6d4', icon: 'folder' })
      fetchFolders()
    } catch (err) {
      console.error('Failed to save folder:', err)
      error('保存失败')
    }
  }
  const resetForm = () => {
    setFormData({
      name: '',
      version: '1.0.0',
      content: '',
      description: '',
      category: '',
      is_active: true,
      is_system: false,
      variables: '',
      ab_test_group: '',
      ab_test_percentage: 50
    })
  }
  const openEditModal = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      name: prompt.name,
      version: prompt.version,
      content: prompt.content,
      description: prompt.description || '',
      category: prompt.category || '',
      is_active: prompt.is_active,
      is_system: prompt.is_system,
      variables: prompt.variables ? JSON.stringify(prompt.variables, null, 2) : '',
      ab_test_group: prompt.ab_test_group || '',
      ab_test_percentage: prompt.ab_test_percentage || 50
    })
    setShowModal(true)
  }
  const filteredPrompts = prompts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  const categories = Array.from(new Set(prompts.map(p => p.category).filter(Boolean)))
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
                <FileText className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Prompt 提示词管理
                </h1>
                <p className="text-foreground/60 mt-0.5">管理 AI 对话的提示词模板</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={handleExport} variant="ghost" leftIcon={Download}>
                  导出
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => {
                    setEditingFolder(null)
                    setFolderForm({ name: '', color: '#06b6d4', icon: 'folder' })
                    setShowFolderModal(true)
                  }}
                  variant="ghost"
                  leftIcon={FolderPlus}
                >
                  新建文件夹
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => {
                    setEditingPrompt(null)
                    resetForm()
                    setShowModal(true)
                  }}
                  variant="primary"
                  leftIcon={Plus}
                >
                  新建提示词
                </Button>
              </motion.div>
            </div>
          </div>
        </GlassCardAdmin>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GlassCardAdmin className="p-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索提示词..."
                className="w-full pl-10 pr-4 py-2 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground placeholder:text-foreground/30"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-foreground/40" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground"
                >
                  <option value="">全部分类</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {loading ? (
            <LoadingState message="加载中..." size="md" variant="dots" />
          ) : filteredPrompts.length === 0 ? (
            <EmptyState
              variant="create"
              title={searchQuery ? "未找到匹配的提示词" : "暂无提示词"}
              description="开始创建 AI 对话使用的提示词模板"
              action={{
                label: '创建第一个提示词',
                onClick: () => setShowModal(true),
                icon: Plus
              }}
              icon={FileText}
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredPrompts.map((prompt, index) => (
                  <GlassCardAdmin variant="selectable" entrance={false}
                    key={prompt.id}
                    className={'group rounded-xl p-4'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -2 }}
                    layout
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{prompt.name}</h3>
                          <span className="text-xs font-mono px-2 py-0.5 bg-tech-cyan/20 text-tech-cyan rounded">
                            v{prompt.version}
                          </span>
                          {prompt.is_system && (
                            <span className="text-xs px-2 py-0.5 bg-cat-2/20 text-cat-2 rounded">
                              系统
                            </span>
                          )}
                          {prompt.is_active ? (
                            <span className="text-xs px-2 py-0.5 bg-success/20 text-success rounded">
                              启用
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-muted-foreground/20 text-muted-foreground rounded">
                              停用
                            </span>
                          )}
                          {prompt.category && (
                            <span className="text-xs px-2 py-0.5 bg-glass/30 text-foreground/60 rounded">
                              {prompt.category}
                            </span>
                          )}
                          {prompt.ab_test_group && (
                            <span className="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded">
                              A/B: {prompt.ab_test_group}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/50 mt-1 line-clamp-2">{prompt.description || prompt.content.slice(0, 100)}...</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-foreground/40">
                          {prompt.usage_count !== undefined && (
                            <span>使用 {prompt.usage_count} 次</span>
                          )}
                          <span>创建于 {new Date(prompt.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <motion.div 
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewContent(prompt.content)
                            setShowCodePreview(true)
                          }}
                          className="p-2 text-foreground/40 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="预览"
                        >
                          <Code className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetDefault(prompt)
                          }}
                          className="p-2 text-foreground/40 hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="设为默认"
                        >
                          <Star className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicate(prompt)
                          }}
                          className="p-2 text-foreground/40 hover:text-cat-1 hover:bg-cat-1/10 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(prompt)
                          }}
                          className="p-2 text-foreground/40 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialog({ open: true, prompt })
                          }}
                          className="p-2 text-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
          >
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              className="relative bg-background/95 backdrop-blur-xl border border-glass-border/50 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div className="p-2 rounded-lg bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30">
                  <Sparkles className="w-5 h-5 text-tech-cyan" />
                </motion.div>
                <h2 className="text-xl font-bold">{editingPrompt ? '编辑提示词' : '新建提示词'}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="名称" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  <FormInput label="版本" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">内容 <span className="text-destructive">*</span></label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground font-mono text-sm resize-none"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="描述" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  <FormInput label="分类" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">变量定义 (JSON)</label>
                  <textarea
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    rows={3}
                    placeholder='{"name": {"type": "string", "description": "用户名"}}'
                    className="w-full px-4 py-3 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground font-mono text-sm resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                      className={cn("relative w-12 h-6 rounded-full transition-colors", formData.is_active ? "bg-tech-cyan" : "bg-muted-foreground/30")}
                    >
                      <motion.div className="absolute top-1 w-4 h-4 bg-white rounded-full" animate={{ left: formData.is_active ? "28px" : "4px" }} />
                    </motion.button>
                    <span className="text-sm text-foreground/70">启用</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_system: !formData.is_system })}
                      className={cn("relative w-12 h-6 rounded-full transition-colors", formData.is_system ? "bg-cat-2" : "bg-muted-foreground/30")}
                    >
                      <motion.div className="absolute top-1 w-4 h-4 bg-white rounded-full" animate={{ left: formData.is_system ? "28px" : "4px" }} />
                    </motion.button>
                    <span className="text-sm text-foreground/70">系统提示词</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="A/B 测试分组" value={formData.ab_test_group} onChange={(e) => setFormData({ ...formData, ab_test_group: e.target.value })} />
                  <FormInput label="A/B 测试百分比" type="number" value={formData.ab_test_percentage.toString()} onChange={(e) => setFormData({ ...formData, ab_test_percentage: parseInt(e.target.value) || 50 })} />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-glass-border/30">
                  <Button type="button" onClick={() => setShowModal(false)} variant="ghost">取消</Button>
                  <Button type="submit" variant="primary">{editingPrompt ? '保存' : '创建'}</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFolderModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFolderModal(false)} />
            <motion.div
              className="relative bg-background/95 backdrop-blur-xl border border-glass-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <h2 className="text-xl font-bold mb-4">{editingFolder ? '编辑文件夹' : '新建文件夹'}</h2>
              <form onSubmit={handleFolderSubmit} className="space-y-4">
                <FormInput label="名称" value={folderForm.name} onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })} required />
                <FormInput label="颜色" type="color" value={folderForm.color} onChange={(e) => setFolderForm({ ...folderForm, color: e.target.value })} />
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" onClick={() => setShowFolderModal(false)} variant="ghost">取消</Button>
                  <Button type="submit" variant="primary">{editingFolder ? '保存' : '创建'}</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCodePreview && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCodePreview(false)} />
            <motion.div
              className="relative bg-background/95 backdrop-blur-xl border border-glass-border/50 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Prompt 预览</h2>
                <Button onClick={() => setShowCodePreview(false)} variant="ghost">关闭</Button>
              </div>
              <pre className="p-4 bg-foreground/5 rounded-xl overflow-x-auto text-sm font-mono text-foreground/80 whitespace-pre-wrap">
                {previewContent}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, prompt: null })}
        onConfirm={handleDelete}
        title="确认删除"
        description={`确定要删除提示词「${deleteDialog.prompt?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}