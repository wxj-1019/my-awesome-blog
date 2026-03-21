'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Folder,
  Tag,
  Users,
  Image,
  MessageSquare,
  Link2,
  Settings,
  BarChart3,
  FileImage,
  Clock,
  Cloud,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Sparkles,
  Moon,
  Sun,
  Activity,
  ScrollText,
  Mail,
  Type,
  Brain,
  MessagesSquare,
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminSidebar from '@/components/ui/AdminSidebar'
import { ToastContainer, useToast } from '@/components/admin/Toast'
import { cn } from '@/lib/utils'

interface MenuGroup {
  id: string
  label: string
  items: Array<{
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    href: string
  }>
}

const menuGroups: MenuGroup[] = [
  {
    id: 'overview',
    label: '概览',
    items: [
      { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, href: '/admin' },
    ]
  },
  {
    id: 'content',
    label: '内容管理',
    items: [
      { id: 'articles', label: '文章管理', icon: FileText, href: '/admin/articles' },
      { id: 'categories', label: '分类管理', icon: Folder, href: '/admin/categories' },
      { id: 'tags', label: '标签管理', icon: Tag, href: '/admin/tags' },
      { id: 'comments', label: '评论管理', icon: MessageSquare, href: '/admin/comments' },
      { id: 'messages', label: '留言管理', icon: Mail, href: '/admin/messages' },
    ]
  },
  {
    id: 'media',
    label: '媒体管理',
    items: [
      { id: 'images', label: '图片管理', icon: Image, href: '/admin/images' },
      { id: 'portfolios', label: '作品集', icon: FileImage, href: '/admin/portfolios' },
    ]
  },
  {
    id: 'ai',
    label: 'AI 功能',
    items: [
      { id: 'typewriter', label: '打字机内容', icon: Type, href: '/admin/typewriter' },
      { id: 'prompts', label: 'Prompt 管理', icon: Sparkles, href: '/admin/prompts' },
      { id: 'conversations', label: '对话管理', icon: MessagesSquare, href: '/admin/conversations' },
      { id: 'memories', label: '记忆管理', icon: Brain, href: '/admin/memories' },
    ]
  },
  {
    id: 'user',
    label: '用户与互动',
    items: [
      { id: 'users', label: '用户管理', icon: Users, href: '/admin/users' },
      { id: 'subscriptions', label: '订阅管理', icon: BarChart3, href: '/admin/subscriptions' },
      { id: 'friend-links', label: '友链管理', icon: Link2, href: '/admin/friend-links' },
    ]
  },
  {
    id: 'display',
    label: '展示内容',
    items: [
      { id: 'timeline', label: '时间线', icon: Clock, href: '/admin/timeline' },
      { id: 'weather', label: '天气数据', icon: Cloud, href: '/admin/weather' },
    ]
  },
  {
    id: 'system',
    label: '系统',
    items: [
      { id: 'monitoring', label: '系统监控', icon: Activity, href: '/admin/monitoring' },
      { id: 'audit-logs', label: '审计日志', icon: ScrollText, href: '/admin/audit-logs' },
      { id: 'settings', label: '系统设置', icon: Settings, href: '/admin/settings' },
    ]
  },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const { toasts, removeToast } = useToast()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900/20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/8 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.7, 0.5]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-300/10 to-purple-300/8 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.6, 0.5]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-sky-300/10 to-blue-300/8 rounded-full blur-2xl"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2 }}
          />
          <motion.div
            className="absolute top-20 right-1/4 w-32 h-32 bg-gradient-to-br from-tech-cyan/5 to-transparent rounded-full blur-2xl"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/30 backdrop-blur-md z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>

        <AdminSidebar
          menuGroups={menuGroups}
          sidebarOpen={sidebarOpen}
          mobileOpen={mobileOpen}
          onMobileToggle={setMobileOpen}
          onSidebarToggle={setSidebarOpen}
        />

        <div className={cn(
          "transition-all duration-500 ease-out relative z-10",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}>
          <motion.header 
            className="h-16 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <motion.button 
                onClick={() => setMobileOpen(true)}
                className="p-2.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-all duration-200 lg:hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu className="w-5 h-5 text-foreground/70 group-hover:text-tech-cyan transition-colors" />
              </motion.button>
              
              <div className="hidden lg:block">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="p-1.5 rounded-lg bg-gradient-to-br from-tech-cyan/20 to-tech-sky/20"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Sparkles className="w-4 h-4 text-tech-cyan" />
                    </motion.div>
                    <h1 className="text-lg font-semibold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                      {getCurrentPageTitle(pathname, menuGroups)}
                    </h1>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 ml-8">
                    {getCurrentPageDescription(pathname)}
                  </p>
                </motion.div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-green-500/10 backdrop-blur-lg border border-emerald-500/20">
                <motion.div 
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">在线</span>
              </div>
              
              <div className="hidden md:flex items-center gap-1">
                <motion.button 
                  className="p-2.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-all duration-200 group relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchOpen(!searchOpen)}
                >
                  <Search className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-tech-cyan transition-colors" />
                </motion.button>
                
                <motion.button 
                  className="p-2.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-all duration-200 group relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotificationOpen(!notificationOpen)}
                >
                  <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-tech-cyan transition-colors" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </motion.button>
              </div>
              
              <motion.button 
                className="p-2.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-all duration-200 group"
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                transition={{ rotate: { duration: 0.5 } }}
              >
                <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-tech-cyan transition-colors" />
              </motion.button>
            </div>
          </motion.header>

          <main className="p-4 lg:p-8 pb-20">
            <motion.div 
              className="max-w-7xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
        
        <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      </div>
    </ProtectedRoute>
  )
}

function getCurrentPageTitle(pathname: string, menuGroups: MenuGroup[]): string {
  for (const group of menuGroups) {
    const item = group.items.find(item => 
      pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
    );
    if (item) return item.label;
  }
  return '仪表盘';
}

function getCurrentPageDescription(pathname: string): string {
  const descriptions: Record<string, string> = {
    '/admin': '欢迎来到博客管理系统仪表盘',
    '/admin/articles': '管理您的博客文章内容',
    '/admin/categories': '组织和管理文章分类',
    '/admin/tags': '管理文章标签和关键词',
    '/admin/users': '管理网站用户和权限',
    '/admin/comments': '审核和管理用户评论',
    '/admin/messages': '管理网站留言和弹幕',
    '/admin/images': '管理媒体图片和文件',
    '/admin/portfolios': '管理作品集展示',
    '/admin/timeline': '管理时间线事件',
    '/admin/subscriptions': '管理用户订阅',
    '/admin/friend-links': '管理友情链接和合作伙伴',
    '/admin/monitoring': '实时监控系统运行状态',
    '/admin/audit-logs': '查看系统操作审计日志',
    '/admin/settings': '配置系统参数和设置',
    '/admin/weather': '查看天气数据信息',
    '/admin/typewriter': '管理首页打字机效果内容',
    '/admin/prompts': '管理 AI 对话提示词模板',
    '/admin/conversations': '查看和管理 AI 对话记录',
    '/admin/memories': '管理 AI 记忆库内容',
  }
  
  return descriptions[pathname] || '管理系统功能'
}
