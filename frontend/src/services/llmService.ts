import { apiRequest } from '@/lib/api';
import { API_BASE_URL, TOKEN_KEY } from '@/lib/api-client';
import type {
  LLMChatRequest,
  LLMChatResponse,
  LLMStreamChunk,
  LLMProviderInfo,
  LLMModel,
} from '@/types';

const API_BASE = '/llm';

export const llmService = {
  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    const response = await apiRequest<LLMChatResponse>(
      `${API_BASE}/chat`,
      {
        method: 'POST',
        body: request,
      }
    );
    return response;
  },

  async chatStream(
    request: LLMChatRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
    onComplete?: (fullContent: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    const url = `${API_BASE_URL}${API_BASE}/chat/stream`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete?.(fullContent);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              onComplete?.(fullContent);
              return;
            }

            try {
              const chunk: LLMStreamChunk = JSON.parse(data);
              fullContent += chunk.content;
              onChunk(chunk);
            } catch (e) {
              console.error('Failed to parse SSE chunk:', data, e);
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      throw error;
    }
  },

  async getProviders(): Promise<LLMProviderInfo[]> {
    return apiRequest<LLMProviderInfo[]>(`${API_BASE}/providers`);
  },

  async getModels(provider: string): Promise<LLMModel[]> {
    return apiRequest<LLMModel[]>(`${API_BASE}/providers/${provider}/models`);
  },

  async validateConfig(provider: string, apiKey?: string): Promise<{ valid: boolean; message?: string }> {
    return apiRequest<{ valid: boolean; message?: string }>(
      `${API_BASE}/validate`,
      {
        method: 'POST',
        body: { provider, api_key: apiKey },
      }
    );
  },
};
