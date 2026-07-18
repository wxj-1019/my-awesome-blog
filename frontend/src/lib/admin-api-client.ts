import { getAuthHeaders } from '@/lib/auth-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8989/api/v1';

interface ApiError {
  message: string;
  status: number;
  details?: unknown;
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
        let errorData: Record<string, unknown> | { raw: string } = {};
        try {
          errorData = JSON.parse(errorText) as Record<string, unknown>;
        } catch {
          errorData = { raw: errorText };
        }

        const message =
          (errorData && typeof errorData === 'object' && 'detail' in errorData && String(errorData.detail)) ||
          (errorData && typeof errorData === 'object' && 'message' in errorData && String(errorData.message)) ||
          `请求失败: ${response.status}`;

        const error: ApiError = {
          message,
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

  static post<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
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

  static put<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
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
  get: <T>(endpoint: string, options?: { params?: Record<string, string | number | boolean> }) => {
    if (options?.params) {
      const searchParams = new URLSearchParams()
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value))
        }
      })
      const query = searchParams.toString()
      return AdminApiClient.get<T>(`${endpoint}${query ? `?${query}` : ''}`)
    }
    return AdminApiClient.get<T>(endpoint)
  },
  post: <T>(endpoint: string, data?: unknown) => AdminApiClient.post<T>(endpoint, data),
  put: <T>(endpoint: string, data?: unknown) => AdminApiClient.put<T>(endpoint, data),
  delete: <T>(endpoint: string) => AdminApiClient.delete<T>(endpoint),

  getMessages: (params?: Record<string, string | number | boolean>) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return AdminApiClient.get(`/messages/${query ? `?${query}` : ''}`)
  },
  deleteMessage: (id: string) => AdminApiClient.delete(`/messages/${id}`),
  hardDeleteMessage: (id: string) => AdminApiClient.delete(`/messages/${id}/hard`),
  
  articles: {
    list: (params?: { skip?: number; limit?: number; published_only?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.published_only !== undefined) {searchParams.set('published_only', params.published_only.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/articles/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/articles/${id}`),
    create: (data: unknown) => AdminApiClient.post('/articles/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/articles/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/articles/${id}`),
  },
  
  categories: {
    list: (params?: { skip?: number; limit?: number; is_active?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.is_active !== undefined) {searchParams.set('is_active', params.is_active.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/categories/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/categories/${id}`),
    create: (data: unknown) => AdminApiClient.post('/categories/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/categories/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/categories/${id}`),
  },
  
  tags: {
    list: (params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/tags/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/tags/${id}`),
    create: (data: unknown) => AdminApiClient.post('/tags/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/tags/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/tags/${id}`),
  },
  
  comments: {
    list: (params?: { skip?: number; limit?: number; approved?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.approved !== undefined) {searchParams.set('approved', params.approved.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/comments/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/comments/${id}`),
    approve: (id: string) => AdminApiClient.put(`/comments/${id}/approve`, {}),
    reject: (id: string) => AdminApiClient.post(`/comments/${id}/reject`, {}),
    delete: (id: string) => AdminApiClient.delete(`/comments/${id}`),
  },
  
  friendLinks: {
    list: () => AdminApiClient.get('/friend-links/'),
    get: (id: string) => AdminApiClient.get(`/friend-links/${id}`),
    create: (data: unknown) => AdminApiClient.post('/friend-links/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/friend-links/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/friend-links/${id}`),
    toggleStatus: (id: string, isActive: boolean) => AdminApiClient.put(`/friend-links/${id}`, { is_active: isActive }),
  },
  
  images: {
    list: (params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
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
        if (!res.ok) {throw new Error('Upload failed');}
        return res.json();
      }),
    delete: (id: string) => AdminApiClient.delete(`/images/${id}`),
  },
  
  users: {
    list: (params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/users/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/users/${id}`),
    create: (data: unknown) => AdminApiClient.post('/users/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/users/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/users/${id}`),
    toggleStatus: (id: string, isActive: boolean) => AdminApiClient.put(`/users/${id}`, { is_active: isActive }),
  },
  
  subscriptions: {
    list: (params?: { skip?: number; limit?: number; is_active?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.is_active !== undefined) {searchParams.set('is_active', params.is_active.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/subscriptions/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/subscriptions/${id}`),
    create: (data: unknown) => AdminApiClient.post('/subscriptions/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/subscriptions/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/subscriptions/${id}`),
    count: () => AdminApiClient.get('/subscriptions/count'),
    unsubscribe: (email: string) => AdminApiClient.post(`/subscriptions/unsubscribe?email=${encodeURIComponent(email)}`, {}),
  },
  
  auditLogs: {
    list: (params?: { skip?: number; limit?: number; user_id?: string; action?: string; resource_type?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.user_id) {searchParams.set('user_id', params.user_id);}
      if (params?.action) {searchParams.set('action', params.action);}
      if (params?.resource_type) {searchParams.set('resource_type', params.resource_type);}
      const query = searchParams.toString();
      return AdminApiClient.get(`/audit-logs/${query ? `?${query}` : ''}`);
    },
    byUser: (userId: string, params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/audit-logs/user/${userId}${query ? `?${query}` : ''}`);
    },
    byAction: (action: string, params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/audit-logs/action/${action}${query ? `?${query}` : ''}`);
    },
  },
  
  portfolio: {
    list: (params?: { skip?: number; limit?: number; is_active?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.is_active !== undefined) {searchParams.set('is_active', params.is_active.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/portfolio/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/portfolio/${id}`),
    create: (data: unknown) => AdminApiClient.post('/portfolio/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/portfolio/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/portfolio/${id}`),
    getImages: (id: string) => AdminApiClient.get(`/portfolio/${id}/images`),
    addImage: (portfolioId: string, imageId: string, sortOrder?: number, isCover?: boolean) => 
      AdminApiClient.post(`/portfolio/${portfolioId}/images/${imageId}?sort_order=${sortOrder || 0}&is_cover=${isCover || false}`, {}),
    removeImage: (portfolioId: string, imageId: string) => 
      AdminApiClient.delete(`/portfolio/${portfolioId}/images/${imageId}`),
  },
  
  timeline: {
    list: (params?: { skip?: number; limit?: number; is_active?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.is_active !== undefined) {searchParams.set('is_active', params.is_active.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/timeline-events/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/timeline-events/${id}`),
    create: (data: unknown) => AdminApiClient.post('/timeline-events/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/timeline-events/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/timeline-events/${id}`),
  },
  
  messages: {
    list: (params?: { skip?: number; limit?: number; danmaku_only?: boolean; author_id?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.danmaku_only !== undefined) {searchParams.set('danmaku_only', params.danmaku_only.toString());}
      if (params?.author_id) {searchParams.set('author_id', params.author_id);}
      const query = searchParams.toString();
      return AdminApiClient.get(`/messages/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/messages/${id}`),
    create: (data: unknown) => AdminApiClient.post('/messages/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/messages/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/messages/${id}`),
    hardDelete: (id: string) => AdminApiClient.delete(`/messages/${id}/hard`),
    like: (id: string) => AdminApiClient.post(`/messages/${id}/like`, {}),
    unlike: (id: string) => AdminApiClient.post(`/messages/${id}/unlike`, {}),
    trending: (limit?: number) => AdminApiClient.get(`/messages/trending?limit=${limit || 10}`),
    danmaku: (limit?: number) => AdminApiClient.get(`/messages/danmaku?limit=${limit || 50}`),
    activity: (days?: number) => AdminApiClient.get(`/messages/stats/activity?days=${days || 7}`),
  },
  
  monitoring: {
    health: () => AdminApiClient.get('/monitoring/health'),
    metrics: () => AdminApiClient.get('/monitoring/metrics'),
    status: () => AdminApiClient.get('/monitoring/status'),
    logs: (count?: number) => AdminApiClient.get(`/monitoring/logs?count=${count || 10}`),
    analytics: () => AdminApiClient.get('/monitoring/analytics'),
  },
  
  weather: {
    current: (city?: string) => AdminApiClient.get(`/weather/current${city ? `?city=${encodeURIComponent(city)}` : ''}`),
    forecast: (city?: string, days?: number) => AdminApiClient.get(`/weather/forecast${city ? `?city=${encodeURIComponent(city)}&days=${days || 7}` : ''}`),
  },
  
  typewriter: {
    list: (params?: { skip?: number; limit?: number; active_only?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.active_only !== undefined) {searchParams.set('active_only', params.active_only.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/typewriter-contents/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/typewriter-contents/${id}`),
    create: (data: unknown) => AdminApiClient.post('/typewriter-contents/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/typewriter-contents/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/typewriter-contents/${id}`),
    deactivate: (id: string) => AdminApiClient.post(`/typewriter-contents/${id}/deactivate`, {}),
  },
  
  prompts: {
    list: (params?: { skip?: number; limit?: number; category?: string; is_active?: boolean; is_system?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.category) {searchParams.set('category', params.category);}
      if (params?.is_active !== undefined) {searchParams.set('is_active', params.is_active.toString());}
      if (params?.is_system !== undefined) {searchParams.set('is_system', params.is_system.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/prompts/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/prompts/${id}`),
    create: (data: unknown) => AdminApiClient.post('/prompts/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/prompts/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/prompts/${id}`),
    duplicate: (id: string) => AdminApiClient.post(`/prompts/${id}/duplicate`, {}),
    setDefault: (id: string) => AdminApiClient.post(`/prompts/${id}/default`, {}),
    getFolders: () => AdminApiClient.get('/prompts/folders'),
    createFolder: (data: unknown) => AdminApiClient.post('/prompts/folders', data),
    updateFolder: (id: string, data: unknown) => AdminApiClient.put(`/prompts/folders/${id}`, data),
    deleteFolder: (id: string, moveTo?: string) => AdminApiClient.delete(`/prompts/folders/${id}${moveTo ? `?move_to=${moveTo}` : ''}`),
    getStats: () => AdminApiClient.get('/prompts/stats'),
    export: (ids?: string[]) => AdminApiClient.get(`/prompts/export${ids ? `?ids=${ids.join(',')}` : ''}`),
    import: (data: unknown) => AdminApiClient.post('/prompts/import', data),
    optimize: (content: string, maxLength?: number) => AdminApiClient.get(`/prompts/optimize?content=${encodeURIComponent(content)}${maxLength ? `&max_length=${maxLength}` : ''}`),
    getVersions: (name: string) => AdminApiClient.get(`/prompts/${name}/versions`),
  },
  
  conversations: {
    list: (params?: { skip?: number; limit?: number; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.status) {searchParams.set('status', params.status);}
      const query = searchParams.toString();
      return AdminApiClient.get(`/conversations/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/conversations/${id}`),
    create: (data: unknown) => AdminApiClient.post('/conversations/', data),
    update: (id: string, data: unknown) => AdminApiClient.put(`/conversations/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/conversations/${id}`),
    getMessages: (id: string, params?: { skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/conversations/${id}/messages${query ? `?${query}` : ''}`);
    },
    deleteMessages: (id: string) => AdminApiClient.delete(`/conversations/${id}/messages`),
  },
  
  memories: {
    list: (params?: { skip?: number; limit?: number; memory_type?: string; min_importance?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) {searchParams.set('skip', params.skip.toString());}
      if (params?.limit) {searchParams.set('limit', params.limit.toString());}
      if (params?.memory_type) {searchParams.set('memory_type', params.memory_type);}
      if (params?.min_importance !== undefined) {searchParams.set('min_importance', params.min_importance.toString());}
      const query = searchParams.toString();
      return AdminApiClient.get(`/memories/${query ? `?${query}` : ''}`);
    },
    get: (id: string) => AdminApiClient.get(`/memories/${id}`),
    create: (data: unknown) => AdminApiClient.post('/memories/', data),
    batchCreate: (memories: unknown[]) => AdminApiClient.post('/memories/batch', { memories }),
    update: (id: string, data: unknown) => AdminApiClient.put(`/memories/${id}`, data),
    delete: (id: string) => AdminApiClient.delete(`/memories/${id}`),
    search: (query: string, params?: { memory_type?: string; min_importance?: number; top_k?: number }) => 
      AdminApiClient.post('/memories/search', { query, ...params }),
    getStats: () => AdminApiClient.get('/memories/stats/summary'),
    cleanup: () => AdminApiClient.post('/memories/cleanup', {}),
  },
};
