import { apiFetch, extractApiErrorMessage } from '@/lib/api-client';
export interface Subscription {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'inactive' | 'pending' | 'unsubscribed';
  created_at: string;
  updated_at?: string;
}

export interface SubscriptionCreate {
  email: string;
  name?: string;
}

export interface SubscriptionUpdate {
  name?: string;
  status?: 'active' | 'inactive' | 'pending' | 'unsubscribed';
}

/** 统一解析订阅接口错误：兼容统一异常处理器嵌套 error / FastAPI 原生 detail */
async function toApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const data: unknown = await response.json().catch(() => null);
  return extractApiErrorMessage(data, fallback);
}

export const getSubscriptions = async (params?: {
  skip?: number;
  limit?: number;
  is_active?: boolean;
}): Promise<Subscription[]> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) {queryParams.append('skip', params.skip.toString());}
  if (params?.limit !== undefined) {queryParams.append('limit', params.limit.toString());}
  if (params?.is_active !== undefined) {queryParams.append('is_active', params.is_active.toString());}

  const response = await apiFetch(`/subscriptions/?${queryParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await toApiErrorMessage(response, `请求失败: ${response.status}`));
  }

  return response.json();
};

export const getSubscriptionById = async (id: string): Promise<Subscription> => {
  const response = await apiFetch(`/subscriptions/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('订阅不存在');
    }
    throw new Error(await toApiErrorMessage(response, `请求失败: ${response.status}`));
  }

  return response.json();
};

export const createSubscription = async (subscription: SubscriptionCreate): Promise<Subscription> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/subscriptions/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    throw new Error(await toApiErrorMessage(response, `请求失败: ${response.status}`));
  }

  return response.json();
};

/**
 * 邮箱验证（订阅确认）：`POST /subscriptions/verify?token=xxx`。
 * token 来自订阅邮件中的验证链接；成功不读响应体（后端契约以状态码为准）。
 */
export const verifySubscription = async (token: string): Promise<void> => {
  const response = await apiFetch(
    `/subscriptions/verify?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(await toApiErrorMessage(response, '邮箱验证失败，链接可能已失效'));
  }
};

/** 按邮箱退订：`POST /subscriptions/unsubscribe?email=xxx` */
export const unsubscribe = async (email: string): Promise<void> => {
  const response = await apiFetch(
    `/subscriptions/unsubscribe?email=${encodeURIComponent(email)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(await toApiErrorMessage(response, '退订失败，请稍后重试'));
  }
};

export const updateSubscription = async (id: string, subscription: SubscriptionUpdate): Promise<Subscription> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/subscriptions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    throw new Error(await toApiErrorMessage(response, `请求失败: ${response.status}`));
  }

  return response.json();
};

export const deleteSubscription = async (id: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/subscriptions/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(await toApiErrorMessage(response, `请求失败: ${response.status}`));
  }
};
