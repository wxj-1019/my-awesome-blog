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

/** 集合路径必须带尾斜杠，避免 FastAPI 307 绝对跳转到 :8989 导致 Failed to fetch */
const API_URL = '/timeline-events/';

export const timelineService = {
  async getTimelineEvents(params?: { is_active?: boolean; skip?: number; limit?: number }): Promise<TimelineEvent[]> {
    const queryString = new URLSearchParams();
    if (params?.is_active !== undefined) {queryString.append('is_active', params.is_active.toString());}
    if (params?.skip !== undefined) {queryString.append('skip', params.skip.toString());}
    if (params?.limit !== undefined) {queryString.append('limit', params.limit.toString());}

    const qs = queryString.toString();
    return apiRequest(qs ? `${API_URL}?${qs}` : API_URL);
  },

  async getTimelineEventById(eventId: string): Promise<TimelineEvent> {
    return apiRequest(`/timeline-events/${eventId}`);
  },

  async createTimelineEvent(eventData: TimelineEventCreate): Promise<TimelineEvent> {
    return apiRequest(API_URL, {
      method: 'POST',
      body: eventData,
    });
  },

  async updateTimelineEvent(eventId: string, eventData: TimelineEventUpdate): Promise<TimelineEvent> {
    return apiRequest(`/timeline-events/${eventId}`, {
      method: 'PUT',
      body: eventData,
    });
  },

  async deleteTimelineEvent(eventId: string): Promise<void> {
    return apiRequest(`/timeline-events/${eventId}`, {
      method: 'DELETE',
    });
  },
};
