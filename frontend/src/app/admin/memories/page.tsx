'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { Brain, Trash2, Search, Filter, Plus, Eye, Star, Clock, Sparkles, RefreshCw, Database, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import Button from '@/components/admin/Button'
import FormInput from '@/components/admin/FormInput'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'

interface Memory {
  id: string
  content: string
  memory_type: string
  importance: number
  embedding?: number[]
  metadata?: Record<string, unknown>
  created_at: string
  updated_at?: string
}

interface MemoryStats {
  total_memories: number
  by_type: Record<string, number>
  avg_importance: number
  oldest_memory?: string
  newest_memory?: string
}

export default function MemoriesPage() {
  const { success, error } = useToast()
  const [memories, setMemories] = useState<Memory[]>([])
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [minImportance, setMinImportance] = useState<number>(0)
  const [showModal, setShowModal] = useState(false)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; memory: Memory | null }>({ open: false, memory: null })
  const [showDetail, setShowDetail] = useState<Memory | null>(null)
  const [formData, setFormData] = useState({
    content: '',
    memory_type: 'short_term',
    importance: 50,
    metadata: ''
  })

  const fetchMemories = useCallback(async () => {
    try {
      setLoading(true)
      const params: { memory_type?: string; min_importance?: number } = {}
      if (typeFilter) {params.memory_type = typeFilter}
      if (minImportance > 0) {params.min_importance = minImportance}
      const data = await adminApi.memories.list(params) as { items?: Memory[] } | Memory[]
      setMemories(Array.isArray(data) ? data : (data.items || []))
    } catch (err) {
      console.error('Failed to fetch memories:', err)
      error('加载记忆列表失败')
    } finally {
      setLoading(false)
    }
  }, [error, typeFilter, minImportance])

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.memories.getStats() as MemoryStats
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  useEffect(() => {
    fetchMemories()
    fetchStats()
  }, [fetchMemories, fetchStats])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        metadata: formData.metadata ? JSON.parse(formData.metadata) : undefined
      }
      
      if (editingMemory) {
        await adminApi.memories.update(editingMemory.id, submitData)
        success('记忆已更新')
      } else {
        await adminApi.memories.create(submitData)
        success('记忆已创建')
      }
      
      setShowModal(false)
      setEditingMemory(null)
      resetForm()
      fetchMemories()
      fetchStats()
    } catch (err) {
      console.error('Failed to save memory:', err)
      error('保存失败，请重试')
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.memory) {return}
    
    try {
      await adminApi.memories.delete(deleteDialog.memory.id)
      success('记忆已删除')
      fetchMemories()
      fetchStats()
    } catch (err) {
      console.error('Failed to delete memory:', err)
      error('删除失败，请重试')
    } finally {
      setDeleteDialog({ open: false, memory: null })
    }
  }

  const handleCleanup = async () => {
    try {
      const result = await adminApi.memories.cleanup() as { deleted_count?: number }
      success(`清理完成，删除了 ${result?.deleted_count || 0} 条过期记忆`)
      fetchMemories()
      fetchStats()
    } catch (err) {
      console.error('Failed to cleanup:', err)
      error('清理失败')
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchMemories()
      return
    }
    
    try {
      setLoading(true)
      const data = await adminApi.memories.search(searchQuery, {
        memory_type: typeFilter || undefined,
        min_importance: minImportance > 0 ? minImportance : undefined,
        top_k: 50
      }) as { results?: Memory[] }
      setMemories(data.results || [])
    } catch (err) {
      console.error('Failed to search:', err)
      error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      content: '',
      memory_type: 'short_term',
      importance: 50,
      metadata: ''
    })
  }

  const openEditModal = (memory: Memory) => {
    setEditingMemory(memory)
    setFormData({
      content: memory.content,
      memory_type: memory.memory_type,
      importance: memory.importance,
      metadata: memory.metadata ? JSON.stringify(memory.metadata, null, 2) : ''
    })
    setShowModal(true)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'short_term': return 'bg-blue-500/20 text-blue-400'
      case 'long_term': return 'bg-purple-500/20 text-purple-400'
      case 'episodic': return 'bg-green-500/20 text-green-400'
      case 'semantic': return 'bg-orange-500/20 text-orange-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'short_term': return '短期记忆'
      case 'long_term': return '长期记忆'
      case 'episodic': return '情节记忆'
      case 'semantic': return '语义记忆'
      default: return type
    }
  }

  const getImportanceColor = (importance: number) => {
    if (importance >= 80) {return 'text-red-400'}
    if (importance >= 50) {return 'text-yellow-400'}
    return 'text-green-400'
  }

  const filteredMemories = searchQuery 
    ? memories 
    : memories.filter(m => {
        if (typeFilter && m.memory_type !== typeFilter) {return false}
        if (m.importance < minImportance) {return false}
        return true
      })

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
                <Brain className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  AI 记忆管理
                </h1>
                <p className="text-foreground/60 mt-0.5">管理 AI 的记忆库内容</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={handleCleanup} variant="ghost" leftIcon={RefreshCw}>
                  清理过期
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => {
                    setEditingMemory(null)
                    resetForm()
                    setShowModal(true)
                  }}
                  variant="primary"
                  leftIcon={Plus}
                >
                  新建记忆
                </Button>
              </motion.div>
            </div>
          </div>
        </GlassCardAdmin>
      </motion.div>

      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <GlassCardAdmin className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-tech-cyan">{stats.total_memories}</div>
                <div className="text-sm text-foreground/50">总记忆数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{Object.keys(stats.by_type || {}).length}</div>
                <div className="text-sm text-foreground/50">记忆类型</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.avg_importance?.toFixed(1) || 0}</div>
                <div className="text-sm text-foreground/50">平均重要度</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">
                  {stats.newest_memory ? new Date(stats.newest_memory).toLocaleDateString() : '-'}
                </div>
                <div className="text-sm text-foreground/50">最新记忆</div>
              </div>
            </div>
          </GlassCardAdmin>
        </motion.div>
      )}

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
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="语义搜索记忆..."
                className="w-full pl-10 pr-4 py-2 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground placeholder:text-foreground/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-foreground/40" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground"
              >
                <option value="">全部类型</option>
                <option value="short_term">短期记忆</option>
                <option value="long_term">长期记忆</option>
                <option value="episodic">情节记忆</option>
                <option value="semantic">语义记忆</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-foreground/40" />
              <input
                type="number"
                value={minImportance}
                onChange={(e) => setMinImportance(parseInt(e.target.value) || 0)}
                placeholder="最低重要度"
                className="w-24 px-3 py-2 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground"
                min={0}
                max={100}
              />
            </div>
            <Button onClick={handleSearch} variant="ghost" size="sm">
              搜索
            </Button>
          </div>

          {loading ? (
            <LoadingState message="加载中..." size="md" variant="dots" />
          ) : filteredMemories.length === 0 ? (
            <EmptyState
              variant="create"
              title="暂无记忆"
              description="AI 的记忆库为空，开始添加记忆"
              action={{
                label: '创建第一条记忆',
                onClick: () => setShowModal(true),
                icon: Plus
              }}
              icon={Brain}
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredMemories.map((memory, index) => (
                  <motion.div
                    key={memory.id}
                    className="group relative overflow-hidden rounded-xl border-2 border-glass-border/30 hover:border-tech-cyan/50 p-4 bg-glass/10 hover:bg-glass/20 backdrop-blur-lg transition-colors duration-300 cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ y: -2 }}
                    layout
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-xs px-2 py-0.5 rounded", getTypeColor(memory.memory_type))}>
                            {getTypeText(memory.memory_type)}
                          </span>
                          <span className={cn("text-xs flex items-center gap-1", getImportanceColor(memory.importance))}>
                            <Star className="w-3 h-3" />
                            {memory.importance}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-2 line-clamp-2">{memory.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-foreground/40">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(memory.created_at).toLocaleString()}
                          </span>
                          {memory.embedding && (
                            <span className="flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              已向量化
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <motion.div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowDetail(memory)
                          }}
                          className="p-2 text-foreground/40 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(memory)
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
                            setDeleteDialog({ open: true, memory })
                          }}
                          className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
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
          >
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              className="relative bg-background/95 backdrop-blur-xl border border-glass-border/50 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div className="p-2 rounded-lg bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30">
                  <Sparkles className="w-5 h-5 text-tech-cyan" />
                </motion.div>
                <h2 className="text-xl font-bold">{editingMemory ? '编辑记忆' : '新建记忆'}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">内容 <span className="text-red-400">*</span></label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground resize-none"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">类型</label>
                    <select
                      value={formData.memory_type}
                      onChange={(e) => setFormData({ ...formData, memory_type: e.target.value })}
                      className="w-full px-4 py-3 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground"
                    >
                      <option value="short_term">短期记忆</option>
                      <option value="long_term">长期记忆</option>
                      <option value="episodic">情节记忆</option>
                      <option value="semantic">语义记忆</option>
                    </select>
                  </div>
                  <FormInput
                    label="重要度 (0-100)"
                    type="number"
                    value={formData.importance.toString()}
                    onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">元数据 (JSON)</label>
                  <textarea
                    value={formData.metadata}
                    onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                    rows={2}
                    placeholder='{"key": "value"}'
                    className="w-full px-4 py-3 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground font-mono text-sm resize-none"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-glass-border/30">
                  <Button type="button" onClick={() => setShowModal(false)} variant="ghost">取消</Button>
                  <Button type="submit" variant="primary">{editingMemory ? '保存' : '创建'}</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetail && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(null)} />
            <motion.div
              className="relative bg-background/95 backdrop-blur-xl border border-glass-border/50 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">记忆详情</h2>
                <Button onClick={() => setShowDetail(null)} variant="ghost">关闭</Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-foreground/50">ID</label>
                  <p className="font-mono text-sm">{showDetail.id}</p>
                </div>
                <div>
                  <label className="text-sm text-foreground/50">类型</label>
                  <p className={cn("inline-block text-xs px-2 py-0.5 rounded", getTypeColor(showDetail.memory_type))}>
                    {getTypeText(showDetail.memory_type)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-foreground/50">重要度</label>
                  <p className={cn("flex items-center gap-1", getImportanceColor(showDetail.importance))}>
                    <Star className="w-4 h-4" /> {showDetail.importance}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-foreground/50">内容</label>
                  <p className="text-foreground bg-glass/20 rounded-xl p-4 whitespace-pre-wrap">{showDetail.content}</p>
                </div>
                {showDetail.metadata && (
                  <div>
                    <label className="text-sm text-foreground/50">元数据</label>
                    <pre className="text-sm bg-gray-900/50 rounded-xl p-4 overflow-x-auto">
                      {JSON.stringify(showDetail.metadata, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="flex gap-4 text-sm text-foreground/40">
                  <span>创建: {new Date(showDetail.created_at).toLocaleString()}</span>
                  {showDetail.updated_at && (
                    <span>更新: {new Date(showDetail.updated_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, memory: null })}
        onConfirm={handleDelete}
        title="确认删除记忆"
        description={`确定要删除这条记忆吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
