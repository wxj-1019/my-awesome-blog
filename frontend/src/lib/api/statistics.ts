import { apiFetch, extractApiErrorMessage } from '@/lib/api-client';
import logger from '@/utils/logger';

/** 统一解析统计接口错误：兼容统一异常处理器嵌套 error / FastAPI 原生 detail */
async function toApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const data: unknown = await response.json().catch(() => null);
  return extractApiErrorMessage(data, fallback);
}

export interface WebsiteStatistics {
  total_users: number;
  total_articles: number;
  total_comments: number;
  total_views: number;
  total_likes: number;
  active_users: number;
}

export interface ArticleStatistics {
  article_id: string;
  title: string;
  view_count: number;
  like_count: number;
  comment_count: number;
}

export interface GrowthStatistics {
  period: string;
  new_users: number;
  new_articles: number;
  new_comments: number;
  total_views: number;
}

export const getWebsiteStats = async (): Promise<WebsiteStatistics> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/stats/website`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(await toApiErrorMessage(response, `请求失败: ${response.status}`));
  }

  return response.json();
};

export const getPopularArticlesStats = async (limit: number = 10): Promise<ArticleStatistics[]> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/stats/articles/popular?limit=${limit}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(await toApiErrorMessage(response, `请求失败: ${response.status}`));
  }

  return response.json();
};

export const getGrowthStats = async (params?: {
  days?: number;
  period?: string;
}): Promise<GrowthStatistics[]> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const queryParams = new URLSearchParams();
  if (params?.days) {queryParams.append('days', params.days.toString());}
  if (params?.period) {queryParams.append('period', params.period);}

  const response = await apiFetch(`/stats/growth?${queryParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(await toApiErrorMessage(response, `请求失败: ${response.status}`));
  }

  return response.json();
};

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
 * 获取公开的网站统计数据（无需认证）。
 * 与 backend router prefix `/stats` 对齐：/api/v1/stats/public/overview。
 * 失败时返回 null（不抛出），调用方按空数据渲染（原 statisticsService 行为）。
 */
export const getPublicStatistics = async (): Promise<PublicStatisticsOverview | null> => {
  try {
    const response = await apiFetch('/stats/public/overview', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(await toApiErrorMessage(response, `请求失败: ${response.status}`));
    }

    return await response.json();
  } catch (error) {
    logger.error('获取公开统计数据失败:', error);
    return null;
  }
};
