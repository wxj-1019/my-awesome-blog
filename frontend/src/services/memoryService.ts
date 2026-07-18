import { apiRequest } from '@/lib/api';
import type {
  Memory,
  MemoryCreate,
  MemoryUpdate,
  MemorySearchResult,
  MemorySearchRequest,
  PaginatedResponse,
} from '@/types';

const API_BASE = '/memories';

export const memoryService = {
  async getMemories(params?: {
    skip?: number;
    limit?: number;
    tenant_id?: string;
    user_id?: string;
    memory_type?: 'short_term' | 'long_term';
  }): Promise<PaginatedResponse<Memory>> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
    if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
    if (params?.tenant_id) {queryParams.append('tenant_id', params.tenant_id);}
    if (params?.user_id) {queryParams.append('user_id', params.user_id);}
    if (params?.memory_type) {queryParams.append('memory_type', params.memory_type);}

    const url = queryParams.toString() ? `${API_BASE}/?${queryParams}` : API_BASE;
    return apiRequest<PaginatedResponse<Memory>>(url);
  },

  async getMemory(id: string): Promise<Memory> {
    return apiRequest<Memory>(`${API_BASE}/${id}`);
  },

  async createMemory(data: MemoryCreate): Promise<Memory> {
    return apiRequest<Memory>(API_BASE, {
      method: 'POST',
      body: data,
    });
  },

  async updateMemory(id: string, data: MemoryUpdate): Promise<Memory> {
    return apiRequest<Memory>(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  async deleteMemory(id: string): Promise<void> {
    return apiRequest<void>(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  async searchMemories(request: MemorySearchRequest): Promise<MemorySearchResult[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('query', request.query);
    if (request.limit !== undefined) {queryParams.append('limit', request.limit.toString());}
    if (request.threshold !== undefined) {queryParams.append('threshold', request.threshold.toString());}
    if (request.memory_type && request.memory_type !== 'all') {queryParams.append('memory_type', request.memory_type);}

    return apiRequest<MemorySearchResult[]>(`${API_BASE}/search?${queryParams}`);
  },

  async batchCreateMemories(memories: MemoryCreate[]): Promise<Memory[]> {
    return apiRequest<Memory[]>(`${API_BASE}/batch`, {
      method: 'POST',
      body: { memories },
    });
  },

  async clearExpiredMemories(): Promise<{ deleted_count: number }> {
    return apiRequest<{ deleted_count: number }>(`${API_BASE}/clear-expired`, {
      method: 'DELETE',
    });
  },
};
