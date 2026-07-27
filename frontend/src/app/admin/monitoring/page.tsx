'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from '@/lib/framer-motion'
import {
  Activity,
  Cpu,
  HardDrive,
  Database,
  Server,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Globe,
  BarChart3,
  TrendingUp,
  Layers,
  AlertCircle,
} from 'lucide-react'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'
import { Button } from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'
import { adminApi } from '@/lib/admin-api-client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface HealthCheck {
  status: string
  timestamp: string
  service: string
  version: string
  uptime: number
  checks: {
    database?: { status: string; message: string }
    redis?: { status: string; message: string }
  }
}

interface SystemMetrics {
  cpu_percent: number
  memory_percent: number
  disk_usage_percent: number
  gpu_usage_percent: number
  active_connections: number
  cache_hit_ratio: number
  response_time_ms: number
}

interface MonitoringStatus {
  status: string
  uptime_seconds: number
  timestamp: string
  system_info: {
    cpu_percent: number
    memory_percent: number
    total_memory_gb: number
    available_memory_gb: number
  }
  dependencies: {
    database: string
    redis: string
    oss: string
  }
  app_info: {
    name: string
    version: string
    debug: boolean
  }
}

interface Analytics {
  total_requests: number
  requests_today: number
  active_users: number
  cache_size: number
  average_response_time: number
  error_rate: number
  top_endpoints: Array<{
    endpoint: string
    hits: number
  }>
}

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}天 ${hours}时 ${minutes}分`
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ok':
    case 'connected':
    case 'configured':
    case 'running':
    case 'healthy':
      return <CheckCircle className="w-4 h-4 text-success" />
    case 'warning':
    case 'degraded':
      return <AlertTriangle className="w-4 h-4 text-warning" />
    default:
      return <XCircle className="w-4 h-4 text-destructive" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ok':
    case 'connected':
    case 'configured':
    case 'running':
    case 'healthy':
      return 'text-success'
    case 'warning':
    case 'degraded':
      return 'text-warning'
    default:
      return 'text-destructive'
  }
}

const MetricCard = ({
  title,
  value,
  unit,
  icon: Icon,
  color,
  progress,
}: {
  title: string
  value: number
  unit: string
  icon: React.ElementType
  color: string
  progress?: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 rounded-lg bg-foreground/5 border border-foreground/10"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-muted-foreground text-sm">{title}</span>
      <Icon className={cn('w-5 h-5', color)} />
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-foreground">{value.toFixed(1)}</span>
      <span className="text-muted-foreground text-sm">{unit}</span>
    </div>
    {progress !== undefined && (
      <div className="mt-3 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color.replace('text-', 'bg-'))}
        />
      </div>
    )}
  </motion.div>
)

export default function MonitoringAdminPage() {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [status, setStatus] = useState<MonitoringStatus | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async (showToast = false) => {
    try {
      if (showToast) {setRefreshing(true)}

      const [healthRes, metricsRes, statusRes, analyticsRes] = await Promise.all([
        adminApi.get<HealthCheck>('/monitoring/health'),
        adminApi.get<SystemMetrics>('/monitoring/metrics'),
        adminApi.get<MonitoringStatus>('/monitoring/status'),
        adminApi.get<Analytics>('/monitoring/analytics'),
      ])

      setHealth(healthRes)
      setMetrics(metricsRes)
      setStatus(statusRes)
      setAnalytics(analyticsRes)

      if (showToast) {toast.success('数据已刷新')}
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
      toast.error('获取监控数据失败')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) {return}

    const interval = setInterval(() => {
      fetchData()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  const handleRefresh = () => {
    fetchData(true)
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState message="加载监控数据..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">系统监控</h1>
          <p className="text-muted-foreground mt-1">实时监控系统运行状态</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">自动刷新</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                'relative w-10 h-5 rounded-full transition-colors cursor-pointer',
                autoRefresh ? 'bg-tech-cyan' : 'bg-foreground/20'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                  autoRefresh ? 'left-5' : 'left-0.5'
                )}
              />
            </button>
          </div>
          <Button
            variant="glass"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCardAdmin className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-tech-cyan" />
              系统指标
            </h2>
            {metrics && (
              <span className="text-xs text-muted-foreground">
                更新于 {new Date().toLocaleTimeString()}
              </span>
            )}
          </div>

          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="CPU 使用率"
                value={metrics.cpu_percent}
                unit="%"
                icon={Cpu}
                color="text-cat-1"
                progress={metrics.cpu_percent}
              />
              <MetricCard
                title="内存使用率"
                value={metrics.memory_percent}
                unit="%"
                icon={Layers}
                color="text-cat-2"
                progress={metrics.memory_percent}
              />
              <MetricCard
                title="磁盘使用率"
                value={metrics.disk_usage_percent}
                unit="%"
                icon={HardDrive}
                color="text-warning"
                progress={metrics.disk_usage_percent}
              />
              <MetricCard
                title="GPU 使用率"
                value={metrics.gpu_usage_percent}
                unit="%"
                icon={Zap}
                color="text-success"
                progress={metrics.gpu_usage_percent}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">活跃连接</span>
                <Globe className="w-4 h-4 text-cat-3" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {metrics?.active_connections || 0}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">缓存命中率</span>
                <BarChart3 className="w-4 h-4 text-success" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {((metrics?.cache_hit_ratio || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">响应时间</span>
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {metrics?.response_time_ms.toFixed(1) || 0} ms
              </span>
            </div>
          </div>
        </GlassCardAdmin>

        <GlassCardAdmin className="p-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-tech-cyan" />
            服务状态
          </h2>

          {status && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">应用状态</span>
                  {getStatusIcon(status.status)}
                </div>
                <p className={cn('text-lg font-medium', getStatusColor(status.status))}>
                  {status.status === 'running' ? '运行中' : status.status}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">运行时间</span>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground">
                  {formatUptime(status.uptime_seconds)}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-muted-foreground text-sm">依赖服务</span>
                <div className="space-y-2">
                  {Object.entries(status.dependencies).map(([name, depStatus]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-3 rounded-lg bg-foreground/5"
                    >
                      <div className="flex items-center gap-2">
                        {name === 'database' && <Database className="w-4 h-4 text-muted-foreground" />}
                        {name === 'redis' && <Zap className="w-4 h-4 text-muted-foreground" />}
                        {name === 'oss' && <HardDrive className="w-4 h-4 text-muted-foreground" />}
                        <span className="text-muted-foreground capitalize">{name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm', getStatusColor(depStatus))}>
                          {depStatus === 'connected'
                            ? '已连接'
                            : depStatus === 'configured'
                              ? '已配置'
                              : depStatus === 'disconnected'
                                ? '未连接'
                                : '未配置'}
                        </span>
                        {getStatusIcon(depStatus)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlassCardAdmin>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCardAdmin className="p-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-tech-cyan" />
            健康检查
          </h2>

          {health && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                <div>
                  <p className="text-foreground font-medium">{health.service}</p>
                  <p className="text-muted-foreground text-sm">版本 {health.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm', getStatusColor(health.status))}>
                    {health.status === 'healthy' ? '健康' : '降级'}
                  </span>
                  {getStatusIcon(health.status)}
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(health.checks).map(([name, check]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 rounded-lg bg-foreground/5"
                  >
                    <div className="flex items-center gap-2">
                      {name === 'database' && <Database className="w-4 h-4 text-muted-foreground" />}
                      {name === 'redis' && <Zap className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-muted-foreground capitalize">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">{check.message}</span>
                      {getStatusIcon(check.status)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground mt-2">
                最后检查: {new Date(health.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </GlassCardAdmin>

        <GlassCardAdmin className="p-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-tech-cyan" />
            应用分析
          </h2>

          {analytics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                  <span className="text-muted-foreground text-sm">总请求数</span>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {analytics.total_requests.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                  <span className="text-muted-foreground text-sm">今日请求</span>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {analytics.requests_today.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                  <span className="text-muted-foreground text-sm">活跃用户</span>
                  <p className="text-2xl font-bold text-foreground mt-1">{analytics.active_users}</p>
                </div>
                <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                  <span className="text-muted-foreground text-sm">缓存大小</span>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {analytics.cache_size.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                  <span className="text-muted-foreground text-sm">平均响应时间</span>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {analytics.average_response_time.toFixed(1)} ms
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                  <span className="text-muted-foreground text-sm">错误率</span>
                  <p
                    className={cn(
                      'text-xl font-bold mt-1',
                      analytics.error_rate > 0.05 ? 'text-destructive' : 'text-success'
                    )}
                  >
                    {(analytics.error_rate * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">热门端点</span>
                <div className="mt-2 space-y-2">
                  {analytics.top_endpoints.map((endpoint, index) => (
                    <div
                      key={endpoint.endpoint}
                      className="flex items-center justify-between p-2 rounded bg-foreground/5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'w-5 h-5 rounded text-xs flex items-center justify-center',
                            index === 0
                              ? 'bg-warning/20 text-warning'
                              : index === 1
                                ? 'bg-muted-foreground/20 text-muted-foreground'
                                : 'bg-warning/20 text-warning'
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground text-sm font-mono">{endpoint.endpoint}</span>
                      </div>
                      <span className="text-muted-foreground text-sm">{endpoint.hits.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlassCardAdmin>
      </div>

      {status?.app_info.debug && (
        <GlassCardAdmin className="p-4 border-warning/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning" />
            <div>
              <p className="text-warning font-medium">调试模式已启用</p>
              <p className="text-muted-foreground text-sm">生产环境请确保关闭调试模式</p>
            </div>
          </div>
        </GlassCardAdmin>
      )}
    </div>
  )
}
