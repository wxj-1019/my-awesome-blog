'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Search,
  Filter,
  Trash2,
  Eye,
  Heart,
  TrendingUp,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Clock,
  Film,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'
import { Button } from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Image from 'next/image'
import { adminApi } from '@/lib/admin-api-client'
import { cn } from '@/lib/utils'
import { validateArrayData } from '@/utils/data-validation'
import toast from 'react-hot-toast'
interface MessageAuthor {
  id: string
  username: string
  email: string
  avatar_url: string | null
}
interface MessageItem {
  id: string
  author_id: string
  parent_id: string | null
  content: string
  color: string
  is_danmaku: boolean
  likes: number
  level: number
  is_deleted: boolean
  created_at: string
  updated_at: string | null
  author: MessageAuthor | null
}
interface ActivityStat {
  date: string
  count: number
}
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}
export default function MessagesAdminPage() {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [trendingMessages, setTrendingMessages] = useState<MessageItem[]>([])
  const [activityStats, setActivityStats] = useState<ActivityStat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDanmaku, setFilterDanmaku] = useState<'all' | 'danmaku' | 'normal'>('all')
  const [filterDeleted, setFilterDeleted] = useState<'all' | 'deleted' | 'active'>('active')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; message: MessageItem | null; hard: boolean }>({
    open: false,
    message: null,
    hard: false,
  })
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number | boolean> = {
        skip: (page - 1) * 20,
        limit: 20,
      }
      if (filterDanmaku === 'danmaku') {
        params.danmaku_only = true
      }
      const response = await adminApi.getMessages(params)
      let filteredData = validateArrayData<MessageItem>(
        response && typeof response === 'object' && 'data' in response
          ? (response as { data: unknown }).data
          : response
      )
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filteredData = filteredData.filter(
          (m: MessageItem) =>
            m.content.toLowerCase().includes(term) ||
            m.author?.username.toLowerCase().includes(term)
        )
      }
      if (filterDeleted === 'deleted') {
        filteredData = filteredData.filter((m: MessageItem) => m.is_deleted)
      } else if (filterDeleted === 'active') {
        filteredData = filteredData.filter((m: MessageItem) => !m.is_deleted)
      }
      setMessages(filteredData)
      setTotalPages(Math.ceil(filteredData.length / 20) || 1)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      toast.error('获取留言列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, filterDanmaku, filterDeleted, searchTerm])
  const fetchTrending = async () => {
    try {
      const response = await adminApi.get<MessageItem[]>('/messages/trending', {
        params: { limit: 10 },
      })
      setTrendingMessages(validateArrayData<MessageItem>(
        response && typeof response === 'object' && 'data' in response
          ? (response as { data: unknown }).data
          : response
      ))
    } catch (error) {
      console.error('Failed to fetch trending messages:', error)
    }
  }
  const fetchActivityStats = async () => {
    try {
      const response = await adminApi.get<{ data: ActivityStat[] }>('/messages/stats/activity', {
        params: { days: 14 },
      })
      const rawStats = response && typeof response === 'object' && 'data' in response
        ? (response as { data: unknown }).data
        : response
      setActivityStats(validateArrayData<ActivityStat>(rawStats))
    } catch (error) {
      console.error('Failed to fetch activity stats:', error)
    }
  }
  useEffect(() => {
    fetchMessages()
    fetchTrending()
    fetchActivityStats()
  }, [fetchMessages])
  const handleDelete = async () => {
    if (!deleteConfirm.message) {return}
    try {
      if (deleteConfirm.hard) {
        await adminApi.hardDeleteMessage(deleteConfirm.message.id)
        toast.success('留言已永久删除')
      } else {
        await adminApi.deleteMessage(deleteConfirm.message.id)
        toast.success('留言已删除')
      }
      fetchMessages()
    } catch (error) {
      console.error('Failed to delete message:', error)
      toast.error(deleteConfirm.hard ? '永久删除失败' : '删除失败')
    } finally {
      setDeleteConfirm({ open: false, message: null, hard: false })
    }
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) {return content}
    return content.slice(0, maxLength) + '...'
  }
  const maxActivityCount = Math.max(...activityStats.map(s => s.count), 1)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white dark:text-gray-100">留言管理</h1>
          <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1">管理网站留言和弹幕</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="glass"
            onClick={() => setShowTrendingModal(true)}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            热门留言
          </Button>
          <Button
            variant="glass"
            onClick={() => setShowStatsModal(true)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            活动统计
          </Button>
          <Button
            variant="glass"
            onClick={fetchMessages}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="搜索留言内容或作者..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg text-white dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-tech-cyan transition-colors"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'glass'}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          筛选
        </Button>
      </div>
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCardAdmin className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-2">留言类型</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: '全部' },
                      { value: 'danmaku', label: '弹幕' },
                      { value: 'normal', label: '普通' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterDanmaku(option.value as typeof filterDanmaku)
                          setPage(1)
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
                          filterDanmaku === option.value
                            ? 'bg-tech-cyan text-white dark:text-gray-100'
                            : 'bg-white/5 text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:bg-white/10'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-2">状态</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'active', label: '正常' },
                      { value: 'deleted', label: '已删除' },
                      { value: 'all', label: '全部' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterDeleted(option.value as typeof filterDeleted)
                          setPage(1)
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
                          filterDeleted === option.value
                            ? 'bg-tech-cyan text-white dark:text-gray-100'
                            : 'bg-white/5 text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:bg-white/10'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCardAdmin>
          </motion.div>
        )}
      </AnimatePresence>
      <GlassCardAdmin className="p-6">
        {loading ? (
          <LoadingState message="加载留言列表..." />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="暂无留言"
            description={searchTerm ? '没有找到匹配的留言' : '还没有任何留言'}
          />
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              <AnimatePresence>
                {messages.map(message => (
                  <motion.div
                    key={message.id}
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, x: -100 }}
                    className={cn(
                      'p-4 rounded-lg border transition-colors',
                      message.is_deleted
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-white/5 border-white/10 hover:border-glass-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {message.author?.avatar_url ? (
                            <Image
                              src={message.author.avatar_url}
                              alt={message.author.username}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-tech-cyan/20 flex items-center justify-center">
                              <User className="w-3 h-3 text-tech-cyan" />
                            </div>
                          )}
                          <span className="text-white dark:text-gray-100 font-medium text-sm">
                            {message.author?.username || '匿名用户'}
                          </span>
                          {message.is_danmaku && (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                              <Film className="w-3 h-3" />
                              弹幕
                            </span>
                          )}
                          {message.is_deleted && (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              已删除
                            </span>
                          )}
                          {message.parent_id && (
                            <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              回复
                            </span>
                          )}
                        </div>
                        <p
                          className="text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm line-clamp-2"
                          style={{ borderLeft: `3px solid ${message.color}`, paddingLeft: '8px' }}
                        >
                          {truncateContent(message.content)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(message.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {message.likes} 赞
                          </span>
                          <span className="text-gray-600">Lv.{message.level}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedMessage(message)
                            setShowDetailModal(true)
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-white dark:text-gray-100 transition-colors cursor-pointer"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!message.is_deleted && (
                          <button
                            onClick={() =>
                              setDeleteConfirm({ open: true, message, hard: false })
                            }
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {message.is_deleted && (
                          <button
                            onClick={() =>
                              setDeleteConfirm({ open: true, message, hard: true })
                            }
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                            title="永久删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </GlassCardAdmin>
      <AnimatePresence>
        {showDetailModal && selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-tech-darkblue border border-glass-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white dark:text-gray-100">留言详情</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-white dark:text-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {selectedMessage.author?.avatar_url ? (
                    <Image
                      src={selectedMessage.author.avatar_url}
                      alt={selectedMessage.author.username}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-tech-cyan/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-tech-cyan" />
                    </div>
                  )}
                  <div>
                    <p className="text-white dark:text-gray-100 font-medium">
                      {selectedMessage.author?.username || '匿名用户'}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{selectedMessage.author?.email}</p>
                  </div>
                </div>
                <div
                  className="p-4 rounded-lg bg-white/5"
                  style={{ borderLeft: `4px solid ${selectedMessage.color}` }}
                >
                  <p className="text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">留言 ID</span>
                    <p className="text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 font-mono text-xs mt-1">{selectedMessage.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">作者 ID</span>
                    <p className="text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 font-mono text-xs mt-1">
                      {selectedMessage.author_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">创建时间</span>
                    <p className="text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1">{formatDate(selectedMessage.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">更新时间</span>
                    <p className="text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1">
                      {selectedMessage.updated_at
                        ? formatDate(selectedMessage.updated_at)
                        : '从未更新'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">点赞数</span>
                    <p className="text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-400" />
                      {selectedMessage.likes}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">用户等级</span>
                    <p className="text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1">Lv.{selectedMessage.level}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">弹幕</span>
                    <p className="text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1">
                      {selectedMessage.is_danmaku ? '是' : '否'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">状态</span>
                    <p
                      className={cn(
                        'mt-1',
                        selectedMessage.is_deleted ? 'text-red-400' : 'text-green-400'
                      )}
                    >
                      {selectedMessage.is_deleted ? '已删除' : '正常'}
                    </p>
                  </div>
                </div>
                {selectedMessage.parent_id && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">回复的留言</span>
                    <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 font-mono text-xs mt-1">
                      {selectedMessage.parent_id}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTrendingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTrendingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-tech-darkblue border border-glass-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white dark:text-gray-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-tech-cyan" />
                  热门留言
                </h3>
                <button
                  onClick={() => setShowTrendingModal(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-white dark:text-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {trendingMessages.length === 0 ? (
                  <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-center py-4">暂无热门留言</p>
                ) : (
                  trendingMessages.map((message, index) => (
                    <div
                      key={message.id}
                      className="p-3 rounded-lg bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                            index === 0
                              ? 'bg-yellow-500 text-yellow-900'
                              : index === 1
                                ? 'bg-gray-300 text-gray-700'
                                : index === 2
                                  ? 'bg-amber-600 text-amber-100'
                                  : 'bg-white/10 text-gray-400 dark:text-gray-500 dark:text-gray-400'
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="text-white dark:text-gray-100 text-sm font-medium">
                          {message.author?.username || '匿名'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1 ml-auto">
                          <Heart className="w-3 h-3 text-red-400" />
                          {message.likes}
                        </span>
                      </div>
                      <p
                        className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm line-clamp-2"
                        style={{ borderLeft: `2px solid ${message.color}`, paddingLeft: '8px' }}
                      >
                        {truncateContent(message.content, 80)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showStatsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStatsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-tech-darkblue border border-glass-border rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white dark:text-gray-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-tech-cyan" />
                  近14天活动统计
                </h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-white dark:text-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {activityStats.length === 0 ? (
                  <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-center py-4">暂无活动数据</p>
                ) : (
                  activityStats.map(stat => (
                    <div key={stat.date} className="flex items-center gap-3">
                      <span className="text-gray-500 dark:text-gray-400 text-xs w-24">{stat.date}</span>
                      <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(stat.count / maxActivityCount) * 100}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-tech-cyan to-tech-lightcyan"
                        />
                      </div>
                      <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm w-8 text-right">{stat.count}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">总计留言</span>
                  <span className="text-white dark:text-gray-100 font-medium">
                    {activityStats.reduce((sum, s) => sum + s.count, 0)}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, message: null, hard: false })}
        onConfirm={handleDelete}
        title={deleteConfirm.hard ? '永久删除留言' : '删除留言'}
        description={
          deleteConfirm.hard
            ? '此操作将永久删除该留言，无法恢复。确定要继续吗？'
            : '确定要删除这条留言吗？删除后可以恢复。'
        }
        confirmText={deleteConfirm.hard ? '永久删除' : '删除'}
        variant="danger"
      />
    </div>
  )
}