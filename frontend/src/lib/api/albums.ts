import { env } from '@/lib/env';

const API_BASE_URL = env.NEXT_PUBLIC_API_URL || 'http://localhost:8989/api/v1';

export interface Album {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  image_count: number;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
}

export const getAlbums = async (params?: {
  skip?: number;
  limit?: number;
}): Promise<Album[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}

  const response = await fetch(`${API_BASE_URL}/albums/?${queryParams.toString()}`, {
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

export const getAlbumById = async (id: string): Promise<Album> => {
  const response = await fetch(`${API_BASE_URL}/albums/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('相册不存在');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};
