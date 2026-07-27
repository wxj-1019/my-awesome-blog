import { apiRequest, API_BASE_URL, TOKEN_KEY } from '@/lib/api-client';
import logger from '@/utils/logger';
import type { Article, Category, Tag, RelatedArticle } from '@/types';

/** 后端列表接口单次最大条数（与 API le=100 对齐） */
export const ARTICLES_PAGE_SIZE = 100;

/** 后端 offset/limit 列表接口的统一分页信封（对应 backend/app/schemas/pagination.py） */
export interface Page<T> {
  items: T[];
  /** 符合过滤条件的总条数，非当前页条数 */
  total: number;
  skip: number;
  limit: number;
}

/**
 * 获取文章列表（带总数）。
 *
 * 后端 GET /articles/ 已改为返回分页信封；需要 total 时用本函数，
 * 只关心数据数组时用 getArticles()。
 */
export const getArticlesPage = async (filters?: {
  category?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
  skip?: number;
}): Promise<Page<Article>> => {
  const params = new URLSearchParams();
  if (filters?.category) {params.append('category_id', filters.category);}
  if (filters?.tag) {params.append('tag_id', filters.tag);}
  if (filters?.search) {params.append('search', filters.search);}
  if (filters?.limit !== undefined) {
    // 单页不得超过后端上限，避免 422
    params.append('limit', String(Math.min(Math.max(filters.limit, 1), ARTICLES_PAGE_SIZE)));
  }
  const skip = filters?.skip ?? filters?.offset;
  if (skip !== undefined) {params.append('skip', String(Math.max(skip, 0)));}

  const queryString = params.toString();
  // FastAPI 路由为 /articles/，无尾斜杠会 307
  const endpoint = queryString ? `/articles/?${queryString}` : '/articles/';

  return apiRequest(endpoint);
};

/**
 * 获取文章列表（只要数组）。
 *
 * 保留此签名以免波及大量只关心数据的调用点；内部走 getArticlesPage 后取 items。
 */
export const getArticles = async (filters?: Parameters<typeof getArticlesPage>[0]): Promise<Article[]> => {
  const page = await getArticlesPage(filters);
  return page.items;
};

/**
 * 分页拉取文章，直到凑满 maxItems 或没有更多数据。
 * 用于 sitemap / RSS 等需要批量读取、但后端限制单页 ≤100 的场景。
 */
export const getArticlesPaginated = async (options?: {
  maxItems?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  search?: string;
}): Promise<Article[]> => {
  const pageSize = Math.min(
    Math.max(options?.pageSize ?? ARTICLES_PAGE_SIZE, 1),
    ARTICLES_PAGE_SIZE
  );
  const maxItems = options?.maxItems ?? Number.POSITIVE_INFINITY;
  const collected: Article[] = [];
  let skip = 0;

  while (collected.length < maxItems) {
    const limit = Math.min(pageSize, maxItems - collected.length);
    let batch: Article[] = [];
    try {
      batch = await getArticles({
        limit,
        skip,
        category: options?.category,
        tag: options?.tag,
        search: options?.search,
      });
    } catch (error) {
      logger.error('分页获取文章失败:', error);
      break;
    }

    if (!batch.length) {
      break;
    }

    collected.push(...batch);

    // 本页不足 limit，说明已到末尾
    if (batch.length < limit) {
      break;
    }

    skip += batch.length;
  }

  return collected;
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
export const getPopularArticles = async (params?: number | { limit?: number }): Promise<Article[]> => {
  try {
    const limit = typeof params === 'number' ? params : params?.limit;
    return await apiRequest(`/articles/popular?limit=${limit ?? 10}`);
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
    if (filters?.category_slug) {params.append('category_slug', filters.category_slug);}
    if (filters?.tag_slug) {params.append('tag_slug', filters.tag_slug);}

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
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  if (!token) {
    throw new Error('需要登录才能上传图片');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (options?.title) {formData.append('title', options.title);}
  if (options?.description) {formData.append('description', options.description);}
  if (options?.alt_text) {formData.append('alt_text', options.alt_text);}
  if (options?.is_featured !== undefined) {formData.append('is_featured', String(options.is_featured));}

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
    body: data,
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
