'use client';

import { useEffect } from 'react';
import { syncAuthCookie } from '@/lib/auth-utils';

/**
 * 应用启动时同步 localStorage → auth_token cookie，
 * 保证 middleware 能识别已登录会话（尤其是升级前仅写 localStorage 的用户）。
 */
export default function AuthCookieSync() {
  useEffect(() => {
    syncAuthCookie();
  }, []);

  return null;
}
