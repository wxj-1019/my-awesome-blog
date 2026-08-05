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

/** 文生图：后端代理调用火山方舟，返回图片 URL 列表（需登录） */
export const generateImages = async (
  request: ImageGenRequest
): Promise<ImageGenResponse> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const response = await apiFetch(`/image-gen/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    // 项目后端统一错误体：{"error": {"message": ...}}；兼容旧 detail 格式
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message ?? errorData.detail ?? `请求失败: ${response.status}`;
    throw new Error(message);
  }
  return response.json();
};
