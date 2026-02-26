import { env } from '@/lib/env';

const API_BASE_URL = env.NEXT_PUBLIC_API_URL || 'http://localhost:8989/api/v1';

interface ApiClientOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiClientOptions = {},
  retries = 1
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login?message=认证已过期，请重新登录';
        }
        throw new Error('认证失败');
      }

      if ((response.status >= 500 || response.status === 0) && retries > 0) {
        console.warn(`请求失败，正在重试 (${retries}次剩余): ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return apiRequest<T>(endpoint, options, retries - 1);
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `请求失败: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(`网络错误，正在重试 (${retries}次剩余): ${endpoint}`, error);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiRequest<T>(endpoint, options, retries - 1);
    }
    throw error;
  }
}

export const get = <T = unknown>(endpoint: string, options: RequestInit = {}) =>
  apiRequest<T>(endpoint, { ...options, method: 'GET' });

export const post = <T = unknown>(endpoint: string, data?: unknown, options: RequestInit = {}) =>
  apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data,
  });

export const put = <T = unknown>(endpoint: string, data?: unknown, options: RequestInit = {}) =>
  apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data,
  });

export const del = <T = unknown>(endpoint: string, options: RequestInit = {}) =>
  apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
