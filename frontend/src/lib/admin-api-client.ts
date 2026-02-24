import { getAuthHeaders } from '@/lib/auth-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8989/api/v1';

interface ApiError {
  message: string;
  status: number;
  details?: any;
}

export class AdminApiClient {
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const headers = getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.detail || errorData.message || `请求失败: ${response.status}`,
          status: response.status,
          details: errorData,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      // 重新抛出错误，保持原始错误信息
      throw error;
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// 专门用于后台管理的API调用函数
export const adminApi = {
  articles: {
    list: (params?: { skip?: number; limit?: number; published_only?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
      if (params?.published_only !== undefined) searchParams.append('published_only', params.published_only.toString());
      
      const queryString = searchParams.toString();
      return AdminApiClient.get<any[]>(`/articles/${queryString ? `?${queryString}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get<any>(`/articles/${id}`),
    create: (data: any) => AdminApiClient.post<any>('/articles/', data),
    update: (id: string, data: any) => AdminApiClient.put<any>(`/articles/${id}`, data),
    delete: (id: string) => AdminApiClient.delete<any>(`/articles/${id}`),
  },

  categories: {
    list: () => AdminApiClient.get<any[]>('/categories/'),
    get: (id: string) => AdminApiClient.get<any>(`/categories/${id}`),
    create: (data: any) => AdminApiClient.post<any>('/categories/', data),
    update: (id: string, data: any) => AdminApiClient.put<any>(`/categories/${id}`, data),
    delete: (id: string) => AdminApiClient.delete<any>(`/categories/${id}`),
  },

  tags: {
    list: () => AdminApiClient.get<any[]>('/tags/'),
    get: (id: string) => AdminApiClient.get<any>(`/tags/${id}`),
    create: (data: any) => AdminApiClient.post<any>('/tags/', data),
    update: (id: string, data: any) => AdminApiClient.put<any>(`/tags/${id}`, data),
    delete: (id: string) => AdminApiClient.delete<any>(`/tags/${id}`),
  },
  
  users: {
    list: (params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());

      const queryString = searchParams.toString();
      return AdminApiClient.get<any[]>(`/users/${queryString ? `?${queryString}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get<any>(`/users/${id}`),
    create: (data: any) => AdminApiClient.post<any>('/users/', data),
    update: (id: string, data: any) => AdminApiClient.put<any>(`/users/${id}`, data),
    delete: (id: string) => AdminApiClient.delete<any>(`/users/${id}`),
    toggleStatus: (id: string, is_active: boolean) =>
      AdminApiClient.put<any>(`/users/${id}`, { is_active }),
  },
  
  comments: {
    list: (params?: { skip?: number; limit?: number; approved?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
      if (params?.approved !== undefined) searchParams.append('approved', params.approved.toString());

      const queryString = searchParams.toString();
      return AdminApiClient.get<any[]>(`/comments/${queryString ? `?${queryString}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get<any>(`/comments/${id}`),
    approve: (id: string) => AdminApiClient.post<any>(`/comments/${id}/approve`, {}),
    reject: (id: string) => AdminApiClient.post<any>(`/comments/${id}/reject`, {}),
    delete: (id: string) => AdminApiClient.delete<any>(`/comments/${id}`),
  },
  
  friendLinks: {
    list: () => AdminApiClient.get<any[]>('/friend-links/'),
    get: (id: string) => AdminApiClient.get<any>(`/friend-links/${id}`),
    create: (data: any) => AdminApiClient.post<any>('/friend-links/', data),
    update: (id: string, data: any) => AdminApiClient.put<any>(`/friend-links/${id}`, data),
    delete: (id: string) => AdminApiClient.delete<any>(`/friend-links/${id}`),
    toggleStatus: (id: string, is_active: boolean) =>
      AdminApiClient.put<any>(`/friend-links/${id}`, { is_active }),
  },
  
  images: {
    list: (params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());

      const queryString = searchParams.toString();
      return AdminApiClient.get<any[]>(`/images/${queryString ? `?${queryString}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get<any>(`/images/${id}`),
    upload: (formData: FormData) => {
      const headers = getAuthHeaders();
      return AdminApiClient.request<any>('/images/upload', {
        method: 'POST',
        headers: {
          ...headers,
        },
        body: formData,
      });
    },
    update: (id: string, data: any) => AdminApiClient.put<any>(`/images/${id}`, data),
    delete: (id: string) => AdminApiClient.delete<any>(`/images/${id}`),
  },
};

export default AdminApiClient;