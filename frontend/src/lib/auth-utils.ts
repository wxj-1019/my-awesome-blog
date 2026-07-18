const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/** 与 middleware 读取的 cookie 名保持一致 */
const AUTH_COOKIE = 'auth_token';
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 天，对齐常见 refresh 周期

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
  const token = localStorage.getItem(TOKEN_KEY);
  // 已登录用户升级后补齐 middleware 用 cookie（仅缺 cookie 时写入）
  if (
    token &&
    typeof document !== 'undefined' &&
    !document.cookie.split(';').some((c) => c.trim().startsWith(`${AUTH_COOKIE}=`))
  ) {
    setAuthCookie(token);
  }
  return token;
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
