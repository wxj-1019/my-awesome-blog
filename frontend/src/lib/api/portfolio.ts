import { apiFetch } from '@/lib/api-client';
export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  project_url?: string;
  github_url?: string;
  category?: string;
  tags?: string[];
  is_featured: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
}

export interface PortfolioItemCreate {
  title: string;
  description: string;
  image_url?: string;
  project_url?: string;
  github_url?: string;
  category?: string;
  tags?: string[];
  is_featured?: boolean;
  sort_order?: number;
}

export interface PortfolioItemUpdate {
  title?: string;
  description?: string;
  image_url?: string;
  project_url?: string;
  github_url?: string;
  category?: string;
  tags?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export const getPortfolioItems = async (params?: {
  skip?: number;
  limit?: number;
  is_active?: boolean;
}): Promise<PortfolioItem[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
  if (params?.is_active !== undefined) {queryParams.append('is_active', params.is_active.toString());}

  const response = await apiFetch(`/portfolio/?${queryParams.toString()}`, {
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

export const getPortfolioItemById = async (id: string): Promise<PortfolioItem> => {
  const response = await apiFetch(`/portfolio/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('作品集项目不存在');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const createPortfolioItem = async (portfolioItem: PortfolioItemCreate): Promise<PortfolioItem> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/portfolio/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(portfolioItem),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const updatePortfolioItem = async (id: string, portfolioItem: PortfolioItemUpdate): Promise<PortfolioItem> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/portfolio/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(portfolioItem),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const deletePortfolioItem = async (id: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/portfolio/${id}`, {
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
