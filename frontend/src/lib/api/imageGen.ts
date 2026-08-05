/**
 * 图片生成（火山方舟文生图）客户端。
 * key 只存后端，本模块只调后端代理端点 /image-gen/generate。
 */

import { apiFetch } from '@/lib/api-client';

export interface ImageGenRequest {
  prompt: string;
  size?: string;
  count?: number;
}

export interface GeneratedImage {
  url: string;
  size: string;
}

export interface ImageGenResponse {
  images: GeneratedImage[];
  model: string;
}

/** 携带 HTTP 状态码的生成错误，便于调用方区分登录态失效（401/403）等场景 */
export class ImageGenError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ImageGenError';
    this.status = status;
  }
}

/** 文生图：后端代理调用火山方舟，返回图片 URL 列表（公开，限流保护） */
export const generateImages = async (
  request: ImageGenRequest,
  signal?: AbortSignal
): Promise<ImageGenResponse> => {
  const response = await apiFetch(`/image-gen/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok) {
    // 项目后端统一错误体：{"error": {"message": ...}}；兼容旧 detail 格式
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData?.error?.message ?? errorData.detail ?? `请求失败: ${response.status}`;
    throw new ImageGenError(message, response.status);
  }
  const data = await response.json();
  // 响应形状校验：images 必须为非空 URL 数组（malformed 归入 error）
  if (
    !data ||
    !Array.isArray(data.images) ||
    data.images.length === 0 ||
    data.images.some((img: unknown) => !img || typeof (img as { url?: unknown }).url !== 'string')
  ) {
    throw new ImageGenError('生成服务返回异常结果，请重试', 200);
  }
  return data as ImageGenResponse;
};
