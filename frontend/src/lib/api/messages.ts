import { apiFetch } from '@/lib/api-client';
export interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  receiver_id?: string;
  receiver?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string;
}

export interface MessageCreate {
  content: string;
  receiver_id?: string;
}

export interface MessageUpdate {
  content?: string;
  is_read?: boolean;
  is_deleted?: boolean;
}

export interface MessageWithUser extends Message {
  sender: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  receiver?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export const getMessages = async (params?: {
  skip?: number;
  limit?: number;
  is_read?: boolean;
  is_deleted?: boolean;
}): Promise<MessageWithUser[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
  if (params?.is_read !== undefined) {queryParams.append('is_read', params.is_read.toString());}
  if (params?.is_deleted !== undefined) {queryParams.append('is_deleted', params.is_deleted.toString());}

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/messages/?${queryParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const getMessageById = async (id: string): Promise<MessageWithUser> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/messages/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('消息不存在');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const createMessage = async (message: MessageCreate): Promise<Message> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const updateMessage = async (id: string, message: MessageUpdate): Promise<Message> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/messages/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const deleteMessage = async (id: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/messages/${id}`, {
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

export const markAsRead = async (id: string): Promise<Message> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/messages/${id}/read`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const getUnreadMessages = async (params?: {
  skip?: number;
  limit?: number;
}): Promise<MessageWithUser[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/messages/unread?${queryParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const markAllAsRead = async (): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/messages/read-all`, {
    method: 'PUT',
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
