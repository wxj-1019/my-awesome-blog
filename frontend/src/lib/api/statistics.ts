import { apiFetch } from '@/lib/api-client';
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};
