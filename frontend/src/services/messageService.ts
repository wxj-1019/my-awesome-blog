import { Message, CreateMessageRequest, DanmakuMessage } from '@/types';
import { apiRequest } from '@/lib/api-client';
import logger from '@/utils/logger';

interface RawAuthor {
  id?: string;
  username?: string;
  avatar?: string;
}

interface RawMessage {
  id: string;
  content: string;
  author?: RawAuthor;
  created_at: string;
  updated_at?: string;
  color?: string;
  is_danmaku?: boolean;
  likes?: number;
  level?: number;
  is_edited?: boolean;
  is_pinned?: boolean;
  is_featured?: boolean;
  tags?: string[];
  parent_id?: string;
  reply_count?: number;
  speed?: number;
  y?: number;
  layer?: number;
}

// 通用响应转换函数
const transformMessage = (msg: unknown): Message => {
  const raw = msg as RawMessage;
  return {
    id: raw.id,
    content: raw.content,
    author: {
      id: raw.author?.id || '',
      username: raw.author?.username || '匿名用户',
      avatar: raw.author?.avatar,
    },
    created_at: raw.created_at,
    color: raw.color || '#00D9FF',
    isDanmaku: raw.is_danmaku ?? true,
    likes: raw.likes || 0,
    replies: [],
    level: raw.level || 1,
  };
};

// 弹幕颜色选项
export const DANMAKU_COLORS = [
  { name: '科技蓝', value: '#00D9FF' },
  { name: '樱花粉', value: '#FF6B9D' },
  { name: '薄荷绿', value: '#4ECDC4' },
  { name: '阳光黄', value: '#FFE66D' },
  { name: '珊瑚红', value: '#FF6B6B' },
  { name: '紫罗兰', value: '#A855F7' },
  { name: '橙色', value: '#FB923C' },
  { name: '白色', value: '#FFFFFF' },
] as const;

/**
 * 获取所有留言
 * @returns 留言列表
 */
export const getMessages = async (): Promise<Message[]> => {
  try {
    const messages = await apiRequest<RawMessage[]>('/messages/');
    return messages.map(transformMessage);
  } catch (error) {
    logger.error('获取留言失败:', error);
    return [];
  }
};

/**
 * 获取弹幕列表（仅返回设置为弹幕的消息）
 * @returns 弹幕消息列表
 */
export const getDanmakuMessages = async (): Promise<DanmakuMessage[]> => {
  try {
    const messages = await apiRequest<RawMessage[]>('/messages/danmaku');
    return messages
      .map((msg) => ({
        id: msg.id,
        content: msg.content,
        author: {
          id: msg.author?.id || '',
          username: msg.author?.username || '匿名用户',
          avatar: msg.author?.avatar,
        },
        created_at: msg.created_at,
        color: msg.color || '#00D9FF',
        speed: msg.speed || Math.random() * 3 + 2,
        y: msg.y || Math.random() * 80 + 10,
        layer: msg.layer || Math.floor(Math.random() * 3) + 1,
      }))
      .sort(() => Math.random() - 0.5);
  } catch (error) {
    logger.error('获取弹幕失败:', error);
    return [];
  }
};

/**
 * 创建新留言
 * @param data 留言数据
 * @returns 创建的留言
 */
export const createMessage = async (data: CreateMessageRequest): Promise<Message> => {
  const response = await apiRequest('/messages/', {
    method: 'POST',
    body: {
      content: data.content,
      color: data.color,
      is_danmaku: data.isDanmaku,
    },
  });

  return transformMessage(response);
};

/**
 * 删除留言
 * @param messageId 留言ID
 * @returns 是否删除成功
 */
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    await apiRequest(`/messages/${messageId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    logger.error('删除留言失败:', error);
    throw error;
  }
};

/**
 * 点赞留言
 * @param messageId 留言ID
 * @returns 更新后的留言
 */
export const likeMessage = async (messageId: string): Promise<Message> => {
  const response = await apiRequest(`/messages/${messageId}/like`, {
    method: 'POST',
  });

  return transformMessage(response);
};

/**
 * 回复留言
 * @param messageId 留言ID
 * @param content 回复内容
 * @returns 更新后的留言
 */
export const replyToMessage = async (messageId: string, content: string): Promise<Message> => {
  const response = await apiRequest('/messages/', {
    method: 'POST',
    body: {
      content,
      parent_id: messageId,
      is_danmaku: false,
    },
  });

  return transformMessage(response);
};

/**
 * 获取留言的回复列表
 * @param messageId 留言ID
 * @returns 回复列表
 */
export const getMessageReplies = async (messageId: string): Promise<Message[]> => {
  try {
    const replies = await apiRequest<RawMessage[]>(`/messages/${messageId}/replies`);
    return replies.map((msg) => ({
      ...transformMessage(msg),
      isDanmaku: (msg as RawMessage).is_danmaku ?? false,
    }));
  } catch (error) {
    logger.error('获取回复失败:', error);
    return [];
  }
};

/**
 * 编辑留言
 * @param messageId 留言ID
 * @param content 新内容
 * @returns 更新后的留言
 */
export const editMessage = async (messageId: string, content: string): Promise<Message> => {
  const response = await apiRequest<RawMessage>(`/messages/${messageId}`, {
    method: 'PUT',
    body: {
      content,
    },
  });

  return {
    ...transformMessage(response),
    isEdited: true,
    editedAt: response.updated_at,
  };
};

/**
 * 检查留言是否可编辑（5分钟内）
 * @param createdAt 创建时间
 * @returns 是否可编辑
 */
export const canEditMessage = (createdAt: string): boolean => {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return now - created <= fiveMinutes;
};

/**
 * 验证留言内容
 * @param content 留言内容
 * @returns 验证结果
 */
export const validateMessage = (content: string): { isValid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: '留言内容不能为空' };
  }

  if (content.trim().length > 200) {
    return { isValid: false, error: '留言内容不能超过200字' };
  }

  return { isValid: true };
};

/**
 * 获取热门留言
 * @param limit 限制数量
 * @returns 热门留言列表
 */
export const getTrendingMessages = async (limit: number = 10): Promise<Message[]> => {
  try {
    const messages = await apiRequest<RawMessage[]>(`/messages/trending?limit=${limit}`);
    return messages.map(transformMessage);
  } catch (error) {
    logger.error('获取热门留言失败:', error);
    return [];
  }
};

/**
 * 获取留言活跃度
 * @param days 天数
 * @returns 活跃度数据
 */
export const getMessageActivity = async (days: number = 7): Promise<{date: string, count: number}[]> => {
  try {
    return await apiRequest(`/messages/stats/activity?days=${days}`);
  } catch (error) {
    logger.error('获取活跃度失败:', error);
    return [];
  }
};

/**
 * 点赞回复
 * @param replyId 回复ID
 * @returns 是否成功
 */
export const likeReplyMessage = async (replyId: string): Promise<boolean> => {
  try {
    await apiRequest(`/messages/replies/${replyId}/like`, {
      method: 'POST',
    });
    return true;
  } catch (error) {
    logger.error('点赞回复失败:', error);
    throw error;
  }
};

/**
 * 删除回复
 * @param replyId 回复ID
 * @returns 是否成功
 */
export const deleteReplyMessage = async (replyId: string): Promise<boolean> => {
  try {
    await apiRequest(`/messages/replies/${replyId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    logger.error('删除回复失败:', error);
    throw error;
  }
};

/**
 * 回复留言（楼中楼）
 * @param messageId 留言ID
 * @param content 回复内容
 * @param parentReplyId 父回复ID（可选，用于多级回复）
 * @returns 更新后的留言
 */
export const replyToMessageWithParent = async (
  messageId: string,
  content: string,
  parentReplyId?: string
): Promise<Message> => {
  const response = await apiRequest('/messages/', {
    method: 'POST',
    body: {
      content,
      parent_id: messageId,
      parent_reply_id: parentReplyId,
      is_danmaku: false,
    },
  });

  return transformMessage(response);
};

/**
 * 置顶留言
 * @param messageId 留言ID
 * @param isPinned 是否置顶
 * @returns 是否成功
 */
export const pinMessage = async (messageId: string, isPinned: boolean): Promise<boolean> => {
  try {
    await apiRequest(`/messages/${messageId}/pin`, {
      method: 'PATCH',
      body: { is_pinned: isPinned },
    });
    return true;
  } catch (error) {
    logger.error('置顶留言失败:', error);
    throw error;
  }
};

/**
 * 设为精华留言
 * @param messageId 留言ID
 * @param isFeatured 是否精华
 * @returns 是否成功
 */
export const featureMessage = async (messageId: string, isFeatured: boolean): Promise<boolean> => {
  try {
    await apiRequest(`/messages/${messageId}/feature`, {
      method: 'PATCH',
      body: { is_featured: isFeatured },
    });
    return true;
  } catch (error) {
    logger.error('设置精华失败:', error);
    throw error;
  }
};

/**
 * 给留言添加/移除标签
 * @param messageId 留言ID
 * @param tags 标签列表
 * @returns 是否成功
 */
export const updateMessageTags = async (messageId: string, tags: string[]): Promise<boolean> => {
  try {
    await apiRequest(`/messages/${messageId}/tags`, {
      method: 'PATCH',
      body: { tags },
    });
    return true;
  } catch (error) {
    logger.error('更新标签失败:', error);
    throw error;
  }
};
