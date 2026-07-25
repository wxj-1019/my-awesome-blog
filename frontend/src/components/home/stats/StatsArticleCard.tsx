'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Calendar, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from '@/lib/framer-motion'
import type { StatsArticle } from './types'

export function StatsArticleCard({ article, index }: { article: StatsArticle; index: number }) {
  const [imageError, setImageError] = useState(false)

  return (
    <motion.article 
      role="article" 
      aria-label={article.title} 
      tabIndex={0} 
      className="group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        key={article.id}
        className="glass-card backdrop-blur-xl bg-card/40 hover:bg-card/60 hover:shadow-[var(--glass-shadow)] border-glass-border hover:border-tech-cyan/30 transition-[colors,transform,box-shadow] duration-300 hover:scale-[1.01] overflow-hidden cursor-pointer"
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
              <motion.img
                src={imageError ? '/assets/avatar.jpg' : (article.image || '/assets/avatar.jpg')}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex-1 p-4 sm:p-6 flex flex-col">
              <div className="flex items-start justify-between gap-4 flex-1">
                <motion.div 
                  className="flex-1"
                  whileHover={{ x: 8 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground group-hover:text-tech-cyan transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-muted-foreground mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">
                    {article.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1" aria-label={`发布日期：${article.date}`}>
                      <Calendar className="w-4 h-4" />
                      <time>{article.date}</time>
                    </div>
                    <div className="flex items-center gap-1" aria-label={`点赞数：${article.likes}`}>
                      <Heart className="w-4 h-4" />
                      <span>{article.likes}</span>
                    </div>
                    <div className="flex items-center gap-1" aria-label={`评论数：${article.comments}`}>
                      <MessageCircle className="w-4 h-4" />
                      <span>{article.comments}</span>
                    </div>
                    <span className="px-2 sm:px-3 py-1 rounded-full bg-tech-cyan/20 text-tech-cyan text-xs font-medium">
                      {article.category}
                    </span>
                  </div>
                </motion.div>

                <div className="flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-full bg-tech-cyan/20 flex items-center justify-center group-hover:bg-tech-cyan transition-colors"
                    aria-label="查看文章详情"
                  >
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="w-5 h-5 text-tech-cyan group-hover:text-white transition-transform" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.article>
  )
}

