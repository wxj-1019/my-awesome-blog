'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { 
  Mail, 
  Search, 
  Trash2, 
  Download,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
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

interface Subscription {
  id: string
  email: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export default function SubscriptionsPage() {
  const { success, error } = useToast()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; subscription: Subscription | null }>({ 
    open: false, 
    subscription: null 
  })
  const pageSize = 10

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * pageSize
      
      const data = await adminApi.subscriptions.list({
        skip,
        limit: pageSize,
        is_active: filter === 'all' ? true : filter === 'active'
      })
      
      let filteredData = validateArrayData<Subscription>(data)
      
      if (searchQuery) {
        filteredData = filteredData.filter((s: Subscription) => 
          s.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      setSubscriptions(filteredData)
      setTotalCount(filteredData.length)
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err)
      error('加载订阅列表失败')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filter, searchQuery, error])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const fetchCount = useCallback(async () => {
    try {
      const count = await adminApi.subscriptions.count()
      setTotalCount(typeof count === 'number' ? count : 0)
    } catch (err) {
      console.error('Failed to fetch count:', err)
    }
  }, [])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  const deleteSubscription = async () => {
    if (!deleteDialog.subscription) {return}
    
    try {
      await adminApi.subscriptions.delete(deleteDialog.subscription.id)
      success('订阅已删除')
      fetchSubscriptions()
      fetchCount()
    } catch (err) {
      console.error('Failed to delete subscription:', err)
      error('删除订阅失败，请重试')
    } finally {
      setDeleteDialog({ open: false, subscription: null })
    }
  }

  const toggleSubscriptionStatus = async (subscription: Subscription) => {
    try {
      if (subscription.is_active) {
        await adminApi.subscriptions.unsubscribe(subscription.email)
        success('订阅已暂停')
      } else {
        await adminApi.subscriptions.update(subscription.id, { is_active: true })
        success('订阅已激活')
      }
      fetchSubscriptions()
    } catch (err) {
      console.error('Failed to toggle subscription status:', err)
      error('更新订阅状态失败，请重试')
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['邮箱', '状态', '订阅时间'].join(','),
      ...subscriptions.map(s => [
        s.email,
        s.is_active ? '活跃' : '暂停',
        new Date(s.created_at).toLocaleDateString('zh-CN')
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    success('订阅数据已导出')
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const activeCount = subscriptions.filter(s => s.is_active).length
  const inactiveCount = subscriptions.filter(s => !s.is_active).length

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
                <Mail className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  订阅管理
                </h1>
                <p className="text-foreground/60 mt-0.5 flex items-center gap-4">
                  <span>管理邮件订阅</span>
                  <span className="text-xs px-2 py-0.5 bg-tech-cyan/20 text-tech-cyan rounded-full">
                    共 {totalCount} 个订阅
                  </span>
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={exportToCSV}
                variant="secondary"
                leftIcon={Download}
                disabled={subscriptions.length === 0}
              >
                导出 CSV
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
                placeholder="搜索邮箱..."
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
                  className={cn(filter === 'all' && "bg-tech-cyan")}
                >
                  全部 ({subscriptions.length})
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => { setFilter('active'); setCurrentPage(1); }}
                  variant={filter === 'active' ? 'primary' : 'ghost'}
                  className={cn(filter === 'active' && "bg-success")}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  活跃 ({activeCount})
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => { setFilter('inactive'); setCurrentPage(1); }}
                  variant={filter === 'inactive' ? 'primary' : 'ghost'}
                  className={cn(filter === 'inactive' && "bg-warning")}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  暂停 ({inactiveCount})
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
          ) : subscriptions.length === 0 ? (
            <div className="p-12">
              <EmptyState
                variant="search"
                title={searchQuery ? '未找到匹配的订阅' : '暂无订阅'}
                description={searchQuery ? '尝试其他搜索关键词' : '当有用户订阅时会显示在这里'}
                icon={Mail}
              />
            </div>
          ) : (
            <div className="divide-y divide-glass-border/20">
              <AnimatePresence>
                {subscriptions.map((subscription, index) => (
                  <motion.div
                    key={subscription.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 hover:bg-glass/10 transition-colors duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-tech-cyan/50 to-tech-sky/50 flex items-center justify-center shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Mail className="w-5 h-5 text-foreground" />
                        </motion.div>
                        
                        <div>
                          <p className="font-medium text-foreground">{subscription.email}</p>
                          <p className="text-sm text-foreground/50">
                            订阅于 {new Date(subscription.created_at).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <motion.button
                          onClick={() => toggleSubscriptionStatus(subscription)}
                          className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
                            subscription.is_active 
                              ? "bg-success/20 text-success border-success/30 hover:bg-success/30" 
                              : "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30"
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {subscription.is_active ? '活跃' : '暂停'}
                        </motion.button>
                        
                        <motion.button
                          onClick={() => setDeleteDialog({ open: true, subscription })}
                          className="p-2 text-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
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
                共 {totalCount} 条订阅，第 {currentPage}/{totalPages} 页
              </p>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-glass-border/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-glass/10 transition-colors"
                  whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                  whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </motion.button>
                <motion.button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-glass-border/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-glass/10 transition-colors"
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
        onClose={() => setDeleteDialog({ open: false, subscription: null })}
        onConfirm={deleteSubscription}
        title="确认删除订阅"
        description={`确定要删除订阅「${deleteDialog.subscription?.email}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
