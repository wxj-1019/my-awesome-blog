import { apiFetch } from '@/lib/api-client';
export interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
}

export interface CategoryCreate {
  name: string;
  description?: string;
  sort_order?: number;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface CategoryWithArticleCount extends Category {
  article_count: number;
}

export const getCategories = async (params?: {
  skip?: number;
  limit?: number;
  is_active?: boolean;
}): Promise<CategoryWithArticleCount[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
  if (params?.is_active !== undefined) {queryParams.append('is_active', params.is_active.toString());}

  const response = await apiFetch(`/categories/?${queryParams.toString()}`, {
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

export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await apiFetch(`/categories/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('分类不存在');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const createCategory = async (category: CategoryCreate): Promise<Category> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/categories/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(category),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const updateCategory = async (id: string, category: CategoryUpdate): Promise<Category> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(category),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const deleteCategory = async (id: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/categories/${id}`, {
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
