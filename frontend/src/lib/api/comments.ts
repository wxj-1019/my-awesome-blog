import { apiFetch } from '@/lib/api-client';
export interface Comment {
  id: string;
  content: string;
  article_id: string;
  author_id: string;
  author?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  is_approved: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CommentCreate {
  content: string;
  article_id: string;
}

export interface CommentUpdate {
  content?: string;
  is_approved?: boolean;
}

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export const getComments = async (params?: {
  skip?: number;
  limit?: number;
  article_id?: string;
  author_id?: string;
  approved_only?: boolean;
}): Promise<CommentWithAuthor[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
  if (params?.article_id) {queryParams.append('article_id', params.article_id);}
  if (params?.author_id) {queryParams.append('author_id', params.author_id);}
  if (params?.approved_only !== undefined) {queryParams.append('approved_only', params.approved_only.toString());}

  const response = await apiFetch(`/comments/?${queryParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const getCommentsByArticle = async (articleId: string, params?: {
  skip?: number;
  limit?: number;
  approved_only?: boolean;
}): Promise<CommentWithAuthor[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
  if (params?.approved_only !== undefined) {queryParams.append('approved_only', params.approved_only.toString());}

  const response = await apiFetch(`/comments/?article_id=${articleId}&${queryParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const getCommentById = async (id: string): Promise<CommentWithAuthor> => {
  const response = await apiFetch(`/comments/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('评论不存在');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const createComment = async (comment: CommentCreate): Promise<Comment> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/comments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(comment),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const updateComment = async (id: string, comment: CommentUpdate): Promise<Comment> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/comments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(comment),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const deleteComment = async (id: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/comments/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }
};

export const approveComment = async (id: string): Promise<Comment> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/comments/${id}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const rejectComment = async (id: string): Promise<Comment> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/comments/${id}/reject`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};
