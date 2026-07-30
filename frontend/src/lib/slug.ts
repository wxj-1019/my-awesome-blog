/**
 * 根据标题生成 URL slug。
 *
 * 历史问题：旧实现用 /[^\w\s-]/g 会剥掉所有中日韩字符，纯中文标题
 * 生成空 slug，提交后被后端唯一约束/校验拒绝且难以排查。
 * 策略：优先提取 ASCII 可读的 slug；提取不到（如纯中文标题）时
 * 回退为时间戳 slug，保证非空且基本唯一。
 */
export function generateSlug(title: string): string {
  const ascii = title
    .toLowerCase()
    .normalize('NFKD')
    // 去掉变音符号（é -> e）
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (ascii) {
    return ascii;
  }

  // 纯中文等非拉丁标题无法转 ASCII slug，回退时间戳方案
  return title.trim() ? `post-${Date.now().toString(36)}` : '';
}
