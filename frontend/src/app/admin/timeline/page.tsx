'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { 
  Clock, 
  Search, 
  Plus,
  Trash2,
  Edit3,
  Calendar,
  X,
  Flag,
  Trophy,
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react'
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

interface TimelineEvent {
  id: string
  title: string
  description: string | null
  event_date: string
  event_type: 'milestone' | 'achievement' | 'update'
  icon: string | null
  color: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof Flag }> = {
  milestone: { label: '里程碑', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: Flag },
  achievement: { label: '成就', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Trophy },
  update: { label: '更新', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: Bell },
}

const COLOR_OPTIONS = [
  { value: '#06b6d4', label: '青色' },
  { value: '#8b5cf6', label: '紫色' },
  { value: '#f59e0b', label: '橙色' },
  { value: '#10b981', label: '绿色' },
  { value: '#ef4444', label: '红色' },
  { value: '#3b82f6', label: '蓝色' },
]

export default function TimelinePage() {
  const { success, error } = useToast()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; event: TimelineEvent | null }>({ 
    open: false, 
    event: null 
  })
  const [editDialog, setEditDialog] = useState<{ open: boolean; event: TimelineEvent | null; mode: 'create' | 'edit' }>({ 
    open: false, 
    event: null,
    mode: 'create'
  })
  const pageSize = 10

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_type: 'milestone',
    icon: '',
    color: '#06b6d4',
    is_active: true,
  })

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * pageSize
      
      const data = await adminApi.timeline.list({
        skip,
        limit: pageSize,
        is_active: true
      })
      
      let filteredData = validateArrayData<TimelineEvent>(data)
      
      if (searchQuery) {
        filteredData = filteredData.filter((e: TimelineEvent) => 
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      if (typeFilter) {
        filteredData = filteredData.filter((e: TimelineEvent) => e.event_type === typeFilter)
      }
      
      setEvents(filteredData)
      setTotalCount(filteredData.length)
    } catch (err) {
      console.error('Failed to fetch timeline events:', err)
      error('加载时间线事件失败')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, typeFilter, error])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: new Date().toISOString().split('T')[0],
      event_type: 'milestone',
      icon: '',
      color: '#06b6d4',
      is_active: true,
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setEditDialog({ open: true, event: null, mode: 'create' })
  }

  const openEditDialog = (event: TimelineEvent) => {
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date,
      event_type: event.event_type,
      icon: event.icon || '',
      color: event.color || '#06b6d4',
      is_active: event.is_active,
    })
    setEditDialog({ open: true, event, mode: 'edit' })
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      error('请输入事件标题')
      return
    }
    if (!formData.event_date) {
      error('请选择事件日期')
      return
    }

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_date: formData.event_date,
        event_type: formData.event_type,
        icon: formData.icon.trim() || null,
        color: formData.color,
        is_active: formData.is_active,
      }

      if (editDialog.mode === 'create') {
        await adminApi.timeline.create(payload)
        success('事件创建成功')
      } else if (editDialog.event) {
        await adminApi.timeline.update(editDialog.event.id, payload)
        success('事件更新成功')
      }

      setEditDialog({ open: false, event: null, mode: 'create' })
      fetchEvents()
    } catch (err) {
      console.error('Failed to save timeline event:', err)
      error(editDialog.mode === 'create' ? '创建事件失败' : '更新事件失败')
    }
  }

  const deleteEvent = async () => {
    if (!deleteDialog.event) {return}
    
    try {
      await adminApi.timeline.delete(deleteDialog.event.id)
      success('事件已删除')
      fetchEvents()
    } catch (err) {
      console.error('Failed to delete timeline event:', err)
      error('删除事件失败，请重试')
    } finally {
      setDeleteDialog({ open: false, event: null })
    }
  }

  const toggleActive = async (event: TimelineEvent) => {
    try {
      await adminApi.timeline.update(event.id, { is_active: !event.is_active })
      success(event.is_active ? '事件已隐藏' : '事件已显示')
      fetchEvents()
    } catch (err) {
      console.error('Failed to toggle active:', err)
      error('更新事件状态失败')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const totalPages = Math.ceil(totalCount / pageSize)

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
                <Clock className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  时间线管理
                </h1>
                <p className="text-foreground/60 mt-0.5 flex items-center gap-4">
                  <span>管理重要事件与里程碑</span>
                  <span className="text-xs px-2 py-0.5 bg-tech-cyan/20 text-tech-cyan rounded-full">
                    共 {totalCount} 个事件
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
                新建事件
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
                placeholder="搜索事件标题或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={Search}
              />
            </div>
            
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => { setTypeFilter(''); setCurrentPage(1); }}
                  variant={typeFilter === '' ? 'primary' : 'ghost'}
                  className={cn(typeFilter === '' && "bg-tech-cyan")}
                >
                  全部
                </Button>
              </motion.div>
              {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                <motion.div key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => { setTypeFilter(key); setCurrentPage(1); }}
                    variant={typeFilter === key ? 'primary' : 'ghost'}
                    className={cn(typeFilter === key && "bg-tech-cyan")}
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
        <GlassCardAdmin className="overflow-hidden">
          {loading ? (
            <div className="p-12">
              <LoadingState message="加载中..." size="md" variant="dots" />
            </div>
          ) : events.length === 0 ? (
            <div className="p-12">
              <EmptyState
                variant="search"
                title={searchQuery || typeFilter ? '未找到匹配的事件' : '暂无时间线事件'}
                description={searchQuery || typeFilter ? '尝试调整搜索条件' : '点击「新建事件」添加您的第一个事件'}
                icon={Clock}
              />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-tech-cyan via-tech-sky to-transparent" />
              
              <div className="divide-y divide-glass-border/20">
                <AnimatePresence>
                  {events.map((event, index) => {
                    const typeInfo = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.milestone
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 hover:bg-glass/10 transition-colors duration-200 group relative pl-16"
                      >
                        <motion.div
                          className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-tech-cyan bg-tech-darkblue z-10"
                          style={{ backgroundColor: event.color || '#06b6d4' }}
                          whileHover={{ scale: 1.3 }}
                        />
                        
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-foreground">{event.title}</h3>
                              <span className={cn(
                                "px-2 py-0.5 text-xs rounded",
                                typeInfo.bgColor,
                                typeInfo.color
                              )}>
                                <typeInfo.icon className="w-3 h-3 inline mr-1" />
                                {typeInfo.label}
                              </span>
                              {!event.is_active && (
                                <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 dark:text-gray-500 dark:text-gray-400 rounded">
                                  已隐藏
                                </span>
                              )}
                            </div>
                            
                            {event.description && (
                              <p className="text-sm text-foreground/60 mb-2">{event.description}</p>
                            )}
                            
                            <div className="flex items-center gap-2 text-xs text-foreground/50">
                              <Calendar className="w-3 h-3" />
                              {formatDate(event.event_date)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              onClick={() => toggleActive(event)}
                              className="p-2 text-foreground/50 hover:text-foreground hover:bg-glass/20 rounded-lg transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title={event.is_active ? '隐藏' : '显示'}
                            >
                              {event.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </motion.button>
                            <motion.button
                              onClick={() => openEditDialog(event)}
                              className="p-2 text-foreground/50 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title="编辑"
                            >
                              <Edit3 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => setDeleteDialog({ open: true, event })}
                              className="p-2 text-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-glass-border/30 flex items-center justify-between">
              <p className="text-sm text-foreground/50">
                共 {totalCount} 个事件，第 {currentPage}/{totalPages} 页
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
          )}
        </GlassCardAdmin>
      </motion.div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, event: null })}
        onConfirm={deleteEvent}
        title="确认删除事件"
        description={`确定要删除事件「${deleteDialog.event?.title}」吗？此操作不可恢复。`}
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
            onClick={(e) => e.target === e.currentTarget && setEditDialog({ open: false, event: null, mode: 'create' })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <GlassCardAdmin className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">
                    {editDialog.mode === 'create' ? '新建事件' : '编辑事件'}
                  </h2>
                  <motion.button
                    onClick={() => setEditDialog({ open: false, event: null, mode: 'create' })}
                    className="p-2 text-foreground/50 hover:text-foreground hover:bg-glass/20 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      事件标题 <span className="text-red-400">*</span>
                    </label>
                    <FormInput
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="输入事件标题"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-glass/30 border border-glass-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 resize-none"
                      rows={3}
                      placeholder="事件描述..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">
                        事件日期 <span className="text-red-400">*</span>
                      </label>
                      <FormInput
                        type="date"
                        value={formData.event_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">事件类型</label>
                      <select
                        value={formData.event_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-glass/30 border border-glass-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan/50"
                      >
                        <option value="milestone">里程碑</option>
                        <option value="achievement">成就</option>
                        <option value="update">更新</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">颜色标记</label>
                    <div className="flex gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <motion.button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            formData.color === color.value ? "border-white scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color.value }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">图标（可选）</label>
                    <FormInput
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="例如: rocket、party 或短标签"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-glass/20 rounded-lg">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded border-glass-border text-tech-cyan focus:ring-tech-cyan/50"
                    />
                    <label htmlFor="is_active" className="text-sm text-foreground">
                      公开显示此事件
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-glass-border/30">
                  <Button
                    onClick={() => setEditDialog({ open: false, event: null, mode: 'create' })}
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
