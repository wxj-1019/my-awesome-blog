// 兼容旧服务层：统一走 api-client（含 base URL、token、重试）
import { apiRequest as coreRequest, API_BASE_URL } from '@/lib/api-client';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * 将历史代码中的绝对/相对路径规范为 api-client 可用的 endpoint。
 * - `/api/v1/xxx` → `/xxx`（base 已含 /api/v1）
 * - `http(s)://host/api/v1/xxx` → `/xxx`
 * - `/xxx` 保持不变
 */
function normalizeEndpoint(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    try {
      const url = new URL(endpoint);
      const path = url.pathname + url.search;
      if (path.startsWith('/api/v1')) {
        return path.slice('/api/v1'.length) || '/';
      }
      return path;
    } catch {
      return endpoint;
    }
  }

  if (endpoint.startsWith('/api/v1')) {
    return endpoint.slice('/api/v1'.length) || '/';
  }

  return endpoint;
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  return coreRequest<T>(normalizeEndpoint(endpoint), {
    method,
    body,
    headers,
  });
}

export interface TypewriterContent {
  id: string;
  text: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * 获取活动的打字机内容
 */
export async function getActiveTypewriterContents(): Promise<TypewriterContent[]> {
  try {
    return await apiRequest<TypewriterContent[]>('/typewriter-contents/active');
  } catch (error) {
    console.error('Failed to fetch typewriter contents:', error);
    return [];
  }
}

export { API_BASE_URL };
