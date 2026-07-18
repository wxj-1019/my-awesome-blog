import { apiRequest } from '@/lib/api-client';
import logger from '@/utils/logger';

export interface PublicStatisticsOverview {
  total_articles: number;
  total_views: number;
  total_comments: number;
  monthly_stats: Array<{
    year: number;
    month: number;
    articles: number;
    views: number;
  }>;
  daily_articles: Array<{
    date: string;
    count: number;
  }>;
  daily_comments: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * 获取公开的网站统计数据（无需认证）
 */
export const getPublicStatistics = async (): Promise<PublicStatisticsOverview | null> => {
  try {
    // 与 backend router prefix `/stats` 对齐：/api/v1/stats/public/overview
    return await apiRequest('/stats/public/overview');
  } catch (error) {
    logger.error('获取公开统计数据失败:', error);
    return null;
  }
};
