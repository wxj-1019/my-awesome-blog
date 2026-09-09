/**
 * 用户互动服务：文章点赞 / 收藏 / 关注作者。
 * toggle 端点返回操作后的状态；状态查询供详情页挂载时回显（匿名恒为未互动）。
 */

import { apiRequest } from '@/lib/api-client';

export interface InteractionState {
  /** like → liked；bookmark → bookmarked；follow → following */
  value: boolean;
}

export const interactionService = {
  /** 点赞状态（当前用户；匿名 false） */
  async getLikeStatus(articleId: string): Promise<boolean> {
    const res = await apiRequest<{ liked: boolean }>(`/articles/${articleId}/like`);
    return res.liked;
  },

  /** 切换点赞，返回操作后的状态 */
  async toggleLike(articleId: string): Promise<boolean> {
    const res = await apiRequest<{ liked: boolean }>(`/articles/${articleId}/like`, {
      method: 'POST',
    });
    return res.liked;
  },

  async getBookmarkStatus(articleId: string): Promise<boolean> {
    const res = await apiRequest<{ bookmarked: boolean }>(`/articles/${articleId}/bookmark`);
    return res.bookmarked;
  },

  async toggleBookmark(articleId: string): Promise<boolean> {
    const res = await apiRequest<{ bookmarked: boolean }>(`/articles/${articleId}/bookmark`, {
      method: 'POST',
    });
    return res.bookmarked;
  },

  async getFollowStatus(userId: string): Promise<boolean> {
    const res = await apiRequest<{ following: boolean }>(`/users/${userId}/follow`);
    return res.following;
  },

  async toggleFollow(userId: string): Promise<boolean> {
    const res = await apiRequest<{ following: boolean }>(`/users/${userId}/follow`, {
      method: 'POST',
    });
    return res.following;
  },
};

export default interactionService;
