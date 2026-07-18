import { apiRequest } from '@/lib/api';
import type {
  Tenant,
  TenantCreate,
  TenantUpdate,
  TenantUsageStats,
  TenantConfig,
  TenantLimits,
  PaginatedResponse,
} from '@/types';

const API_BASE = '/tenants';

export const tenantService = {
  async getTenants(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<Tenant>> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
    if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
    if (params?.search) {queryParams.append('search', params.search);}
    if (params?.status) {queryParams.append('status', params.status);}

    const url = queryParams.toString() ? `${API_BASE}/?${queryParams}` : API_BASE;
    return apiRequest<PaginatedResponse<Tenant>>(url);
  },

  async getTenant(id: string): Promise<Tenant> {
    return apiRequest<Tenant>(`${API_BASE}/${id}`);
  },

  async getTenantByCode(code: string): Promise<Tenant> {
    return apiRequest<Tenant>(`${API_BASE}/code/${code}`);
  },

  async createTenant(data: TenantCreate): Promise<Tenant> {
    return apiRequest<Tenant>(API_BASE, {
      method: 'POST',
      body: data,
    });
  },

  async updateTenant(id: string, data: TenantUpdate): Promise<Tenant> {
    return apiRequest<Tenant>(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  async deleteTenant(id: string): Promise<void> {
    return apiRequest<void>(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  async getTenantUsage(id: string): Promise<TenantUsageStats> {
    return apiRequest<TenantUsageStats>(`${API_BASE}/${id}/usage`);
  },

  async getTenantConfig(id: string): Promise<TenantConfig> {
    return apiRequest<TenantConfig>(`${API_BASE}/${id}/config`);
  },

  async checkTenantLimits(id: string): Promise<TenantLimits> {
    return apiRequest<TenantLimits>(`${API_BASE}/${id}/limits`);
  },
};
