import { apiFetch } from '@/lib/api-client';
import type { BackendArticleWithAuthor } from '@/types';

/** 单次搜索返回的最大结果数（后端上限 100，弹窗场景 20 足够） */
export const SEARCH_RESULTS_LIMIT = 20;

/**
 * 调用后端 jieba 全文搜索（PG tsvector，开发 SQLite 下有方言降级）。
 * 仅返回已发布文章；调用方负责通过 signal 取消过期请求。
 */
export async function searchArticlesFulltext(
  query: string,
  signal?: AbortSignal
): Promise<BackendArticleWithAuthor[]> {
  const params = new URLSearchParams({
    search_query: query,
    limit: String(SEARCH_RESULTS_LIMIT),
    published_only: 'true',
  });
  const response = await apiFetch(`/articles/search-fulltext?${params.toString()}`, {
    signal,
  });
  if (!response.ok) {
    // 后端 422 等场景会带 detail 校验原因；响应体非 JSON 时兜底为空对象
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `全文搜索失败：HTTP ${response.status}`);
  }
  return response.json();
}
