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
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { raw: errorText };
        }
        
        const error: ApiError = {
          message: errorData.detail || errorData.message || `请求失败: ${response.status}`,
          status: response.status,
          details: errorData,
        };
        throw error;
      }

      const responseText = await response.text();
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText as unknown as T;
      }
    } catch (error: unknown) {
      if (error instanceof TypeError) {
        const apiError: ApiError = {
          message: '无法连接到服务器，请检查网络连接或后端服务',
          status: 0,
          details: error,
        };
        throw apiError;
      }
      throw error;
    }
  }

  static get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  static put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  static delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const adminApi = {
  articles: {
    list: (params?: { skip?: number; limit?: number; published_only?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.published_only !== undefined) searchParams.set('published_only', params.published_only.toString());
      const query = searchParams.toString();
      return AdminApiClient.get(`/articles/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/articles/${id}`),
    create: (data: any) => AdminApiClient.post('/articles/', data),
    update: (id: string, data: any) => AdminApiClient.put(`/articles/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/articles/${id}`),
  },
  
  categories: {
    list: (params?: { skip?: number; limit?: number; is_active?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
      const query = searchParams.toString();
      return AdminApiClient.get(`/categories/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/categories/${id}`),
    create: (data: any) => AdminApiClient.post('/categories/', data),
    update: (id: string, data: any) => AdminApiClient.put(`/categories/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/categories/${id}`),
  },
  
  tags: {
    list: (params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      const query = searchParams.toString();
      return AdminApiClient.get(`/tags/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/tags/${id}`),
    create: (data: any) => AdminApiClient.post('/tags/', data),
    update: (id: string, data: any) => AdminApiClient.put(`/tags/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/tags/${id}`),
  },
  
  comments: {
    list: (params?: { skip?: number; limit?: number; approved?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.approved !== undefined) searchParams.set('approved', params.approved.toString());
      const query = searchParams.toString();
      return AdminApiClient.get(`/comments/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/comments/${id}`),
    approve: (id: string) => AdminApiClient.put(`/comments/${id}/approve`, {}),
    reject: (id: string) => AdminApiClient.put(`/comments/${id}/reject`, {}),
    delete: (id: string) => AdminApiClient.delete(`/comments/${id}`),
  },
  
  friendLinks: {
    list: () => AdminApiClient.get('/friend-links/'),
    get: (id: string) => AdminApiClient.get(`/friend-links/${id}`),
    create: (data: any) => AdminApiClient.post('/friend-links/', data),
    update: (id: string, data: any) => AdminApiClient.put(`/friend-links/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/friend-links/${id}`),
    toggleStatus: (id: string, is_active: boolean) => AdminApiClient.put(`/friend-links/${id}`, { is_active }),
  },
  
  images: {
    list: (params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      const query = searchParams.toString();
      return AdminApiClient.get(`/images/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/images/${id}`),
    upload: (formData: FormData) => 
      fetch(`${API_BASE_URL}/images/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      }),
    delete: (id: string) => AdminApiClient.delete(`/images/${id}`),
  },
  
  users: {
    list: (params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      const query = searchParams.toString();
      return AdminApiClient.get(`/users/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/users/${id}`),
    create: (data: any) => AdminApiClient.post('/users/', data),
    update: (id: string, data: any) => AdminApiClient.put(`/users/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/users/${id}`),
    toggleStatus: (id: string, is_active: boolean) => AdminApiClient.put(`/users/${id}`, { is_active }),
  },
};
