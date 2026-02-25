import { API_BASE_URL } from '@/config/api';
import { TimelineItem, BackendTimelineEvent } from '@/types';

/**
 * 格式化日期（将 YYYY-MM-DD 转换为 YYYY年M月）
 */
function formatTimelineDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

/**
 * 获取时间线事件列表
 */
export async function fetchTimelineEvents(
  skip = 0,
  limit = 100,
  isActive = true
): Promise<TimelineItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/timeline-events/?skip=${skip}&limit=${limit}&is_active=${isActive}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BackendTimelineEvent[] = await response.json();

    return data
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
      .map((event) => ({
        date: formatTimelineDate(event.event_date),
        title: event.title,
        description: event.description || '',
      }));
  } catch (error) {
    console.error('Failed to fetch timeline events:', error);
    throw error;
  }
}

/**
 * 根据ID获取单个时间线事件
 */
export async function fetchTimelineEventById(
  eventId: string
): Promise<BackendTimelineEvent> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/timeline-events/${eventId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch timeline event:', error);
    throw error;
  }
}
