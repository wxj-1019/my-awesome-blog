import { env } from '@/lib/env';

const API_BASE_URL = env.NEXT_PUBLIC_API_URL || 'http://localhost:8989/api/v1';

export interface TypewriterContent {
  id: string;
  text: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TypewriterContentsParams {
  skip?: number;
  limit?: number;
  active_only?: boolean;
}

export const getTypewriterContents = async (params: TypewriterContentsParams = {}): Promise<TypewriterContent[]> => {
  const queryParams = new URLSearchParams();
  
  if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.active_only !== undefined) queryParams.append('active_only', params.active_only.toString());

  const response = await fetch(`${API_BASE_URL}/typewriter-contents/?${queryParams.toString()}`, {
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

export const getActiveTypewriterContents = async (): Promise<TypewriterContent[]> => {
  const response = await fetch(`${API_BASE_URL}/typewriter-contents/active`, {
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

export const getTypewriterContentById = async (id: string): Promise<TypewriterContent> => {
  const response = await fetch(`${API_BASE_URL}/typewriter-contents/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('打字机内容不存在');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};
