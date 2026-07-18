import type { PublicStatisticsOverview } from '@/services/statisticsService'

export interface StatsFriendLink {
  id: string
  name: string
  url: string
  favicon: string
  description?: string
}

export interface StatsArticle {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  likes: number
  comments: number
  image?: string
}

export type { PublicStatisticsOverview }
