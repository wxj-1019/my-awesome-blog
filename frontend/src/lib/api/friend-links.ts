import { apiFetch } from '@/lib/api-client';
export interface FriendLink {
  id: string;
  name: string;
  url: string;
  description?: string;
  favicon?: string;
  is_active: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
}

export interface FriendLinkCreate {
  name: string;
  url: string;
  description?: string;
  favicon?: string;
  sort_order?: number;
}

export interface FriendLinkUpdate {
  name?: string;
  url?: string;
  description?: string;
  favicon?: string;
  is_active?: boolean;
  sort_order?: number;
}

export const getFriendLinks = async (params?: {
  skip?: number;
  limit?: number;
  is_active?: boolean;
}): Promise<FriendLink[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
  if (params?.is_active !== undefined) {queryParams.append('is_active', params.is_active.toString());}

  const response = await apiFetch(`/friend-links/?${queryParams.toString()}`, {
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

export const getFriendLinkById = async (id: string): Promise<FriendLink> => {
  const response = await apiFetch(`/friend-links/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('友链不存在');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const createFriendLink = async (friendLink: FriendLinkCreate): Promise<FriendLink> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/friend-links/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(friendLink),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const updateFriendLink = async (id: string, friendLink: FriendLinkUpdate): Promise<FriendLink> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/friend-links/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(friendLink),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const deleteFriendLink = async (id: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/friend-links/${id}`, {
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
