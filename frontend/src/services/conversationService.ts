import { apiRequest } from '@/lib/api';
import type {
  Conversation,
  ConversationCreate,
  ConversationUpdate,
  ConversationMessage,
  ConversationWithMessages,
  LLMChatRequest,
  LLMChatResponse,
  LLMStreamChunk,
  PaginatedResponse,
} from '@/types';

import { API_BASE_URL, TOKEN_KEY } from '@/lib/api-client';

const API_BASE = '/conversations';

export const conversationService = {
  async getConversations(params?: {
    skip?: number;
    limit?: number;
    tenant_id?: string;
    user_id?: string;
    status?: 'active' | 'archived' | 'deleted';
    search?: string;
  }): Promise<PaginatedResponse<Conversation>> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
    if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
    if (params?.tenant_id) {queryParams.append('tenant_id', params.tenant_id);}
    if (params?.user_id) {queryParams.append('user_id', params.user_id);}
    if (params?.status) {queryParams.append('status', params.status);}
    if (params?.search) {queryParams.append('search', params.search);}

    const url = queryParams.toString() ? `${API_BASE}/?${queryParams}` : API_BASE;
    return apiRequest<PaginatedResponse<Conversation>>(url);
  },

  async getConversation(id: string): Promise<ConversationWithMessages> {
    return apiRequest<ConversationWithMessages>(`${API_BASE}/${id}`);
  },

  async createConversation(data: ConversationCreate): Promise<Conversation> {
    return apiRequest<Conversation>(API_BASE, {
      method: 'POST',
      body: data,
    });
  },

  async updateConversation(id: string, data: ConversationUpdate): Promise<Conversation> {
    return apiRequest<Conversation>(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  async deleteConversation(id: string): Promise<void> {
    return apiRequest<void>(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  async getConversationMessages(id: string, params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<ConversationMessage>> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
    if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}

    const url = queryParams.toString() ? `${API_BASE}/${id}/messages?${queryParams}` : `${API_BASE}/${id}/messages`;
    return apiRequest<PaginatedResponse<ConversationMessage>>(url);
  },

  async sendMessage(id: string, request: LLMChatRequest): Promise<LLMChatResponse> {
    return apiRequest<LLMChatResponse>(`${API_BASE}/${id}/chat`, {
      method: 'POST',
      body: request,
    });
  },

  async sendMessageStream(
    id: string,
    request: LLMChatRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    const url = `${API_BASE_URL}${API_BASE}/${id}/chat/stream`;
    
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete?.();
              return;
            }

            try {
              const chunk: LLMStreamChunk = JSON.parse(data);
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

  async archiveConversation(id: string): Promise<Conversation> {
    return apiRequest<Conversation>(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: { status: 'archived' },
    });
  },

  async restoreConversation(id: string): Promise<Conversation> {
    return apiRequest<Conversation>(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: { status: 'active' },
    });
  },
};
