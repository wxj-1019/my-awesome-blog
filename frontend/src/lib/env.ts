/**
 * NEXT_PUBLIC_* 在 next build 时可能被内联。
 * 浏览器请求请优先用 `@/lib/api-client` 的 resolveApiBaseUrl()（同域 /api/v1）。
 * 此处仅保留配置读取；默认回退为相对路径，避免生产打进 localhost。
 */
const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  '/api/v1';

const env = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || apiBase,
  NEXT_PUBLIC_API_BASE_URL: apiBase,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  NEXT_PUBLIC_POSTS_PER_PAGE: process.env.NEXT_PUBLIC_POSTS_PER_PAGE || '10',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

export { env };
export type Env = typeof env;
