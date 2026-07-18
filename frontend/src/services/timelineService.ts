import { apiRequest } from '@/lib/api-client';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface TimelineEventCreate {
  title: string;
  description?: string;
  event_date: string;
  event_type?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface TimelineEventUpdate {
  title?: string;
  description?: string;
  event_date?: string;
  event_type?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
}

const API_URL = '/timeline-events';

export const timelineService = {
  async getTimelineEvents(params?: { is_active?: boolean; skip?: number; limit?: number }): Promise<TimelineEvent[]> {
    const queryString = new URLSearchParams();
    if (params?.is_active !== undefined) {queryString.append('is_active', params.is_active.toString());}
    if (params?.skip !== undefined) {queryString.append('skip', params.skip.toString());}
    if (params?.limit !== undefined) {queryString.append('limit', params.limit.toString());}

    return apiRequest(`${API_URL}?${queryString.toString()}`);
  },

  async getTimelineEventById(eventId: string): Promise<TimelineEvent> {
    return apiRequest(`${API_URL}/${eventId}`);
  },

  async createTimelineEvent(eventData: TimelineEventCreate): Promise<TimelineEvent> {
    return apiRequest(API_URL, {
      method: 'POST',
      body: eventData,
    });
  },

  async updateTimelineEvent(eventId: string, eventData: TimelineEventUpdate): Promise<TimelineEvent> {
    return apiRequest(`${API_URL}/${eventId}`, {
      method: 'PUT',
      body: eventData,
    });
  },

  async deleteTimelineEvent(eventId: string): Promise<void> {
    return apiRequest(`${API_URL}/${eventId}`, {
      method: 'DELETE',
    });
  },
};
