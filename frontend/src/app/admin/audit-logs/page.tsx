'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { 
  FileText, 
  Search, 
  Download,
  User,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  Globe,
  Monitor
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import { validateArrayData } from '@/utils/data-validation'
import Button from '@/components/admin/Button'
import FormInput from '@/components/admin/FormInput'
import { useToast } from '@/components/admin/Toast'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'

interface AuditLogUser {
  id: string
  username: string
  email: string
}

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  old_values: string | null
  new_values: string | null
  ip_address: string | null
  user_agent: string | null
  timestamp: string
  user: AuditLogUser | null
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: '创建', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  update: { label: '更新', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  delete: { label: '删除', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  login: { label: '登录', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  logout: { label: '登出', color: 'bg-gray-500/20 text-gray-400 dark:text-gray-500 dark:text-gray-400 border-gray-500/30' },
  register: { label: '注册', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  approve: { label: '批准', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  reject: { label: '拒绝', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  publish: { label: '发布', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  unpublish: { label: '取消发布', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  article: '文章',
  user: '用户',
  comment: '评论',
  category: '分类',
  tag: '标签',
  subscription: '订阅',
  portfolio: '作品集',
  timeline: '时间线',
  message: '留言',
  setting: '设置',
  auth: '认证',
}

export default function AuditLogsPage() {
  const { success, error } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [resourceFilter, setResourceFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const pageSize = 20

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * pageSize
      
      const params: Record<string, string | number> = {
        skip,
        limit: pageSize
      }
      
      if (actionFilter) {params.action = actionFilter}
      if (resourceFilter) {params.resource_type = resourceFilter}
      
      const data = await adminApi.auditLogs.list(params)
      
      let filteredData = validateArrayData<AuditLog>(data)
      
      if (searchQuery) {
        filteredData = filteredData.filter((log: AuditLog) => 
          log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.resource_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.ip_address?.includes(searchQuery)
        )
      }
      
      setLogs(filteredData)
      setTotalCount(filteredData.length)
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
      error('加载审计日志失败')
    } finally {
      setLoading(false)
    }
  }, [currentPage, actionFilter, resourceFilter, searchQuery, error])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const exportToCSV = () => {
    const csvContent = [
      ['时间', '用户', '操作', '资源类型', '资源ID', 'IP地址', 'User-Agent'].join(','),
      ...logs.map(log => [
        new Date(log.timestamp).toLocaleString('zh-CN'),
        log.user?.username || log.user?.email || '系统',
        log.action,
        log.resource_type,
        log.resource_id || '',
        log.ip_address || '',
        `"${(log.user_agent || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    success('审计日志已导出')
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) {return '刚刚'}
    if (diff < 3600000) {return `${Math.floor(diff / 60000)} 分钟前`}
    if (diff < 86400000) {return `${Math.floor(diff / 3600000)} 小时前`}
    if (diff < 604800000) {return `${Math.floor(diff / 86400000)} 天前`}
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionInfo = (action: string) => {
    return ACTION_LABELS[action] || { label: action, color: 'bg-gray-500/20 text-gray-400 dark:text-gray-500 dark:text-gray-400 border-gray-500/30' }
  }

  const getResourceTypeLabel = (type: string) => {
    return RESOURCE_TYPE_LABELS[type] || type
  }

  const parseJsonValues = (jsonStr: string | null) => {
    if (!jsonStr) {return null}
    try {
      return JSON.parse(jsonStr)
    } catch {
      return jsonStr
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const uniqueActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)))
  const uniqueResourceTypes = Array.from(new Set(logs.map(l => l.resource_type).filter(Boolean)))

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
                  审计日志
                </h1>
                <p className="text-foreground/60 mt-0.5 flex items-center gap-4">
                  <span>系统操作记录</span>
                  <span className="text-xs px-2 py-0.5 bg-tech-cyan/20 text-tech-cyan rounded-full">
                    共 {totalCount} 条记录
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
                disabled={logs.length === 0}
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
        <GlassCardAdmin className="p-4" variant="secondary">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <FormInput
                type="text"
                placeholder="搜索用户、操作、资源或IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={Search}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-glass/30 border border-glass-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 cursor-pointer"
              >
                <option value="">全部操作</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{getActionInfo(action).label}</option>
                ))}
              </select>
              
              <select
                value={resourceFilter}
                onChange={(e) => { setResourceFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-glass/30 border border-glass-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 cursor-pointer"
              >
                <option value="">全部资源</option>
                {uniqueResourceTypes.map(type => (
                  <option key={type} value={type}>{getResourceTypeLabel(type)}</option>
                ))}
              </select>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => { setSearchQuery(''); setActionFilter(''); setResourceFilter(''); setCurrentPage(1); }}
                  variant="ghost"
                  leftIcon={Filter}
                >
                  重置
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
          ) : logs.length === 0 ? (
            <div className="p-12">
              <EmptyState
                variant="search"
                title={searchQuery || actionFilter || resourceFilter ? '未找到匹配的记录' : '暂无审计日志'}
                description={searchQuery || actionFilter || resourceFilter ? '尝试调整筛选条件' : '系统操作记录将显示在这里'}
                icon={FileText}
              />
            </div>
          ) : (
            <div className="divide-y divide-glass-border/20">
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-4 hover:bg-glass/10 transition-colors duration-200 cursor-pointer"
                    onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <motion.div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0",
                            log.user ? "bg-gradient-to-br from-tech-cyan/50 to-tech-sky/50" : "bg-gradient-to-br from-gray-500/50 to-gray-600/50"
                          )}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          {log.user ? (
                            <User className="w-5 h-5 text-white dark:text-gray-100" />
                          ) : (
                            <Activity className="w-5 h-5 text-white dark:text-gray-100" />
                          )}
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">
                              {log.user?.username || '系统'}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded border",
                              getActionInfo(log.action).color
                            )}>
                              {getActionInfo(log.action).label}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-glass/30 text-foreground/70 rounded">
                              {getResourceTypeLabel(log.resource_type)}
                            </span>
                            {log.resource_id && (
                              <span className="text-xs text-foreground/50 font-mono">
                                #{log.resource_id.slice(0, 8)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-foreground/50">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(log.timestamp)}
                            </span>
                            {log.ip_address && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {log.ip_address}
                              </span>
                            )}
                          </div>
                          
                          {selectedLog?.id === log.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 p-3 bg-glass/20 rounded-lg space-y-3"
                            >
                              {log.user_agent && (
                                <div>
                                  <p className="text-xs text-foreground/50 mb-1 flex items-center gap-1">
                                    <Monitor className="w-3 h-3" />
                                    User-Agent
                                  </p>
                                  <p className="text-xs text-foreground/70 break-all">{log.user_agent}</p>
                                </div>
                              )}
                              
                              {log.old_values && (
                                <div>
                                  <p className="text-xs text-foreground/50 mb-1">旧值</p>
                                  <pre className="text-xs text-red-400 bg-red-500/10 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(parseJsonValues(log.old_values), null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {log.new_values && (
                                <div>
                                  <p className="text-xs text-foreground/50 mb-1">新值</p>
                                  <pre className="text-xs text-green-400 bg-green-500/10 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(parseJsonValues(log.new_values), null, 2)}
                                  </pre>
                                </div>
                              )}
                            </motion.div>
                          )}
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
                共 {totalCount} 条记录，第 {currentPage}/{totalPages} 页
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
    </div>
  )
}
