'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Award, Calendar, Image, Video, ChevronDown, ChevronRight, Badge, ExternalLink, FileText } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { cn } from '@/lib/utils'
import { timelineService, TimelineEvent as ApiTimelineEvent } from '@/services/timelineService'
import { BlurIn } from '@/components/motion'

interface MediaItem {
  type: 'image' | 'video' | 'article'
  url: string
  title: string
}

interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  badge?: {
    type: 'milestone' | 'achievement' | 'award' | 'project'
    label: string
    color: string
  }
  media?: MediaItem[]
  link?: string
}

const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    date: '2024-12',
    title: '完成100篇技术博客',
    description: '坚持写作100篇技术博客，分享前端、后端和DevOps相关的知识和经验',
    badge: {
      type: 'milestone',
      label: '里程碑',
      color: 'from-purple-500 to-pink-500'
    }
  },
  {
    id: '2',
    date: '2024-10',
    title: '开源项目获得500+ Star',
    description: '个人开源项目在GitHub上获得超过500个Star，感谢社区的支持',
    badge: {
      type: 'achievement',
      label: '成就',
      color: 'from-yellow-500 to-orange-500'
    },
    media: [
      { type: 'image', url: '/assets/project-screenshot.jpg', title: '项目截图' }
    ],
    link: 'https://github.com/yourproject'
  },
  {
    id: '3',
    date: '2024-08',
    title: '技术文章被推荐',
    description: '多篇技术文章被掘金、知乎等平台推荐，累计阅读量超过10万',
    badge: {
      type: 'award',
      label: '荣誉',
      color: 'from-red-500 to-pink-500'
    },
    media: [
      { type: 'article', url: '/articles/featured', title: '推荐文章' }
    ]
  },
  {
    id: '4',
    date: '2024-06',
    title: '发布第一个开源项目',
    description: '正式发布第一个开源项目，为开发者提供实用的工具库',
    badge: {
      type: 'project',
      label: '项目',
      color: 'from-blue-500 to-cyan-500'
    },
    media: [
      { type: 'video', url: '/assets/project-demo.mp4', title: '项目演示' }
    ],
    link: 'https://github.com/yourproject'
  },
  {
    id: '5',
    date: '2024-03',
    title: '开始技术博客之旅',
    description: '创建个人技术博客，开始系统性地记录学习和成长历程',
    badge: {
      type: 'milestone',
      label: '起点',
      color: 'from-green-500 to-emerald-500'
    }
  }
]

function mapApiEventToTimelineEvent(apiEvent: ApiTimelineEvent): TimelineEvent {
  return {
    id: apiEvent.id,
    date: apiEvent.event_date,
    title: apiEvent.title,
    description: apiEvent.description || '',
    badge: {
      type: apiEvent.event_type as 'milestone' | 'achievement' | 'award' | 'project',
      label: apiEvent.event_type === 'milestone' ? '里程碑' :
             apiEvent.event_type === 'achievement' ? '成就' :
             apiEvent.event_type === 'award' ? '荣誉' : '项目',
      color: apiEvent.color || 'from-purple-500 to-pink-500'
    }
  }
}

const badgeIcons = {
  milestone: Award,
  achievement: Award,
  award: Badge,
  project: FileText
}

const mediaIcons = {
  image: Image,
  video: Video,
  article: FileText
}

// 节点脉冲动画变体
const pulseVariants = {
  initial: {
    boxShadow: '0 0 0px rgba(6, 182, 212, 0.4)'
  },
  animate: {
    boxShadow: [
      '0 0 0px rgba(6, 182, 212, 0.4)',
      '0 0 20px rgba(6, 182, 212, 0.8)',
      '0 0 0px rgba(6, 182, 212, 0.4)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const
    }
  }
}

// 垂直线动画变体
const lineVariants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: {
      duration: 1.5,
      ease: 'easeOut' as const
    }
  }
}

interface TimelineEventItemProps {
  event: TimelineEvent
  index: number
}

function TimelineEventItem({ event, index }: TimelineEventItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMediaPreview, setShowMediaPreview] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const isLeft = index % 2 === 0

  const slideVariants = {
    hidden: {
      x: shouldReduceMotion ? 0 : (isLeft ? -80 : 80),
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : 30,
      scale: shouldReduceMotion ? 1 : 0.9
    },
    visible: {
      x: 0,
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
        delay: index * 0.1
      }
    }
  } as const

  // 节点动画
  const dotVariants = {
    hidden: {
      scale: shouldReduceMotion ? 1 : 0,
      opacity: shouldReduceMotion ? 1 : 0
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'backOut' as const,
        delay: index * 0.1 + 0.2
      }
    }
  }

  const BadgeIcon = event.badge ? badgeIcons[event.badge.type] : null

  return (
    <div
      className={cn('relative flex items-start mb-8 sm:mb-10 lg:mb-12', isLeft ? 'flex-row' : 'flex-row-reverse')}
    >
      {/* 时间线节点 */}
      <div className="relative z-20 w-12 h-16 sm:w-16 flex items-center justify-center flex-shrink-0">
        <motion.div
          variants={dotVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          animate={shouldReduceMotion ? {} : 'animate'}
          className="w-4 h-4 sm:w-5 sm:h-5 bg-tech-cyan rounded-full relative"
          style={{
            backgroundColor: 'var(--tech-cyan)',
            filter: 'blur(0.5px)'
          }}
        >
          {/* 脉冲效果环 */}
          {!shouldReduceMotion && (
            <motion.div
              className="absolute inset-0 rounded-full bg-tech-cyan"
              variants={pulseVariants}
              initial="initial"
              animate="animate"
              style={{ backgroundColor: 'var(--tech-cyan)' }}
            />
          )}
        </motion.div>
      </div>

      {/* 卡片内容 */}
      <motion.div
        variants={slideVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="flex-1 ml-3 sm:ml-4"
      >
        <GlassCard
          className="relative z-10"
          hoverEffect={true}
          padding="sm"
        >
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-tech-cyan" />
              <span className="text-xs sm:text-sm text-tech-cyan font-medium">{event.date}</span>
            </div>

            {event.badge && BadgeIcon && (
              <div
                className={cn(
                  'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold',
                  'bg-gradient-to-r',
                  event.badge.color,
                  'text-white'
                )}
              >
                <BadgeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {event.badge.label}
              </div>
            )}
          </div>

          <h4 className="text-base sm:text-lg font-bold text-foreground mb-1.5 sm:mb-2">{event.title}</h4>

          <p
            className={cn(
              'text-xs sm:text-sm text-muted-foreground transition-all duration-300',
              !isExpanded && 'line-clamp-2'
            )}
          >
            {event.description}
          </p>

          {(event.media || event.link) && (
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              {event.media && event.media.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowMediaPreview(!showMediaPreview)}
                    className="flex items-center gap-2 text-xs sm:text-sm text-tech-cyan hover:text-tech-lightcyan transition-colors"
                    aria-expanded={showMediaPreview}
                    aria-label={showMediaPreview ? '隐藏媒体预览' : '显示媒体预览'}
                  >
                    {showMediaPreview ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        隐藏媒体
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        查看媒体 ({event.media.length})
                      </>
                    )}
                  </button>

                  {showMediaPreview && (
                    <div className="mt-2 sm:mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 animate-fade-in-up">
                      {event.media.map((media, idx) => {
                        const MediaIcon = mediaIcons[media.type]
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'relative group overflow-hidden rounded-lg',
                              'bg-glass/20 border border-glass-border',
                              'cursor-pointer transition-all duration-300',
                              'hover:scale-105 hover:shadow-lg'
                            )}
                            onClick={() => window.open(media.url, '_blank')}
                            aria-label={`查看${media.title}`}
                          >
                            <div className="p-2 sm:p-3 flex flex-col items-center gap-1.5 sm:gap-2">
                              <MediaIcon className="w-6 h-6 sm:w-8 sm:h-8 text-tech-cyan" />
                              <span className="text-[10px] sm:text-xs text-center text-foreground truncate w-full">{media.title}</span>
                            </div>

                            <div className="absolute inset-0 bg-tech-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm text-tech-cyan hover:text-tech-lightcyan transition-colors"
                >
                  查看详情
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
              )}
            </div>
          )}

          {event.description.length > 100 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 sm:mt-3 flex items-center gap-1 text-xs sm:text-sm text-tech-cyan hover:text-tech-lightcyan transition-colors"
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  展开更多
                </>
              )}
            </button>
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}

function ChevronUp({ className }: { className?: string }) {
  return <ChevronDown className={className} style={{ transform: 'rotate(180deg)' }} />
}

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const apiEvents = await timelineService.getTimelineEvents({ is_active: true })
        setEvents(apiEvents.map(mapApiEventToTimelineEvent))
      } catch (error) {
        console.error('Failed to load timeline events:', error)
        setEvents(mockEvents)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  return (
    <section className="py-12 sm:py-14 md:py-16 lg:py-20 relative overflow-hidden">
      <div data-testid="timeline-route-layer" className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute left-1/2 top-8 h-[calc(100%-4rem)] w-px bg-gradient-to-b from-transparent via-tech-cyan/15 to-transparent" />
        <div className="absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-tech-cyan/20 to-transparent" />
        <div className="absolute left-[8%] top-24 h-24 w-24 rounded-full border border-tech-cyan/10 shadow-[0_0_60px_rgba(6,182,212,.1)]" />
        <div className="absolute right-[10%] bottom-24 h-32 w-32 rounded-full border border-purple-500/10 shadow-[0_0_70px_rgba(168,85,247,.1)]" />
      </div>
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <BlurIn className="mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground">
            我的历程
          </h2>
        </BlurIn>

        {loading ? (
          <div className="flex justify-center items-center py-16 sm:py-20">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-tech-cyan" aria-label="时间线加载中" />
          </div>
        ) : (
          <div className="relative max-w-4xl mx-auto px-2 sm:px-4">
            {/* 垂直时间线 */}
            <motion.div
              variants={shouldReduceMotion ? undefined : lineVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 origin-top"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, var(--tech-cyan) 10%, var(--tech-cyan) 90%, transparent 100%)',
                filter: 'blur(0.5px)'
              }}
            />

            {/* 发光效果背景 */}
            <div className="absolute left-6 sm:left-8 top-0 h-full w-32 sm:w-40 -ml-16 sm:-ml-20 bg-gradient-to-r from-transparent via-tech-cyan/10 to-transparent opacity-30 pointer-events-none" />

            {events.map((event, index) => (
              <TimelineEventItem key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
