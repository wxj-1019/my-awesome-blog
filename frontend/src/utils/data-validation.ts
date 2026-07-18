/**
 * 统一的数据验证和处理工具函数
 * 用于处理API响应数据，确保类型安全和错误处理
 */

/**
 * 验证并提取数组数据
 * @param data API响应数据
 * @param fallback 默认返回的空数组
 * @returns 确保返回数组类型的数据
 */
export function validateArrayData<T>(data: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.items)) {
      return record.items as T[];
    }
    if (Array.isArray(record.data)) {
      return record.data as T[];
    }
  }

  console.warn('Invalid array data received:', data);
  return fallback;
}

/**
 * 验证并提取分页数据
 * @param data API响应数据
 * @returns 包含items数组和total计数的对象
 */
export function validatePaginatedData<T>(data: unknown): { items: T[]; total: number } {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const items = validateArrayData<T>(record.items || record.data || data);
  const total = typeof record.total === 'number' ? record.total : items.length;

  return { items, total };
}

/**
 * 验证单个对象数据
 * @param data API响应数据
 * @param fallback 默认返回的对象
 * @returns 确保返回对象类型的数据
 */
export function validateObjectData<T>(data: unknown, fallback: T | null = null): T | null {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as T;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (record.data && typeof record.data === 'object') {
      return record.data as T;
    }
  }

  console.warn('Invalid object data received:', data);
  return fallback;
}

/**
 * 安全地获取数据总数
 * @param data API响应数据
 * @returns 数据总数
 */
export function getTotalCount(data: unknown): number {
  if (Array.isArray(data)) {
    return data.length;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.total === 'number') {
      return record.total;
    }

    const items = record.items || record.data;
    if (Array.isArray(items)) {
      return items.length;
    }
  }

  return 0;
}

/**
 * 统一的API错误处理
 * @param error 错误对象
 * @param context 错误上下文信息
 * @returns 格式化的错误信息
 */
export function handleApiError(error: unknown, context: string = 'API调用'): string {
  console.error(`${context}失败:`, error);

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error && typeof (error as Record<string, unknown>).message === 'string') {
    return (error as Record<string, unknown>).message as string;
  }

  return `${context}失败，请稍后重试`;
}

/**
 * 检查API响应是否成功
 * @param response API响应对象
 * @returns 是否成功
 */
export function isApiResponseSuccessful(response: Response): boolean {
  return response.ok && response.status >= 200 && response.status < 300;
}