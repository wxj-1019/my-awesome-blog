import { apiFetch } from '@/lib/api-client';
export interface AnalyticsData {
  period: string;
  views: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  pages_per_session: number;
}

export const getAnalytics = async (params?: {
  period?: string;
  start_date?: string;
  end_date?: string;
}): Promise<AnalyticsData[]> => {
  const queryParams = new URLSearchParams();
  if (params?.period) {queryParams.append('period', params.period);}
  if (params?.start_date) {queryParams.append('start_date', params.start_date);}
  if (params?.end_date) {queryParams.append('end_date', params.end_date);}

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/analytics/?${queryParams.toString()}`, {
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

export const getAnalyticsByPeriod = async (period: string): Promise<AnalyticsData> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/analytics/period?period=${period}`, {
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
