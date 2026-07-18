'use client'

import { ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import ArticleCardSkeleton from '../ArticleCardSkeleton'
import { StatsArticleCard } from './StatsArticleCard'
import type { StatsArticle } from './types'

export function StatsArticleList({ articles, loading, error, onRetry }: { articles: StatsArticle[]; loading: boolean; error: string | null; onRetry: () => void }) {
  if (loading) {
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">
          最新文章
        </h2>
        <div className="space-y-4 sm:space-y-6">
          {[1, 2, 3].map((i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">
          最新文章
        </h2>
        <Card className="p-6 sm:p-8 text-center">
          <AlertCircle className="w-14 h-14 sm:w-16 sm:h-16 text-error mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">加载失败</h3>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            重新加载
          </Button>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">
        最新文章
      </h2>

      <div className="space-y-4 sm:space-y-6">
        {articles.map((article, index) => (
          <StatsArticleCard key={article.id} article={article} index={index} />
        ))}
      </div>

      <div className="text-center pt-4">
        <Button
          variant="link"
          className="text-tech-cyan hover:text-tech-lightcyan group inline-flex items-center gap-1"
          aria-label="查看更多文章"
        >
          查看更多文章
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  )
}

