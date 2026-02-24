import { UserProfile } from '@/types';
import { setToken, removeToken, getToken, isAuthenticated as isAuth } from '@/lib/auth-utils';
import { API_BASE_URL } from '@/config/api';

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `请求失败: ${response.status}`);
  }

  return response.json();
};

const get = (endpoint: string) => apiRequest(endpoint, { method: 'GET' });
const post = (endpoint: string, data?: any) => apiRequest(endpoint, { 
  method: 'POST', 
  body: data ? JSON.stringify(data) : undefined 
});

export const loginApi = async (username: string, password: string): Promise<AuthResponse> => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  const url = `${API_BASE_URL}/auth/login`;

  console.log('[loginApi] 请求 URL:', url);
  console.log('[loginApi] 用户名:', username);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    console.log('[loginApi] 响应状态:', response.status, response.statusText);
    console.log('[loginApi] 响应头:', Object.fromEntries(response.headers.entries()));
    console.log('[loginApi] 响应类型:', response.headers.get('content-type'));

    const responseText = await response.text();
    console.log('[loginApi] 原始响应文本:', responseText);

    if (!response.ok) {
      let errorData: { detail?: string; message?: string } = {};

      try {
        if (responseText) {
            errorData = JSON.parse(responseText);
        }
      } catch (e) {
        console.error('[loginApi] JSON解析失败:', e);
      }

      console.error('[loginApi] 错误响应:', errorData);
      throw new Error(errorData.detail || errorData.message || `登录失败 (${response.status})`);
    }

    const data = JSON.parse(responseText);
    console.log('[loginApi] 成功响应:', data);

    if (!data.access_token) {
      throw new Error('登录响应缺少访问令牌');
    }

    const token = data.access_token;
    setToken(token);
    console.log('[loginApi] Token 已保存到 localStorage');

    return {
      token,
      user: {
        id: '',
        username: username,
        email: '',
        fullName: username,
      }
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[loginApi] 网络错误，无法连接到后端:', error);
      throw new Error('无法连接到服务器，请检查网络连接或后端是否运行');
    }
    throw error;
  }
};

export const logoutApi = async (): Promise<void> => {
  removeToken();
};

export const getCurrentUserApi = async (): Promise<UserProfile | null> => {
  const token = getToken();

  if (!token) {
    console.log('[getCurrentUserApi] 没有找到 token');
    return null;
  }

  console.log('[getCurrentUserApi] 正在获取用户信息...');

  try {
    const userData = await get('/users/me');
    localStorage.setItem('auth_user', JSON.stringify(userData));
    console.log('[getCurrentUserApi] 用户信息获取成功:', userData);
    return userData;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('UNAUTHORIZED') || error.message.includes('Could not validate credentials') || error.message.includes('Internal server error')) {
        // 静默处理认证失败 - 这是预期的行为（token 过期或无效）
        removeToken();
        localStorage.removeItem('auth_user');
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        console.warn('[getCurrentUserApi] 用户端点不存在');
      } else {
        console.warn('[getCurrentUserApi] 获取用户信息失败:', error.message);
      }
    }
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return isAuth();
};

export const getAdminUserApi = async (): Promise<UserProfile | null> => {
  try {
    const userData = await get('/users/admin');
    return userData;
  } catch (error) {
    if (error instanceof Error) {
      console.warn('[getAdminUserApi] 获取管理员信息失败:', error.message);
    }
    return null;
  }
};
