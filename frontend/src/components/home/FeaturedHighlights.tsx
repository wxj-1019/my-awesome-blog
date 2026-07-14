'use client'

import { cn } from '@/lib/utils'

interface HighlightItem {
  id: string
  type: 'pinned' | 'featured' | 'trending' | 'latest'
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  link: string
  badge: string
  color: string
  stats: {
    views?: number
    likes?: number
    comments?: number
  }
  category?: string
  readTime?: string
}

export default function FeaturedHighlights() {
  const highlights: HighlightItem[] = []

  if (highlights.length === 0) {
    return (
      <section className="relative overflow-hidden py-6">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无精选文章</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden py-6">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold">精选推荐</h2>
        <div className="grid grid-cols-1 gap-4 mt-6">
          {highlights.map((item) => (
            <div key={item.id} className={cn('p-4 rounded-lg border')}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
