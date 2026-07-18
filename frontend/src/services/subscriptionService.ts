import { apiRequest } from '@/lib/api-client';

export interface Subscription {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  verification_token: string | null;
  subscribed_at: string;
  verified_at: string | null;
  unsubscribed_at: string | null;
}

export interface SubscriptionCreate {
  email: string;
}

export interface SubscriptionUpdate {
  is_active?: boolean;
  is_verified?: boolean;
}

const API_URL = '/subscriptions';

export const subscriptionService = {
  async getSubscriptions(params?: { is_active?: boolean; skip?: number; limit?: number }): Promise<Subscription[]> {
    const queryString = new URLSearchParams();
    if (params?.is_active !== undefined) {queryString.append('is_active', params.is_active.toString());}
    if (params?.skip !== undefined) {queryString.append('skip', params.skip.toString());}
    if (params?.limit !== undefined) {queryString.append('limit', params.limit.toString());}

    return apiRequest(`${API_URL}?${queryString.toString()}`);
  },

  async getSubscriptionById(subscriptionId: string): Promise<Subscription> {
    return apiRequest(`${API_URL}/${subscriptionId}`);
  },

  async createSubscription(email: string): Promise<Subscription> {
    return apiRequest(API_URL, {
      method: 'POST',
      body: { email },
    });
  },

  async unsubscribe(email: string): Promise<{ message: string }> {
    return apiRequest(`${API_URL}/unsubscribe?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    });
  },

  async updateSubscription(subscriptionId: string, subscriptionData: SubscriptionUpdate): Promise<Subscription> {
    return apiRequest(`${API_URL}/${subscriptionId}`, {
      method: 'PUT',
      body: subscriptionData,
    });
  },

  async deleteSubscription(subscriptionId: string): Promise<void> {
    return apiRequest(`${API_URL}/${subscriptionId}`, {
      method: 'DELETE',
    });
  },

  async getSubscribersCount(): Promise<number> {
    return apiRequest(`${API_URL}/count`);
  },
};
