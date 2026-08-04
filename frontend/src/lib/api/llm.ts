import { apiFetch } from '@/lib/api-client';
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export interface LLMChatRequest {
  /** 单条消息（与 messages 二选一，后端同时支持） */
  message?: string;
  /** 消息列表 */
  messages?: LLMMessage[];
  /** 关联对话 ID（后端按需取历史） */
  conversation_id?: string;
  provider?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}
/** SSE 单个数据块（与后端 /llm/chat/stream 的 data 行对齐） */
export interface LLMStreamChunk {
  content: string;
  finish_reason: string | null;
}
export interface LLMChatResponse {
  message: {
    role: string;
    content: string;
  };
  model: string;
  provider: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
export interface LLMModelInfo {
  provider: string;
  name: string;
  display_name: string;
  is_available: boolean;
}
export interface LLMModelsResponse {
  models: LLMModelInfo[];
  default_provider: string;
}
export const chat = async (
  request: LLMChatRequest
): Promise<LLMChatResponse> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const response = await apiFetch(`/llm/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }
  return response.json();
};
export const getModels = async (): Promise<LLMModelsResponse> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const response = await apiFetch(`/llm/models`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }
  return response.json();
};
export const streamChat = async (
  request: LLMChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): Promise<void> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  try {
    const response = await apiFetch(`/llm/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(request),
      ...(signal ? { signal } : {}),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `请求失败: ${response.status} (Unauthorized)`
      );
    }
    const reader = response.body?.getReader();
    if (!reader) {return;}
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {break;}
      const lines = decoder.decode(value, { stream: true }).split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          try {
            const json = JSON.parse(data);
            if (json.content) {
              onChunk(json.content);
            }
            if (json.finish_reason) {
              onComplete();
              return;
            }
          } catch {
            // Ignore JSON parse errors for partial chunks
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * 流式聊天（原始 chunk 对象版）：回调接收完整 LLMStreamChunk，
 * onComplete 接收累积全文。与原 llmService.chatStream 签名兼容，
 * 供需要 finish_reason 等元数据的调用方使用（如 ai/chat 页）。
 */
export const streamChatRaw = async (
  request: LLMChatRequest,
  onChunk: (chunk: LLMStreamChunk) => void,
  onComplete: (fullContent: string) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): Promise<void> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  try {
    const response = await apiFetch(`/llm/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(request),
      ...(signal ? { signal } : {}),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `请求失败: ${response.status} (Unauthorized)`
      );
    }
    const reader = response.body?.getReader();
    if (!reader) {return;}
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onComplete(fullContent);
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            onComplete(fullContent);
            return;
          }
          try {
            const chunk: LLMStreamChunk = JSON.parse(data);
            if (chunk.content) {
              fullContent += chunk.content;
              onChunk(chunk);
            }
            if (chunk.finish_reason) {
              onComplete(fullContent);
              return;
            }
          } catch {
            // 跨 chunk 的半行，下一轮再解析
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
};