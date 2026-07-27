import { getAuthHeaders } from '@/lib/auth-utils';
import { API_BASE_URL } from '@/lib/api-client';

/** Agent SSE 流的载荷（generate-stream / revise-stream 共用） */
interface AgentStreamHandlers {
  onTool?: (info: { tool?: string; arguments?: unknown }) => void;
  onChunk?: (delta: string) => void;
  onComplete?: (full: string) => void;
  onError?: (message: string) => void;
}

/**
 * 消费 /agent/generate-stream、/agent/revise-stream 的 SSE 响应。
 *
 * 事件形态：
 *   data: {"content": "..."}    正文增量
 *   data: {"tool": "search_articles", "arguments": {...}}  工具调用（仅生成）
 *   data: {"error": true, "message": "..."}  错误（格式对齐 llm_service）
 *   data: [DONE]                结束
 *
 * 复用 llmService.chatStream 的 getReader + TextDecoder + 行缓冲模式。
 */
async function consumeAgentSse(
  response: Response,
  handlers: AgentStreamHandlers
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('响应流不可读');
  }
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  /** 把缓冲区里完整的行解析掉，未结尾的残行留在 buffer 里返回 */
  const drainBuffer = (): boolean => {
    // 没有换行 = 还没有完整行，留着等下一个 chunk
    if (!buffer.includes('\n')) {return true;}
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) {continue;}
      const data = line.slice(6).trim();
      if (data === '[DONE]') {return false;}
      try {
        const payload = JSON.parse(data) as Record<string, unknown>;
        if (typeof payload.content === 'string' && payload.content) {
          full += payload.content;
          handlers.onChunk?.(payload.content);
        } else if (payload.tool !== undefined) {
          handlers.onTool?.({
            tool: typeof payload.tool === 'string' ? payload.tool : undefined,
            arguments: payload.arguments,
          });
        } else if (payload.error === true) {
          // 错误事件格式与 llm_service 对齐：{error: true, message}
          handlers.onError?.(typeof payload.message === 'string' ? payload.message : '未知错误');
          return false;
        }
      } catch {
        // 单行解析失败不中断整条流
      }
    }
    return true;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      // flush 解码器残留字节（末尾多字节字符被截断时），再处理残行
      buffer += decoder.decode();
      drainBuffer();
      handlers.onComplete?.(full);
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const cont = drainBuffer();
    if (!cont) {
      handlers.onComplete?.(full);
      return;
    }
  }
}

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
    /** 返回分页信封 { items, total, skip, limit }；total 为符合条件的总条数 */
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

  // ── AI 导向写作（生成 / 改稿 / 元信息）──────────────────────────
  // generate-stream / revise-stream 走 SSE 流式；meta 走普通 POST。
  // SSE 消费复用 llmService.chatStream 的 getReader + TextDecoder 模式。
  agent: {
    /**
     * 按主题流式生成文章。
     * @returns 一个 cancel 函数，调用即中止本次流（组件卸载/用户取消时用）
     */
    generateStream(
      body: { topic: string; requirements?: string; context_mode?: 'auto' | 'none' },
      handlers: {
        onTool?: (info: { tool?: string; arguments?: unknown }) => void;
        onChunk?: (delta: string) => void;
        onComplete?: (full: string) => void;
        onError?: (message: string) => void;
      }
    ): () => void {
      const controller = new AbortController();
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      // 不 await：流式调用方需要立即拿到 cancel 句柄
      void (async () => {
        try {
          const resp = await fetch(`${API_BASE_URL}/agent/generate-stream`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
          });
          if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            throw new Error(`HTTP ${resp.status}${txt ? `: ${txt}` : ''}`);
          }
          await consumeAgentSse(resp, handlers);
        } catch (err) {
          if ((err as Error).name === 'AbortError') {return;}
          handlers.onError?.(err instanceof Error ? err.message : String(err));
        }
      })();
      return () => controller.abort();
    },

    /**
     * 流式改稿：当前正文 + 自然语言指令 → 流式输出改后正文。
     * @returns cancel 函数
     */
    reviseStream(
      body: { content: string; instruction: string },
      handlers: {
        onChunk?: (delta: string) => void;
        onComplete?: (full: string) => void;
        onError?: (message: string) => void;
      }
    ): () => void {
      const controller = new AbortController();
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      void (async () => {
        try {
          const resp = await fetch(`${API_BASE_URL}/agent/revise-stream`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
          });
          if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            throw new Error(`HTTP ${resp.status}${txt ? `: ${txt}` : ''}`);
          }
          await consumeAgentSse(resp, handlers);
        } catch (err) {
          if ((err as Error).name === 'AbortError') {return;}
          handlers.onError?.(err instanceof Error ? err.message : String(err));
        }
      })();
      return () => controller.abort();
    },

    /** 根据正文反推标题 / slug / 摘要（非流式） */
    generateMeta(content: string): Promise<{ title: string; slug: string; excerpt: string }> {
      return AdminApiClient.post('/agent/meta', { content });
    },

    /**
     * 封面配图搜索：AI 生成英文搜索词（query 为空时）→ 后端代理调 Unsplash → 返回候选图。
     * @param content 文章正文
     * @param query   手动指定搜索词；留空则由 AI 从正文生成
     */
    suggestCover(
      content: string,
      query?: string
    ): Promise<{
      query: string;
      images: Array<{
        url: string;
        thumb_url: string;
        alt: string;
        author_name: string;
        author_url: string;
      }>;
    }> {
      return AdminApiClient.post('/agent/cover', { content, query });
    },
  },
};
