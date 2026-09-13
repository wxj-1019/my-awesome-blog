import { apiFetch, extractApiErrorMessage } from '@/lib/api-client';

/**
 * AI 能力相关 API（编辑器辅助：摘要生成等）。
 * 与后端契约冻结：POST /api/v1/ai/article-summary。
 */

/** AI 生成文章摘要请求体（与后端 /ai/article-summary 契约对齐） */
export interface ArticleSummaryInput {
  /** 文章标题（可为空字符串，后端按正文为主生成） */
  title: string;
  /** 文章正文 */
  content: string;
  /** 摘要最大长度（可选，由后端裁剪） */
  max_length?: number;
}

/**
 * 调用 AI 生成文章摘要。
 * 需登录：apiFetch 自动附带 Bearer token（localStorage auth_token）。
 * 失败（含后端未上线期间的 404）抛 Error，错误文案取后端 error.message，
 * 由调用方 toast 展示。
 */
export async function generateArticleSummary(
  input: ArticleSummaryInput
): Promise<{ summary: string }> {
  const response = await apiFetch('/ai/article-summary', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);
    throw new Error(extractApiErrorMessage(errorData, `请求失败: ${response.status}`));
  }
  const data = (await response.json()) as { summary?: unknown };
  // 防御：summary 字段缺失或非字符串时返回空串，由调用方提示重试
  return { summary: typeof data.summary === 'string' ? data.summary : '' };
}
