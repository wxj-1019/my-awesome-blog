'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { X, Search, Menu, Folder, Archive, Tag, Filter, ChevronRight, Home, User, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  href: string
  color: string
}

const quickActions: QuickAction[] = [
  { id: 'home', label: '首页', icon: Home, href: '/', color: 'from-tech-cyan to-tech-sky' },
  { id: 'search', label: '搜索', icon: Search, href: '/search', color: 'from-purple-500 to-pink-500' },
  { id: 'categories', label: '分类', icon: Folder, href: '/categories', color: 'from-green-500 to-emerald-500' },
  { id: 'archive', label: '归档', icon: Archive, href: '/archive', color: 'from-orange-500 to-red-500' },
  { id: 'tags', label: '标签', icon: Tag, href: '/tags', color: 'from-blue-500 to-indigo-500' },
  { id: 'profile', label: '个人资料', icon: User, href: '/profile', color: 'from-teal-500 to-cyan-500' }
]

interface CategoryItem {
  id: string
  name: string
  count: number
  icon: React.ElementType
}

const categories: CategoryItem[] = [
  { id: '1', name: '前端开发', count: 45, icon: Folder },
  { id: '2', name: '后端开发', count: 32, icon: Archive },
  { id: '3', name: 'DevOps', count: 20, icon: Tag },
  { id: '4', name: '设计', count: 18, icon: Filter },
  { id: '5', name: '其他', count: 12, icon: Settings }
]

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const closeDrawer = () => {
    setIsOpen(false)
    setSearchQuery('')
    setSelectedCategory(null)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 p-3 rounded-full bg-tech-cyan text-white shadow-lg shadow-tech-cyan/30 hover:scale-110 transition-transform duration-200 cursor-pointer md:hidden"
        aria-label="打开菜单"
      >
        <Menu className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
        <>
          <motion.div
            key="mobile-drawer-overlay"
            ref={overlayRef}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.25 }}
          />

          <motion.aside
            key="mobile-drawer-panel"
            ref={drawerRef}
            className={cn(
              'fixed top-0 left-0 bottom-0 z-[110] w-full sm:w-96',
              'bg-glass/30 backdrop-blur-xl border-r border-glass-border'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="移动端菜单"
            initial={shouldReduceMotion ? { opacity: 0 } : { x: '-100%', opacity: 0.9 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: '-100%', opacity: 0.9 }}
            transition={{ duration: shouldReduceMotion ? 0.12 : 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tech-cyan to-tech-sky flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">POETIZE</h3>
                    <p className="text-xs text-muted-foreground">欢迎回来</p>
                  </div>
                </div>

                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="关闭菜单"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索文章、标签..."
                      className="w-full px-4 py-3 pl-10 rounded-lg bg-glass/20 border border-glass-border text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
                      aria-label="搜索文章"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </form>
                </div>

                <div className="px-4 pb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-tech-cyan" />
                    快速访问
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <a
                          key={action.id}
                          href={action.href}
                          onClick={closeDrawer}
                          className={cn(
                            'flex flex-col items-center justify-center p-4 rounded-xl',
                            'bg-gradient-to-br',
                            action.color,
                            'text-white hover:scale-105 transition-transform duration-200 cursor-pointer'
                          )}
                          aria-label={action.label}
                        >
                          <Icon className="w-5 h-5 mb-1" />
                          <span className="text-xs font-medium">{action.label}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-tech-cyan" />
                    分类浏览
                  </h4>

                  <div className="space-y-2">
                    {filteredCategories.map((category) => {
                      const Icon = category.icon
                      return (
                        <div key={category.id}>
                          <button
                            onClick={() => setSelectedCategory(
                              selectedCategory === category.id ? null : category.id
                            )}
                            className={cn(
                              'w-full flex items-center justify-between p-3 rounded-lg',
                              'transition-all duration-200',
                              selectedCategory === category.id
                                ? 'bg-tech-cyan/20 text-tech-cyan'
                                : 'hover:bg-white/5 text-foreground'
                            )}
                            aria-expanded={selectedCategory === category.id}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4" />
                              <span className="text-sm font-medium">{category.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {category.count}
                              </span>
                              <ChevronRight
                                className={cn(
                                  'w-4 h-4 transition-transform duration-200',
                                  selectedCategory === category.id ? 'rotate-90' : ''
                                )}
                              />
                            </div>
                          </button>

                          {selectedCategory === category.id && (
                            <div className="ml-6 mt-2 space-y-2 animate-fade-in-up">
                              <a
                                href={`/categories/${category.id}`}
                                onClick={closeDrawer}
                                className="block px-3 py-2 text-sm text-gray-400 hover:text-tech-cyan transition-colors cursor-pointer"
                              >
                                查看所有文章
                              </a>
                              <a
                                href={`/categories/${category.id}/latest`}
                                onClick={closeDrawer}
                                className="block px-3 py-2 text-sm text-gray-400 hover:text-tech-cyan transition-colors cursor-pointer"
                              >
                                最新文章
                              </a>
                              <a
                                href={`/categories/${category.id}/popular`}
                                onClick={closeDrawer}
                                className="block px-3 py-2 text-sm text-gray-400 hover:text-tech-cyan transition-colors cursor-pointer"
                              >
                                热门文章
                              </a>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Archive className="w-4 h-4 text-tech-cyan" />
                    归档浏览
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {['2025', '2024', '2023', '2022'].map((year) => (
                      <a
                        key={year}
                        href={`/archive/${year}`}
                        onClick={closeDrawer}
                        className={cn(
                          'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium',
                          'transition-all duration-200 cursor-pointer',
                          'bg-glass/20 border border-glass-border',
                          'hover:bg-tech-cyan/20 hover:text-tech-cyan'
                        )}
                        aria-label={`查看${year}年归档`}
                      >
                        {year}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-glass-border">
                <a
                  href="/settings"
                  onClick={closeDrawer}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-foreground">设置</span>
                </a>
              </div>
            </div>
          </motion.aside>
        </>
        )}
      </AnimatePresence>
    </>
  )
}
