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
export const loginApi = async (username: string, password: string): Promise<AuthResponse> => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  const url = `${API_BASE_URL}/auth/login`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const responseText = await response.text();
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
    if (!data.access_token) {
      throw new Error('登录响应缺少访问令牌');
    }
    const token = data.access_token;
    setToken(token);
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
    return null;
  }
  try {
    const userData = await get('/users/me');
    localStorage.setItem('auth_user', JSON.stringify(userData));
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