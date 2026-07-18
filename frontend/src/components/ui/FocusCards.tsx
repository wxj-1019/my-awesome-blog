'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {  Clock, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { Album } from '@/types'
import { cn } from '@/lib/utils'
import { useThemedClasses } from '@/hooks/useThemedClasses'

interface FocusCardsProps {
  cards: Album[]
  className?: string
}

export function FocusCards({ cards, className }: FocusCardsProps) {
  const { getThemeClass } = useThemedClasses()

  if (cards.length === 0) {return null;}

  return (
    <div className={cn('container mx-auto px-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group"
          >
            <Link href={`/articles/${card.slug || card.id}`}>
              <div
                className={cn(
                  'relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
                  getThemeClass(
                    'bg-glass/30 backdrop-blur-xl border border-glass-border',
                    'bg-white/90 backdrop-blur-xl border-gray-300 shadow-gray-200/50'
                  )
                )}
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={card.coverImage || '/assets/placeholder.svg'}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {card.featured && (
                    <div className="absolute top-4 left-4">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm',
                          getThemeClass('bg-tech-cyan/90 text-white', 'bg-tech-cyan/90 text-white')
                        )}
                      >
                        精选
                      </span>
                    </div>
                  )}

                  {card.technologies && card.technologies.length > 0 && (
                    <div className="absolute top-4 right-4 flex flex-wrap gap-1 justify-end">
                      {card.technologies.slice(0, 2).map((tech) => (
                        <span
                          key={tech}
                          className={cn(
                            'px-2 py-1 rounded text-xs backdrop-blur-sm',
                            getThemeClass('bg-white/10 text-white', 'bg-white/80 text-gray-800')
                          )}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3
                    className={cn(
                      'text-xl font-bold text-white mb-2 line-clamp-2',
                      'group-hover:text-tech-cyan transition-colors'
                    )}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={cn(
                      'text-sm text-gray-300 line-clamp-2 mb-4',
                      getThemeClass('', 'text-gray-600')
                    )}
                  >
                    {card.description}
                  </p>

                  <div className="flex items-center justify-between">
                    {card.date && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-tech-cyan" />
                        <span className="text-xs text-gray-300">
                          {new Date(card.date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    )}

                    <button className="p-2 rounded-full bg-tech-cyan/20 hover:bg-tech-cyan hover:scale-110 active:scale-95 backdrop-blur-sm transition-all duration-200">
                      <ArrowRight className="w-5 h-5 text-tech-cyan group-hover:text-white transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default FocusCards
