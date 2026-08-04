import { apiRequest } from '@/lib/api-client';
import type { Comment as UIComment } from '@/types';
import logger from '@/utils/logger';

/**
 * 后端返回的评论数据结构
 */
export interface ApiComment {
  id: string;
  content: string;
  article_id: string;
  author_id: string | null;
  nickname?: string | null; // 游客昵称（author 为空时后端返回）
  parent_id: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string | null;
  author?: {
    id: string;
    username: string;
    avatar: string | null;
    full_name: string | null;
  };
}

export interface CommentCreate {
  content: string;
  article_id: string;
  parent_id?: string | null;
  nickname?: string; // 游客昵称（未登录时填写）
}

export interface CommentUpdate {
  content?: string;
  is_approved?: boolean;
}

const API_URL = '/comments';

/**
 * 将后端评论转换为 UI 展示用的评论类型
 */
function toUIComment(apiComment: ApiComment): UIComment {
  return {
    id: apiComment.id,
    content: apiComment.content,
    author: {
      id: apiComment.author?.id || apiComment.author_id || '',
      username: apiComment.nickname || apiComment.author?.username || '匿名游客',
      avatar: apiComment.author?.avatar || undefined,
    },
    createdAt: apiComment.created_at,
    likes: 0,
    replies: [],
  };
}

/**
 * 获取评论的回复并递归构建回复树
 */
async function getRepliesTree(parentId: string, depth = 0, maxDepth = 2): Promise<UIComment[]> {
  if (depth >= maxDepth) {
    return [];
  }

  try {
    const replies = await apiRequest<ApiComment[]>(`${API_URL}/${parentId}/replies`);
    const result: UIComment[] = [];

    for (const reply of replies) {
      const uiReply = toUIComment(reply);
      uiReply.replies = await getRepliesTree(reply.id, depth + 1, maxDepth);
      result.push(uiReply);
    }

    return result;
  } catch (error) {
    logger.error(`获取评论回复失败: ${parentId}`, error);
    return [];
  }
}

/**
 * 获取文章评论树（顶层评论 + 回复）
 */
export const getCommentTree = async (
  articleId: string,
  maxDepth = 2
): Promise<UIComment[]> => {
  try {
    const topLevelComments = await apiRequest<ApiComment[]>(
      `${API_URL}/?article_id=${articleId}&limit=100`
    );

    const result: UIComment[] = [];

    for (const comment of topLevelComments) {
      const uiComment = toUIComment(comment);
      uiComment.replies = await getRepliesTree(comment.id, 0, maxDepth);
      result.push(uiComment);
    }

    return result;
  } catch (error) {
    logger.error(`获取文章评论失败: ${articleId}`, error);
    throw error;
  }
};

/**
 * 创建评论或回复
 */
export const createComment = async (commentData: CommentCreate): Promise<UIComment> => {
  const apiComment = await apiRequest<ApiComment>(API_URL, {
    method: 'POST',
    body: commentData,
  });
  return toUIComment(apiComment);
};

/**
 * 更新评论
 */
export const updateComment = async (
  commentId: string,
  commentData: CommentUpdate
): Promise<ApiComment> => {
  return apiRequest(`${API_URL}/${commentId}`, {
    method: 'PUT',
    body: commentData,
  });
};

/**
 * 删除评论
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  return apiRequest(`${API_URL}/${commentId}`, {
    method: 'DELETE',
  });
};
