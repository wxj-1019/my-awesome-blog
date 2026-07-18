import { apiRequest } from '@/lib/api-client';

export interface TypewriterContent {
  id: string;
  text: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface TypewriterContentCreate {
  text: string;
  priority?: number;
  is_active?: boolean;
}

export interface TypewriterContentUpdate {
  text?: string;
  priority?: number;
  is_active?: boolean;
}

export interface TypewriterContentList {
  contents: TypewriterContent[];
  total: number;
}

const API_URL = '/typewriter-contents';

export const typewriterService = {
  async getTypewriterContents(params?: { is_active?: boolean; skip?: number; limit?: number }): Promise<TypewriterContentList> {
    const queryString = new URLSearchParams();
    if (params?.is_active !== undefined) {queryString.append('is_active', params.is_active.toString());}
    if (params?.skip !== undefined) {queryString.append('skip', params.skip.toString());}
    if (params?.limit !== undefined) {queryString.append('limit', params.limit.toString());}

    return apiRequest(`${API_URL}?${queryString.toString()}`);
  },

  async getTypewriterContentById(contentId: string): Promise<TypewriterContent> {
    return apiRequest(`${API_URL}/${contentId}`);
  },

  async createTypewriterContent(contentData: TypewriterContentCreate): Promise<TypewriterContent> {
    return apiRequest(API_URL, {
      method: 'POST',
      body: contentData,
    });
  },

  async updateTypewriterContent(contentId: string, contentData: TypewriterContentUpdate): Promise<TypewriterContent> {
    return apiRequest(`${API_URL}/${contentId}`, {
      method: 'PUT',
      body: contentData,
    });
  },

  async deleteTypewriterContent(contentId: string): Promise<void> {
    return apiRequest(`${API_URL}/${contentId}`, {
      method: 'DELETE',
    });
  },
};
