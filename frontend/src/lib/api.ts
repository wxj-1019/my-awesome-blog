// API utilities for the blog

export interface TypewriterContent {
  id: string;
  text: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

/**
 * 通用 API 请求函数
 */
export async function apiRequest<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
  } = options;

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

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
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
    return [];
  }
}

// 其他 API 函数可以在这里添加