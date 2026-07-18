'use client'

import { cn } from '@/lib/utils'
import { BlurIn, FadeIn, Stagger, StaggerItem } from '@/components/motion'

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
          <FadeIn>
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无精选文章</p>
            </div>
          </FadeIn>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden py-6">
      <div className="container mx-auto px-4">
        <BlurIn>
          <h2 className="text-xl font-bold text-foreground">精选推荐</h2>
        </BlurIn>
        <Stagger className="grid grid-cols-1 gap-4 mt-6" itemCount={highlights.length}>
          {highlights.map((item) => (
            <StaggerItem key={item.id}>
              <div className={cn('p-4 rounded-lg border border-glass-border bg-glass/20')}>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
