const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/** 与 middleware 读取的 cookie 名保持一致 */
const AUTH_COOKIE = 'auth_token';
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 天，对齐常见 refresh 周期

function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.cookie
    .split(';')
    .some((c) => c.trim().startsWith(`${AUTH_COOKIE}=`));
}

function setAuthCookie(token: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  // 非 HttpOnly：供 middleware 做边缘拦截；真正鉴权仍在后端 JWT
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

function clearAuthCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 将 localStorage 中的 token 同步到 auth_token cookie。
 * 应用启动时调用一次，避免「已登录但无 cookie → middleware 踢回登录」。
 * @returns 是否完成写入（已有 cookie 或无 token 时返回 false）
 */
export const syncAuthCookie = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    if (hasAuthCookie()) {
      clearAuthCookie();
    }
    return false;
  }
  if (hasAuthCookie()) {
    return false;
  }
  setAuthCookie(token);
  return true;
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  setAuthCookie(token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearAuthCookie();
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};
