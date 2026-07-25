'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { MessageSquare, Trash2, Search, Filter, Eye, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import { validateArrayData } from '@/utils/data-validation'
import Button from '@/components/admin/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  tokens?: number
}

interface Conversation {
  id: string
  title: string
  status: string
  model: string
  message_count?: number
  total_tokens?: number
  prompt_id?: string
  created_at: string
  updated_at?: string
}

export default function ConversationsPage() {
  const { success, error } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; conversation: Conversation | null }>({ open: false, conversation: null })

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (statusFilter) {params.status = statusFilter}
      const data = await adminApi.conversations.list(params)
      const rawItems = data && typeof data === 'object' && !Array.isArray(data) && 'items' in data
        ? (data as { items: unknown }).items
        : data
      setConversations(validateArrayData<Conversation>(rawItems))
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
      error('加载对话列表失败')
    } finally {
      setLoading(false)
    }
  }, [error, statusFilter])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true)
      const data = await adminApi.conversations.getMessages(conversationId, { limit: 100 })
      const rawMessages = data && typeof data === 'object' && 'messages' in data
        ? (data as { messages: unknown }).messages
        : data
      setMessages(validateArrayData<Message>(rawMessages))
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      error('加载消息失败')
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleViewMessages = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setShowMessages(true)
    fetchMessages(conversation.id)
  }

  const handleDelete = async () => {
    if (!deleteDialog.conversation) {return}
    
    try {
      await adminApi.conversations.delete(deleteDialog.conversation.id)
      success('对话已删除')
      fetchConversations()
    } catch (err) {
      console.error('Failed to delete conversation:', err)
      error('删除失败，请重试')
    } finally {
      setDeleteDialog({ open: false, conversation: null })
    }
  }

  const handleDeleteMessages = async () => {
    if (!selectedConversation) {return}
    
    try {
      await adminApi.conversations.deleteMessages(selectedConversation.id)
      success('消息已清空')
      setMessages([])
      fetchConversations()
    } catch (err) {
      console.error('Failed to delete messages:', err)
      error('清空消息失败')
    }
  }

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'archived': return 'bg-gray-500/20 text-gray-400'
      case 'deleted': return 'bg-red-500/20 text-red-400'
      default: return 'bg-blue-500/20 text-blue-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃'
      case 'archived': return '已归档'
      case 'deleted': return '已删除'
      default: return status
    }
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
                <MessageSquare className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  AI 对话管理
                </h1>
                <p className="text-foreground/60 mt-0.5">查看和管理用户 AI 对话记录</p>
              </div>
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
                placeholder="搜索对话..."
                className="w-full pl-10 pr-4 py-2 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground placeholder:text-foreground/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-foreground/40" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 text-foreground"
              >
                <option value="">全部状态</option>
                <option value="active">活跃</option>
                <option value="archived">已归档</option>
                <option value="deleted">已删除</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingState message="加载中..." size="md" variant="dots" />
          ) : filteredConversations.length === 0 ? (
            <EmptyState
              variant="default"
              title={searchQuery ? "未找到匹配的对话" : "暂无对话记录"}
              description="用户开始使用 AI 聊天后，对话记录将显示在这里"
              icon={MessageSquare}
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredConversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.id}
                    className="group relative overflow-hidden rounded-xl border-2 border-glass-border/30 hover:border-tech-cyan/50 p-4 bg-glass/10 hover:bg-glass/20 backdrop-blur-lg transition-colors duration-300 cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -2 }}
                    layout
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground truncate">{conversation.title || '未命名对话'}</h3>
                          <span className={cn("text-xs px-2 py-0.5 rounded", getStatusColor(conversation.status))}>
                            {getStatusText(conversation.status)}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-glass/30 text-foreground/60 rounded">
                            {conversation.model}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-foreground/40">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {conversation.message_count || 0} 条消息
                          </span>
                          {conversation.total_tokens && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {conversation.total_tokens} tokens
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(conversation.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <motion.div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewMessages(conversation)
                          }}
                          className="p-2 text-foreground/40 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="查看消息"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialog({ open: true, conversation })
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
        {showMessages && selectedConversation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMessages(false)} />
            <motion.div
              className="relative bg-background/95 backdrop-blur-xl border border-glass-border/50 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-glass-border/30">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedConversation.title || '对话详情'}</h2>
                  <p className="text-sm text-foreground/50">{selectedConversation.model} · {selectedConversation.message_count || 0} 条消息</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleDeleteMessages} variant="ghost" className="text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空消息
                  </Button>
                  <motion.button
                    onClick={() => setShowMessages(false)}
                    className="p-2 text-foreground/40 hover:text-foreground hover:bg-glass/20 rounded-lg"
                    whileHover={{ scale: 1.1 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <LoadingState message="加载消息..." size="md" variant="dots" />
                ) : messages.length === 0 ? (
                  <EmptyState variant="default" title="暂无消息" description="该对话还没有消息记录" icon={MessageSquare} />
                ) : (
                  messages.map((msg, index) => (
                    <motion.div
                      key={msg.id || index}
                      className={cn(
                        "flex gap-3",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3",
                        msg.role === 'user' 
                          ? "bg-tech-cyan/20 text-foreground rounded-br-md" 
                          : msg.role === 'assistant'
                            ? "bg-glass/30 text-foreground rounded-bl-md"
                            : "bg-yellow-500/20 text-foreground/80 text-sm"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-xs font-medium",
                            msg.role === 'user' ? "text-tech-cyan" : msg.role === 'assistant' ? "text-foreground/60" : "text-yellow-400"
                          )}>
                            {msg.role === 'user' ? '用户' : msg.role === 'assistant' ? 'AI' : '系统'}
                          </span>
                          {msg.tokens && (
                            <span className="text-xs text-foreground/30">{msg.tokens} tokens</span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, conversation: null })}
        onConfirm={handleDelete}
        title="确认删除对话"
        description={`确定要删除对话「${deleteDialog.conversation?.title || '未命名'}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
