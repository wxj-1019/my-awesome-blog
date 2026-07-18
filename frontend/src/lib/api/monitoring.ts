import { env } from '@/lib/env';

const API_BASE_URL = env.NEXT_PUBLIC_API_URL || 'http://localhost:8989/api/v1';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  response_time: number;
  error_rate: number;
  timestamp: string;
}

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const response = await fetch(`${API_BASE_URL}/monitoring/health`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const getSystemMetrics = async (params?: {
  period?: string;
}): Promise<SystemMetrics[]> => {
  const queryParams = new URLSearchParams();
  if (params?.period) {queryParams.append('period', params.period);}

  const response = await fetch(`${API_BASE_URL}/monitoring/metrics?${queryParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};
