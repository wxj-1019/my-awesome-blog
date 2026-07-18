import { apiFetch } from '@/lib/api-client';
export interface Tag {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface TagCreate {
  name: string;
  description?: string;
}

export interface TagUpdate {
  name?: string;
  description?: string;
}

export interface TagWithArticleCount extends Tag {
  article_count: number;
}

export const getTags = async (params?: {
  skip?: number;
  limit?: number;
}): Promise<TagWithArticleCount[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}

  const response = await apiFetch(`/tags/?${queryParams.toString()}`, {
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

export const getTagById = async (id: string): Promise<Tag> => {
  const response = await apiFetch(`/tags/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('标签不存在');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const createTag = async (tag: TagCreate): Promise<Tag> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/tags/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(tag),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const updateTag = async (id: string, tag: TagUpdate): Promise<Tag> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/tags/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(tag),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const deleteTag = async (id: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/tags/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }
};
