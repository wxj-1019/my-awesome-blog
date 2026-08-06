/**
 * 图片/视频生成（RunningHub 异步工作流）客户端。
 * key 只存后端，本模块只调后端代理端点：
 * - POST /image-gen/tasks/image  |  POST /image-gen/tasks/video（创建任务）
 * - GET  /image-gen/tasks/{task_id}（查询状态，前端轮询）
 */

import { apiFetch } from '@/lib/api-client';

/** 生成类型：图片 / 视频 */
export type GenType = 'image' | 'video';

/** 任务状态（RunningHub：pending → running → success | fail） */
export type TaskStatus = 'pending' | 'running' | 'success' | 'fail';

export interface CreateGenTaskRequest {
  type: GenType;
  prompt: string;
  /** 工作流额外输入（如负面词、尺寸、参考图），键名依工作流而定 */
  workflowInputs?: Record<string, string>;
}

export interface CreateGenTaskResponse {
  task_id: string;
}

export interface GenTaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  images: string[];
  video_url: string | null;
  fail_reason: string | null;
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

/** 解析后端错误体（项目统一 {"error": {"message": ...}}；兼容 detail） */
const parseError = async (response: Response): Promise<ImageGenError> => {
  const errorData = await response.json().catch(() => ({}));
  const message =
    errorData?.error?.message ?? errorData.detail ?? `请求失败: ${response.status}`;
  return new ImageGenError(message, response.status);
};

/** 创建 RunningHub 生成任务，返回 task_id 供轮询（type 决定走图片/视频端点） */
export const createGenTask = async (
  request: CreateGenTaskRequest
): Promise<CreateGenTaskResponse> => {
  const response = await apiFetch(`/image-gen/tasks/${request.type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  const data = await response.json();
  if (!data || typeof data.task_id !== 'string' || !data.task_id) {
    throw new ImageGenError('生成服务返回异常结果，请重试', 200);
  }
  return data as CreateGenTaskResponse;
};

/** 查询生成任务状态与结果（轮询用，轻量请求） */
export const getGenTaskStatus = async (
  taskId: string
): Promise<GenTaskStatusResponse> => {
  const response = await apiFetch(`/image-gen/tasks/${taskId}`, { method: 'GET' });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as GenTaskStatusResponse;
};
