import { env } from '@/lib/env';

/**
 * FastAPI 路由多为 `@router.get("/")` 挂在前缀下，无尾斜杠会 307 到绝对 backend URL，
 * 经 Next rewrite 时浏览器跟跳会变成跨域 → TypeError: Failed to fetch。
 * 仅修正「单段资源集合」：`/timeline-events` → `/timeline-events/`，保留 `/id` 路径。
 */
function normalizeApiEndpoint(endpoint: string): string {
  if (!endpoint || endpoint.startsWith('http')) {
    return endpoint;
  }
  const q = endpoint.indexOf('?');
  const path = q === -1 ? endpoint : endpoint.slice(0, q);
  const query = q === -1 ? '' : endpoint.slice(q);
  // 已有尾斜杠，或路径深度 > 1（含具体 id），不改
  if (path.endsWith('/') || path.split('/').filter(Boolean).length !== 1) {
    return endpoint;
  }
  return `${path}/${query}`;
}

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

  // 浏览器
  const configured =
    env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL || '';

  // 开发：显式本机后端时直连，避免 Next rewrite 吞尾斜杠 → FastAPI 307 绝对地址 → Failed to fetch
  if (
    process.env.NODE_ENV === 'development' &&
    configured &&
    (configured.includes('localhost') || configured.includes('127.0.0.1'))
  ) {
    return configured.replace(/\/$/, '');
  }

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
  const path = input.startsWith('http') ? input : normalizeApiEndpoint(input);
  const url = path.startsWith('http') ? path : `${base}${path}`;
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
    // 主动取消（AbortSignal）不做重试：信号已中止，重试必然立刻失败，直接抛给调用方。
    // 浏览器 fetch 中止抛 DOMException AbortError（不一定 instanceof Error），故用名称兜底判断
    const errName =
      error instanceof Error ? error.name : (error as { name?: unknown } | null)?.name;
    if (errName === 'AbortError') {
      throw error;
    }
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return apiFetch(input, options, retries - 1);
    }
    throw error;
  }
}

/** 后端错误体形状：统一 `{"error": {...}}` 嵌套；兼容 FastAPI 原生 `detail` 与旧顶层 `message` */
interface ApiErrorPayload {
  error?: { message?: unknown };
  detail?: unknown;
  message?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * 从后端错误响应体提取用户可读文案。
 * 优先级：`error.message`（统一异常处理器，backend/app/core/exception_handlers.py）
 *   → `detail`（FastAPI 原生字符串）→ `detail` 数组（422 校验，拼接各条 msg）
 *   → 顶层 `message`（旧端点）→ fallback 默认文案。
 */
export function extractApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') {
    return fallback;
  }
  const payload = data as ApiErrorPayload;

  if (
    payload.error &&
    typeof payload.error === 'object' &&
    isNonEmptyString(payload.error.message)
  ) {
    return payload.error.message;
  }

  if (isNonEmptyString(payload.detail)) {
    return payload.detail;
  }

  // 422 校验错误：detail 为数组，取各条 msg 以分号拼接
  if (Array.isArray(payload.detail)) {
    const msgs = payload.detail
      .map((item) =>
        item && typeof item === 'object' && isNonEmptyString((item as { msg?: unknown }).msg)
          ? (item as { msg: string }).msg
          : ''
      )
      .filter(Boolean);
    if (msgs.length > 0) {
      return msgs.join('; ');
    }
  }

  if (isNonEmptyString(payload.message)) {
    return payload.message;
  }

  return fallback;
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
    const path = normalizeApiEndpoint(endpoint);
    const response = await fetch(`${base}${path}`, config);

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

      const errorData: unknown = await response.json().catch(() => null);
      throw new Error(
        extractApiErrorMessage(errorData, `请求失败: ${response.status}`)
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
