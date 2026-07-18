'use client'

import { useState } from 'react'
import { Tag, Search, TrendingUp, Filter, Hash } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { cn } from '@/lib/utils'

interface TagItem {
  id: string
  name: string
  count: number
  category: string
  trend: number
  color: string
}

const mockTags: TagItem[] = [
  { id: '1', name: 'React', count: 145, category: '前端', trend: 12, color: 'from-blue-500 to-cyan-500' },
  { id: '2', name: 'Next.js', count: 132, category: '前端', trend: 18, color: 'from-gray-700 to-gray-900' },
  { id: '3', name: 'TypeScript', count: 128, category: '前端', trend: 15, color: 'from-blue-600 to-blue-800' },
  { id: '4', name: 'Python', count: 98, category: '后端', trend: 8, color: 'from-yellow-500 to-yellow-600' },
  { id: '5', name: 'FastAPI', count: 87, category: '后端', trend: 22, color: 'from-green-500 to-green-700' },
  { id: '6', name: 'PostgreSQL', count: 76, category: '后端', trend: 5, color: 'from-blue-600 to-indigo-700' },
  { id: '7', name: 'Docker', count: 65, category: 'DevOps', trend: 10, color: 'from-blue-500 to-blue-600' },
  { id: '8', name: 'Git', count: 54, category: '工具', trend: 3, color: 'from-orange-500 to-red-500' },
  { id: '9', name: 'Tailwind CSS', count: 48, category: '前端', trend: 20, color: 'from-teal-400 to-teal-600' },
  { id: '10', name: 'GraphQL', count: 42, category: '后端', trend: 14, color: 'from-pink-500 to-purple-500' },
  { id: '11', name: 'AWS', count: 38, category: 'DevOps', trend: 7, color: 'from-orange-400 to-orange-600' },
  { id: '12', name: 'Redis', count: 35, category: '后端', trend: 11, color: 'from-red-500 to-red-700' }
]

const categories = [
  { id: 'all' as const, label: '全部', count: 948 },
  { id: '前端' as const, label: '前端', count: 453 },
  { id: '后端' as const, label: '后端', count: 286 },
  { id: 'DevOps' as const, label: 'DevOps', count: 103 },
  { id: '工具' as const, label: '工具', count: 106 }
]

export default function TagCloud() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | '前端' | '后端' | 'DevOps' | '工具'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'count' | 'trend' | 'name'>('count')

  const filteredTags = mockTags
    .filter(tag => {
      const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory
      const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'count') {return b.count - a.count}
      if (sortBy === 'trend') {return b.trend - a.trend}
      return a.name.localeCompare(b.name)
    })

  const getTrendColor = (trend: number) => {
    if (trend > 15) {return 'text-green-500 dark:text-green-400'}
    if (trend > 8) {return 'text-yellow-500 dark:text-yellow-400'}
    return 'text-muted-foreground'
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 15) {return '↑'}
    if (trend > 8) {return '→'}
    return '↓'
  }

  return (
    <GlassCard className="rounded-2xl p-6 sm:p-8" aria-label="标签云">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-tech-cyan to-tech-sky">
            <Hash className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">标签云</h3>
            <p className="text-sm text-muted-foreground">探索热门话题</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-muted-foreground">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'count' | 'trend' | 'name')}
            className="px-3 py-1.5 rounded-lg bg-glass/20 border border-glass-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-tech-cyan/50"
            aria-label="排序方式"
          >
            <option value="count">按文章数</option>
            <option value="trend">按热度趋势</option>
            <option value="name">按名称</option>
          </select>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-glass/20 border border-glass-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标签..."
              className="w-full px-4 py-3 pl-10 rounded-lg bg-glass/40 border border-glass-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
              aria-label="搜索标签"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  selectedCategory === cat.id
                    ? 'bg-tech-cyan text-white shadow-lg shadow-tech-cyan/30'
                    : 'bg-glass/40 text-gray-400 hover:bg-glass/60 hover:text-gray-200'
                )}
                aria-label={`筛选${cat.label}标签`}
                aria-pressed={selectedCategory === cat.id}
              >
                {cat.label}
                <span className="ml-1 text-xs opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredTags.map((tag) => (
          <a
            key={tag.id}
            href={`/tags/${tag.name.toLowerCase()}`}
            className={cn(
              'group relative overflow-hidden rounded-xl p-4',
              'bg-gradient-to-br',
              tag.color,
              'text-white',
              'transform-gpu transition-all duration-300 ease-out',
              'hover:scale-105 hover:-translate-y-1 hover:shadow-xl',
              'cursor-pointer'
            )}
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
            aria-label={`查看${tag.name}标签的文章 (${tag.count}篇)`}
          >
            <div className="relative z-10 flex flex-col items-center gap-2">
              <Tag className="w-6 h-6 transform group-hover:rotate-12 transition-transform duration-300" />

              <span className="font-semibold text-center text-sm sm:text-base">
                {tag.name}
              </span>

              <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${Math.min((tag.count / 150) * 100, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between w-full text-xs mt-1">
                <span className="opacity-90">{tag.count} 篇</span>
                <div className={cn('flex items-center gap-1', getTrendColor(tag.trend))}>
                  <span className="font-bold">{getTrendIcon(tag.trend)}</span>
                  <span className="font-medium">{tag.trend}%</span>
                </div>
              </div>
            </div>

            <div
              className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Tag className="w-10 h-10 text-white mx-auto mb-2" />
                  <p className="font-bold text-lg">{tag.name}</p>
                  <p className="text-sm mt-1 opacity-90">点击查看文章</p>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-glass-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-tech-cyan" />
            <span className="text-foreground font-medium">
              显示 {filteredTags.length} 个标签
            </span>
            <span className="text-muted-foreground">
              (共 {mockTags.length} 个)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">热门趋势:</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold">+12.5%</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
