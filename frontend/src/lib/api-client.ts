import { env } from '@/lib/env';

/**
 * API Base URL 解析：
 * - 浏览器：优先同域相对路径 `/api/v1`（nginx 反代），避免 CORS / localhost 误注入
 * - 服务端 RSC：INTERNAL_API_URL（Compose 内 backend:8989）
 * - 开发：可用 NEXT_PUBLIC_* 指向本机
 */
function resolveApiBaseUrl(): string {
  // 服务端（RSC / SSR / Route Handler）
  if (typeof window === 'undefined') {
    const internal = process.env.INTERNAL_API_URL?.replace(/\/$/, '');
    if (internal) {
      return internal.endsWith('/api/v1') ? internal : `${internal}/api/v1`;
    }
    const pub =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      '';
    if (pub && !pub.includes('localhost') && !pub.includes('127.0.0.1')) {
      return pub.replace(/\/$/, '');
    }
    // 构建期 / 无 backend 时的兜底（仅服务端）
    return 'http://backend:8989/api/v1';
  }

  // 浏览器：同域相对路径最稳（生产经 nginx；开发经 next rewrites）
  const configured =
    env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL || '';
  if (
    configured &&
    !configured.includes('localhost') &&
    !configured.includes('127.0.0.1') &&
    !configured.includes('yourdomain') &&
    !configured.includes('your-public-host')
  ) {
    // 绝对公网 URL（可选）或已是 /api/v1
    if (configured.startsWith('/')) {
      return configured.replace(/\/$/, '') || '/api/v1';
    }
    return configured.replace(/\/$/, '');
  }

  return '/api/v1';
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
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return apiRequest<T>(endpoint, options, retries - 1);
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message ||
          `请求失败: ${response.status}`
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (retries > 0 && !(error instanceof Error && error.message === '认证失败')) {
      console.warn(`网络错误，正在重试 (${retries}次剩余): ${endpoint}`, error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return apiRequest<T>(endpoint, options, retries - 1);
    }
    throw error;
  }
}
