'use client'

import { useState } from 'react'
import { Code, Star, GitFork, Eye, ExternalLink, FolderOpen, Filter } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

interface GitHubStats {
  stars: number
  forks: number
  watchers: number
}

interface Project {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  link: string
  githubUrl: string
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'tools'
  githubStats?: GitHubStats
}

const mockProjects: Project[] = [
  {
    id: '1',
    title: '个人博客系统',
    description: '基于Next.js 14和FastAPI构建的现代化个人博客系统，支持Markdown渲染、评论系统等功能',
    image: '/assets/project-blog.jpg',
    tags: ['Next.js', 'FastAPI', 'TypeScript', 'Tailwind CSS'],
    link: 'https://myblog.com',
    githubUrl: 'https://github.com/username/myblog',
    category: 'fullstack',
    githubStats: {
      stars: 245,
      forks: 32,
      watchers: 18
    }
  },
  {
    id: '2',
    title: 'React组件库',
    description: '一套基于React的UI组件库，提供丰富的基础组件和高级交互组件',
    image: '/assets/project-ui.jpg',
    tags: ['React', 'TypeScript', 'Storybook', 'Jest'],
    link: 'https://ui-library.com',
    githubUrl: 'https://github.com/username/ui-library',
    category: 'frontend',
    githubStats: {
      stars: 189,
      forks: 24,
      watchers: 12
    }
  },
  {
    id: '3',
    title: 'API服务管理平台',
    description: '企业级API服务管理平台，提供API文档、监控、限流等功能',
    image: '/assets/project-api.jpg',
    tags: ['Python', 'FastAPI', 'PostgreSQL', 'Redis'],
    link: 'https://api-platform.com',
    githubUrl: 'https://github.com/username/api-platform',
    category: 'backend',
    githubStats: {
      stars: 156,
      forks: 28,
      watchers: 15
    }
  },
  {
    id: '4',
    title: '移动端任务管理',
    description: '跨平台移动应用，支持离线使用、云同步、团队协作等功能',
    image: '/assets/project-mobile.jpg',
    tags: ['React Native', 'Redux', 'Firebase'],
    link: 'https://task-app.com',
    githubUrl: 'https://github.com/username/task-app',
    category: 'mobile',
    githubStats: {
      stars: 98,
      forks: 15,
      watchers: 8
    }
  },
  {
    id: '5',
    title: '开发工具集合',
    description: '开发者效率工具集合，包括代码格式化、文件压缩、图片优化等工具',
    image: '/assets/project-tools.jpg',
    tags: ['JavaScript', 'Node.js', 'Electron'],
    link: 'https://dev-tools.com',
    githubUrl: 'https://github.com/username/dev-tools',
    category: 'tools',
    githubStats: {
      stars: 134,
      forks: 19,
      watchers: 11
    }
  }
]

const categories = [
  { id: 'all' as const, label: '全部', count: 5, color: 'from-gray-500 to-gray-700' },
  { id: 'frontend' as const, label: '前端', count: 1, color: 'from-blue-500 to-cyan-500' },
  { id: 'backend' as const, label: '后端', count: 1, color: 'from-green-500 to-emerald-500' },
  { id: 'fullstack' as const, label: '全栈', count: 1, color: 'from-purple-500 to-pink-500' },
  { id: 'mobile' as const, label: '移动端', count: 1, color: 'from-orange-500 to-red-500' },
  { id: 'tools' as const, label: '工具', count: 1, color: 'from-yellow-500 to-orange-500' }
]

export default function Portfolio() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'tools'>('all')
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

  const filteredProjects = selectedCategory === 'all'
    ? mockProjects
    : mockProjects.filter(project => project.category === selectedCategory)

  const toggleFlip = (projectId: string) => {
    setFlippedCards(prev => new Set(prev.has(projectId) ? Array.from(prev).filter(id => id !== projectId) : [...Array.from(prev), projectId]))
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-tech-cyan to-tech-sky">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                作品集
              </h2>
              <p className="text-sm text-muted-foreground">展示我的项目作品</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Filter className="w-4 h-4 text-tech-cyan" />
            <span className="text-sm text-muted-foreground">筛选:</span>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 sm:justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                'flex items-center gap-2',
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r text-white shadow-lg shadow-tech-cyan/30'
                  : 'bg-glass/40 text-muted-foreground hover:bg-glass/60 hover:text-foreground border border-glass-border'
              )}
              style={{
                ...(selectedCategory === cat.id ? { backgroundImage: cat.color } : {})
              }}
              aria-label={`筛选${cat.label}项目`}
              aria-pressed={selectedCategory === cat.id}
            >
              {cat.label}
              <span className="text-xs opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="perspective-1000"
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d'
              }}
            >
              <div
                className={cn(
                  'relative w-full h-full transition-transform duration-700 ease-in-out',
                  'transform-gpu',
                  flippedCards.has(project.id) ? 'rotate-y-180' : ''
                )}
                style={{
                  transformStyle: 'preserve-3d'
                }}
              >
                <div
                className={cn(
                  'absolute inset-0 w-full h-full',
                  'transition-colors duration-700 ease-in-out',
                  'hover:shadow-[0_0_40px_var(--shadow-tech-cyan),0_8px_32px_rgba(0,0,0,0.12)]'
                )}
                style={{ backfaceVisibility: 'hidden' }}
              >
                  <GlassCard
                    className="h-full cursor-pointer overflow-hidden"
                    hoverEffect={false}
                    padding="none"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/avatar.jpg'
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-6">
                      <h4 className="text-xl font-bold text-foreground mb-2">
                        {project.title}
                      </h4>

                      <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs rounded-full bg-glass/20 text-tech-cyan border border-glass-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {project.githubStats && (
                        <div className="flex items-center gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-foreground">{project.githubStats.stars}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GitFork className="w-4 h-4 text-blue-500" />
                            <span className="text-foreground">{project.githubStats.forks}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-green-500" />
                            <span className="text-foreground">{project.githubStats.watchers}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-tech-cyan hover:text-tech-lightcyan transition-colors text-sm font-medium cursor-pointer"
                        >
                          查看演示
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => toggleFlip(project.id)}
                          className="text-sm text-tech-cyan hover:text-tech-lightcyan transition-colors font-medium"
                          aria-label="查看项目详情"
                        >
                          {flippedCards.has(project.id) ? '返回' : '详情'}
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <div
                  className={cn(
                    'absolute inset-0 w-full h-full',
                    'transition-all duration-700 ease-in-out'
                  )}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <GlassCard
                    className="h-full p-6"
                    hoverEffect={false}
                    padding="md"
                  >
                    <h4 className="text-xl font-bold text-foreground mb-4">
                      {project.title} - 详情
                    </h4>

                    <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                      {project.description}
                    </p>

                    <div className="mb-6">
                      <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Code className="w-4 h-4 text-tech-cyan" />
                        技术栈
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1.5 text-xs rounded-lg bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/30 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {project.githubStats && (
                      <div className="mb-6">
                        <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          GitHub统计
                        </h5>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 rounded-lg bg-glass/20 border border-glass-border">
                            <div className="text-lg font-bold text-yellow-500 mb-1">
                              {project.githubStats.stars}
                            </div>
                            <div className="text-xs text-muted-foreground">Stars</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-glass/20 border border-glass-border">
                            <div className="text-lg font-bold text-blue-500 mb-1">
                              {project.githubStats.forks}
                            </div>
                            <div className="text-xs text-muted-foreground">Forks</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-glass/20 border border-glass-border">
                            <div className="text-lg font-bold text-green-500 mb-1">
                              {project.githubStats.watchers}
                            </div>
                            <div className="text-xs text-muted-foreground">Watchers</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-sm font-medium cursor-pointer"
                      >
                        <Code className="w-4 h-4" />
                        访问GitHub仓库
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => toggleFlip(project.id)}
                        className="w-full px-4 py-2.5 rounded-lg bg-tech-cyan/20 text-tech-cyan hover:bg-tech-cyan/30 transition-colors text-sm font-medium"
                      >
                        返回预览
                      </button>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <EmptyState
            size="sm"
            compact
            icon={FolderOpen}
            title="该分类下暂无项目"
            description="试试其他分类或稍后再来"
          />
        )}
      </div>
    </section>
  )
}
