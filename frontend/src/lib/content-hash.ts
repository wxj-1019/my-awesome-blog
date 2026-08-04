/**
 * 计算正文内容的 SHA-256 hash，用于修订应用时的冲突检测。
 * 浏览器环境使用 Web Crypto API。
 */
export async function contentHash(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
