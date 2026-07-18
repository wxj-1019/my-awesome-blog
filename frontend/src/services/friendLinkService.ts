import { apiRequest } from '@/lib/api-client';

export interface FriendLink {
  id: string;
  name: string;
  url: string;
  favicon: string | null;
  avatar: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  click_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface FriendLinkCreate {
  name: string;
  url: string;
  favicon?: string;
  avatar?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface FriendLinkUpdate {
  name?: string;
  url?: string;
  favicon?: string;
  avatar?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
}

const API_URL = '/friend-links';

export const friendLinkService = {
  async getFriendLinks(params?: { is_active?: boolean; is_featured?: boolean; skip?: number; limit?: number }): Promise<FriendLink[]> {
    const queryString = new URLSearchParams();
    if (params?.is_active !== undefined) {queryString.append('is_active', params.is_active.toString());}
    if (params?.is_featured !== undefined) {queryString.append('is_featured', params.is_featured.toString());}
    if (params?.skip !== undefined) {queryString.append('skip', params.skip.toString());}
    if (params?.limit !== undefined) {queryString.append('limit', params.limit.toString());}

    return apiRequest(`${API_URL}?${queryString.toString()}`);
  },

  async getFriendLinkById(linkId: string): Promise<FriendLink> {
    return apiRequest(`${API_URL}/${linkId}`);
  },

  async createFriendLink(linkData: FriendLinkCreate): Promise<FriendLink> {
    return apiRequest(API_URL, {
      method: 'POST',
      body: linkData,
    });
  },

  async updateFriendLink(linkId: string, linkData: FriendLinkUpdate): Promise<FriendLink> {
    return apiRequest(`${API_URL}/${linkId}`, {
      method: 'PUT',
      body: linkData,
    });
  },

  async deleteFriendLink(linkId: string): Promise<void> {
    return apiRequest(`${API_URL}/${linkId}`, {
      method: 'DELETE',
    });
  },

  async trackClick(linkId: string): Promise<void> {
    return apiRequest(`${API_URL}/${linkId}/click`, {
      method: 'POST',
    });
  },
};
