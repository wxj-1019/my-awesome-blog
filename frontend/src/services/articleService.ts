import { API_BASE_URL } from '@/config/api';
import logger from '@/utils/logger';
import type { Article, Category, Tag, RelatedArticle } from '@/types';

// 通用请求函数
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `请求失败: ${response.status}`);
  }

  return response.json();
};

// 获取文章列表
export const getArticles = async (filters?: {
  category?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Article[]> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category_id', filters.category);
  if (filters?.tag) params.append('tag_id', filters.tag);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const queryString = params.toString();
  const endpoint = `/articles/${queryString ? `?${queryString}` : ''}`;

  return apiRequest(endpoint);
};

// 根据ID获取文章详情
export const getArticleById = async (id: string): Promise<Article | null> => {
  try {
    return await apiRequest(`/articles/${id}`);
  } catch (error) {
    logger.error(`获取文章 ${id} 失败:`, error);
    return null;
  }
};

// 根据Slug获取文章详情
export const getArticleBySlug = async (slug: string): Promise<Article | null> => {
  try {
    return await apiRequest(`/articles/slug/${slug}`);
  } catch (error) {
    logger.error(`获取文章 ${slug} 失败:`, error);
    return null;
  }
};

// 获取相关文章
export const getRelatedArticles = async (articleId: string): Promise<RelatedArticle[]> => {
  try {
    return await apiRequest(`/articles/related/${articleId}`);
  } catch (error) {
    logger.error('获取相关文章失败:', error);
    return [];
  }
};

// 获取分类列表
export const getCategories = async (): Promise<Category[]> => {
  try {
    return await apiRequest('/categories/');
  } catch (error) {
    logger.error('获取分类列表失败:', error);
    return [];
  }
};

// 获取标签列表
export const getTags = async (): Promise<Tag[]> => {
  try {
    return await apiRequest('/tags/');
  } catch (error) {
    logger.error('获取标签列表失败:', error);
    return [];
  }
};

// 获取精选文章
export const getFeaturedArticles = async (limit: number = 5): Promise<Article[]> => {
  try {
    return await apiRequest(`/articles/featured?limit=${limit}`);
  } catch (error) {
    logger.error('获取精选文章失败:', error);
    return [];
  }
};

// 获取热门文章
export const getPopularArticles = async (limit: number = 10): Promise<Article[]> => {
  try {
    return await apiRequest(`/articles/popular?limit=${limit}`);
  } catch (error) {
    logger.error('获取热门文章失败:', error);
    return [];
  }
};

// 搜索文章
export const searchArticles = async (query: string, filters?: {
  category_slug?: string;
  tag_slug?: string;
}): Promise<Article[]> => {
  try {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters?.category_slug) params.append('category_slug', filters.category_slug);
    if (filters?.tag_slug) params.append('tag_slug', filters.tag_slug);

    return await apiRequest(`/articles/search?${params.toString()}`);
  } catch (error) {
    logger.error('搜索文章失败:', error);
    return [];
  }
};

// 上传图片
export const uploadImage = async (file: File, options?: {
  title?: string;
  description?: string;
  alt_text?: string;
  is_featured?: boolean;
}): Promise<string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  if (!token) {
    throw new Error('需要登录才能上传图片');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (options?.title) formData.append('title', options.title);
  if (options?.description) formData.append('description', options.description);
  if (options?.alt_text) formData.append('alt_text', options.alt_text);
  if (options?.is_featured !== undefined) formData.append('is_featured', String(options.is_featured));

  const response = await fetch(`${API_BASE_URL}/images/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || '上传图片失败');
  }

  const data = await response.json();
  return data.file_path || data.url;
};

// 更新文章
export const updateArticle = async (id: string, data: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at' | 'author_id' | 'author'>>): Promise<Article> => {
  return apiRequest(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// 设置文章封面（便捷方法）
export const setArticleCover = async (articleId: string, file: File, options?: {
  title?: string;
  description?: string;
  alt_text?: string;
}): Promise<Article> => {
  const imageUrl = await uploadImage(file, {
    ...options,
    is_featured: true,
  });

  return updateArticle(articleId, { cover_image: imageUrl });
};
