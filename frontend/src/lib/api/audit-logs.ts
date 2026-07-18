import { apiFetch } from '@/lib/api-client';
export interface AuditLog {
  id: string;
  user_id: string;
  user?: {
    id: string;
    username: string;
  };
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogWithUser extends AuditLog {
  user: {
    id: string;
    username: string;
  };
}

export const getAuditLogs = async (params?: {
  skip?: number;
  limit?: number;
  user_id?: string;
  action?: string;
  resource_type?: string;
}): Promise<AuditLogWithUser[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
  if (params?.user_id) {queryParams.append('user_id', params.user_id);}
  if (params?.action) {queryParams.append('action', params.action);}
  if (params?.resource_type) {queryParams.append('resource_type', params.resource_type);}

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/audit-logs/?${queryParams.toString()}`, {
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

export const getAuditLogsByUser = async (userId: string, params?: {
  skip?: number;
  limit?: number;
}): Promise<AuditLogWithUser[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
  queryParams.append('user_id', userId);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/audit-logs/?${queryParams.toString()}`, {
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
