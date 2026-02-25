// API utilities for the blog

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export interface TypewriterContent {
  id: string;  // UUID from backend
  text: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * 获取活动的打字机内容
 * @returns Promise<TypewriterContent[]>
 */
export async function getActiveTypewriterContents(): Promise<TypewriterContent[]> {
  try {
    const response = await fetch('/api/v1/typewriter-contents/active');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch typewriter contents:', error);
    // 返回空数组作为 fallback
    return [];
  }
}

// 其他 API 函数可以在这里添加