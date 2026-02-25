import { apiRequest } from '@/lib/api-client';
import type { Prompt, PromptCreate, PromptUpdate, PromptListResponse, PromptVersion } from '@/types';

const API_BASE = '/prompts';

export interface PromptSearchParams {
  skip?: number;
  limit?: number;
  category?: string;
  is_active?: boolean;
  is_system?: boolean;
  search?: string;
  folder_id?: string;
  tags?: string[];
}

export interface PromptFolder {
  id: string;
  name: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface PromptFolderCreate {
  name: string;
  parent_id?: string;
  color?: string;
  icon?: string;
}

export interface PromptWithFolder extends Prompt {
  folder_id?: string;
  folder?: PromptFolder;
  tags?: string[];
  is_default?: boolean;
}

export interface PromptExportData {
  version: string;
  exported_at: string;
  prompts: PromptWithFolder[];
  folders: PromptFolder[];
}

export interface PromptImportResult {
  success: number;
  failed: number;
  errors?: string[];
}

export interface PromptStats {
  total: number;
  by_category: Record<string, number>;
  by_folder: Record<string, number>;
  most_used: Prompt[];
  recently_used: Prompt[];
}

export const promptService = {
  async getPrompts(params: PromptSearchParams = {}): Promise<PromptListResponse> {
    const queryParams = new URLSearchParams();
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.is_system !== undefined) queryParams.append('is_system', params.is_system.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.folder_id) queryParams.append('folder_id', params.folder_id);
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }

    const url = queryParams.toString() ? `${API_BASE}/?${queryParams}` : `${API_BASE}/`;
    return apiRequest<PromptListResponse>(url);
  },

  async getPrompt(id: string): Promise<Prompt> {
    return apiRequest<Prompt>(`${API_BASE}/${id}`);
  },

  async createPrompt(data: PromptCreate & { folder_id?: string; tags?: string[] }): Promise<Prompt> {
    return apiRequest<Prompt>(API_BASE, {
      method: 'POST',
      body: data,
    });
  },

  async updatePrompt(id: string, data: PromptUpdate & { folder_id?: string; tags?: string[] }): Promise<Prompt> {
    return apiRequest<Prompt>(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  async deletePrompt(id: string): Promise<void> {
    return apiRequest<void>(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  async duplicatePrompt(id: string): Promise<Prompt> {
    return apiRequest<Prompt>(`${API_BASE}/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async setDefaultPrompt(id: string): Promise<Prompt> {
    return apiRequest<Prompt>(`${API_BASE}/${id}/default`, {
      method: 'POST',
    });
  },

  async getDefaultPrompt(): Promise<Prompt | null> {
    try {
      return await apiRequest<Prompt>(`${API_BASE}/default`);
    } catch {
      return null;
    }
  },

  async getPromptVersions(name: string): Promise<{ name: string; versions: PromptVersion[] }> {
    return apiRequest<{ name: string; versions: PromptVersion[] }>(`${API_BASE}/${name}/versions`);
  },

  async incrementUsage(id: string): Promise<void> {
    return apiRequest<void>(`${API_BASE}/${id}/usage`, {
      method: 'POST',
    });
  },

  async getPromptStats(): Promise<PromptStats> {
    return apiRequest<PromptStats>(`${API_BASE}/stats`);
  },

  async getFolders(): Promise<PromptFolder[]> {
    return apiRequest<PromptFolder[]>(`${API_BASE}/folders`);
  },

  async createFolder(data: PromptFolderCreate): Promise<PromptFolder> {
    return apiRequest<PromptFolder>(`${API_BASE}/folders`, {
      method: 'POST',
      body: data,
    });
  },

  async updateFolder(id: string, data: Partial<PromptFolderCreate>): Promise<PromptFolder> {
    return apiRequest<PromptFolder>(`${API_BASE}/folders/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  async deleteFolder(id: string, move_to_folder_id?: string): Promise<void> {
    const queryParams = move_to_folder_id ? `?move_to=${move_to_folder_id}` : '';
    return apiRequest<void>(`${API_BASE}/folders/${id}${queryParams}`, {
      method: 'DELETE',
    });
  },

  async exportPrompts(prompt_ids?: string[]): Promise<PromptExportData> {
    const queryParams = prompt_ids && prompt_ids.length > 0
      ? `?ids=${prompt_ids.join(',')}`
      : '';
    return apiRequest<PromptExportData>(`${API_BASE}/export${queryParams}`);
  },

  async importPrompts(data: PromptExportData): Promise<PromptImportResult> {
    return apiRequest<PromptImportResult>(`${API_BASE}/import`, {
      method: 'POST',
      body: data,
    });
  },

  downloadAsJson(prompts: PromptWithFolder[], folders: PromptFolder[]): void {
    const exportData: PromptExportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      prompts,
      folders,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  parseImportFile(file: File): Promise<PromptExportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (!data.version || !data.prompts) {
            throw new Error('Invalid import file format');
          }
          resolve(data as PromptExportData);
        } catch (error) {
          reject(new Error('Failed to parse import file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
};
