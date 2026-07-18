'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  Reply,
  Sparkles
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

interface Comment {
  id: string
  content: string
  author_name: string
  author_email?: string
  is_approved: boolean
  created_at: string
  article?: {
    id: string
    title: string
    slug: string
  }
  parent_id?: string
  replies?: Comment[]
}

export default function CommentsPage() {
  const { success, error } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; comment: Comment | null }>({ 
    open: false, 
    comment: null 
  })
  const pageSize = 10

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * pageSize
      
      const data = await adminApi.comments.list({
        skip,
        limit: pageSize,
        approved: filter === 'all' ? undefined : (filter === 'approved')
      })
      
      let filteredComments = validateArrayData<Comment>(data)
      
      if (searchQuery) {
        filteredComments = filteredComments.filter((c: Comment) => 
          c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.article?.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      setComments(filteredComments)
      setTotal(filteredComments.length)
    } catch (err) {
      console.error('Failed to fetch comments:', err)
      error('加载评论列表失败')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filter, searchQuery, error])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const approveComment = async (id: string) => {
    try {
      await adminApi.comments.approve(id)
      success('评论已通过审核')
      fetchComments()
    } catch (err) {
      console.error('Failed to approve comment:', err)
      error('审核通过失败，请重试')
    }
  }

  const rejectComment = async (id: string) => {
    try {
      await adminApi.comments.reject(id)
      success('评论已拒绝')
      fetchComments()
    } catch (err) {
      console.error('Failed to reject comment:', err)
      error('拒绝评论失败，请重试')
    }
  }

  const deleteComment = async () => {
    if (!deleteDialog.comment) {return}
    
    try {
      await adminApi.comments.delete(deleteDialog.comment.id)
      success('评论已删除')
      fetchComments()
    } catch (err) {
      console.error('Failed to delete comment:', err)
      error('删除评论失败，请重试')
    } finally {
      setDeleteDialog({ open: false, comment: null })
    }
  }

  const submitReply = async () => {
    if (!replyContent.trim() || !selectedComment) {return}
    
    try {
      success('回复已发送')
      setSelectedComment(null)
      setReplyContent('')
    } catch (err) {
      console.error('Failed to reply:', err)
      error('回复失败，请重试')
    }
  }

  const totalPages = Math.ceil(total / pageSize)
  const pendingCount = comments.filter(c => !c.is_approved).length

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
                  评论管理
                </h1>
                <p className="text-foreground/60 mt-0.5 flex items-center gap-2">
                  管理文章评论
                  {pendingCount > 0 && (
                    <motion.span 
                      className="px-2.5 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                    >
                      {pendingCount} 条待审核
                    </motion.span>
                  )}
                </p>
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
        <GlassCardAdmin className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <FormInput
                type="text"
                placeholder="搜索评论内容、作者或文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={Search}
              />
            </div>
            
            <div className="flex gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => { setFilter('all'); setCurrentPage(1); }}
                  variant={filter === 'all' ? 'primary' : 'ghost'}
                  className={cn(
                    filter === 'all' && "bg-tech-cyan"
                  )}
                >
                  全部 {comments.length > 0 && `(${comments.length})`}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => { setFilter('approved'); setCurrentPage(1); }}
                  variant={filter === 'approved' ? 'primary' : 'ghost'}
                  className={cn(
                    filter === 'approved' && "bg-green-500"
                  )}
                >
                  已通过 {comments.filter(c => c.is_approved).length > 0 && `(${comments.filter(c => c.is_approved).length})`}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => { setFilter('pending'); setCurrentPage(1); }}
                  variant={filter === 'pending' ? 'primary' : 'ghost'}
                  className={cn(
                    filter === 'pending' && "bg-orange-500"
                  )}
                >
                  待审核 {pendingCount > 0 && `(${pendingCount})`}
                </Button>
              </motion.div>
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
          ) : comments.length === 0 ? (
            <div className="p-12">
              <EmptyState
                variant="search"
                title={searchQuery ? '未找到匹配的评论' : '暂无评论'}
                description={searchQuery ? '尝试其他搜索关键词' : '暂无评论数据'}
                icon={MessageSquare}
              />
            </div>
          ) : (
            <div className="divide-y divide-glass-border/20">
              <AnimatePresence>
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-6 hover:bg-glass/10 transition-colors duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-tech-cyan to-tech-sky flex items-center justify-center text-white dark:text-gray-100 font-medium flex-shrink-0 shadow-lg shadow-tech-cyan/30"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {comment.author_name.charAt(0).toUpperCase()}
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground font-semibold">{comment.author_name}</span>
                          {comment.author_email && (
                            <span className="text-sm text-foreground/50">{comment.author_email}</span>
                          )}
                          <span className="text-sm text-foreground/40">
                            {new Date(comment.created_at).toLocaleDateString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <motion.span
                            className={cn(
                              "px-2.5 py-0.5 text-xs font-medium rounded-full border",
                              comment.is_approved 
                                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                            )}
                            whileHover={{ scale: 1.05 }}
                          >
                            {comment.is_approved ? '已通过' : '待审核'}
                          </motion.span>
                        </div>
                        
                        <p className="mt-3 text-foreground/80 leading-relaxed">{comment.content}</p>
                        
                        {comment.article && (
                          <div className="mt-3">
                            <Link 
                              href={`/posts/${comment.article.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 text-sm text-tech-cyan hover:text-tech-lightcyan transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              评论于: {comment.article.title}
                            </Link>
                          </div>
                        )}
                        
                        <div className="mt-4 flex items-center gap-2">
                          {!comment.is_approved && (
                            <motion.button
                              onClick={() => approveComment(comment.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              通过
                            </motion.button>
                          )}
                          {comment.is_approved && (
                            <motion.button
                              onClick={() => rejectComment(comment.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-all"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <XCircle className="w-4 h-4" />
                              拒绝
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => setSelectedComment(comment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-glass/20 text-foreground/70 border border-glass-border/30 rounded-lg hover:bg-glass/30 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Reply className="w-4 h-4" />
                            回复
                          </motion.button>
                          <motion.button
                            onClick={() => setDeleteDialog({ open: true, comment })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4" />
                            删除
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-glass-border/30 flex items-center justify-between">
              <p className="text-sm text-foreground/50">
                共 {total} 条评论，第 {currentPage}/{totalPages} 页
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

      <AnimatePresence>
        {selectedComment && (
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
              onClick={() => setSelectedComment(null)}
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
                  <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    回复评论
                  </h3>
                </div>
                <motion.button
                  onClick={() => setSelectedComment(null)}
                  className="p-2 text-foreground/40 hover:text-foreground hover:bg-glass/20 rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
              
              <div className="mb-4 p-4 bg-glass/10 rounded-xl border border-glass-border/30">
                <p className="text-sm text-foreground/50 mb-1">{selectedComment.author_name}:</p>
                <p className="text-foreground">{selectedComment.content}</p>
              </div>
              
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="输入回复内容..."
                rows={4}
                className="w-full px-4 py-3 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 focus:border-transparent transition-all duration-200 text-foreground placeholder:text-foreground/30 resize-none"
              />
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-glass-border/30">
                <Button
                  onClick={() => setSelectedComment(null)}
                  variant="ghost"
                >
                  取消
                </Button>
                <Button
                  onClick={submitReply}
                  disabled={!replyContent.trim()}
                  variant="primary"
                >
                  发送回复
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, comment: null })}
        onConfirm={deleteComment}
        title="确认删除评论"
        description="确定要删除这条评论吗？此操作不可恢复。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
