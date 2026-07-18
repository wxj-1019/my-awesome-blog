import { env } from '@/lib/env';

/**
 * 浏览器：走公网/同域 API（NEXT_PUBLIC_*，构建期注入）。
 * 服务端（RSC/SSR）：优先 INTERNAL_API_URL，在 Compose 内直连 backend:8989。
 */
function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    const internal = process.env.INTERNAL_API_URL?.replace(/\/$/, '');
    if (internal) {
      return internal.endsWith('/api/v1') ? internal : `${internal}/api/v1`;
    }
  }
  return (
    env.NEXT_PUBLIC_API_URL ||
    env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8989/api/v1'
  );
}

export const API_BASE_URL = resolveApiBaseUrl();
export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'auth_user';

interface ApiClientOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiFetch(
  input: string,
  options: RequestInit = {},
  retries = 1
): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const base = resolveApiBaseUrl();
  const url = input.startsWith('http') ? input : `${base}${input}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiFetch(input, options, retries - 1);
    }
    throw error;
  }
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiClientOptions = {},
  retries = 1
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

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
    const base = resolveApiBaseUrl();
    const response = await fetch(`${base}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
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

export const patch = <T = unknown>(endpoint: string, data?: unknown, options: RequestInit = {}) =>
  apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data,
  });
