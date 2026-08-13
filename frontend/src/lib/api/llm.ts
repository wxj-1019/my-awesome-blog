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
            // 后端 SSE 错误块：{"error": true, "message": "..."}（如 LLM 未配置/限流等）
            if (json.error) {
              onError(new Error(json.message || 'AI 解读服务出错，请稍后重试'));
              return;
            }
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
    // 流自然结束（未收到 [DONE]）：视作正常完成，避免状态卡在「解读中…」
    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
};