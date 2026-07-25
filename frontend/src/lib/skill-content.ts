/** 默认折叠预览行数（规格约定约 16） */
export const DEFAULT_SKILL_PREVIEW_LINES = 16;

/**
 * 将站点根相对 contentPath（必须以 /skills/ 开头）转为 public 下相对路径。
 * 非法或路径穿越返回 null。
 */
export function contentPathToPublicFile(contentPath: string): string | null {
  if (!contentPath.startsWith('/skills/')) {return null;}
  const rel = contentPath.replace(/^\//, '');
  // 仅允许正斜杠路径段，拒绝 .. 与反斜杠
  if (rel.includes('..') || rel.includes('\\') || rel.includes('\0')) {
    return null;
  }
  const segments = rel.split('/').filter(Boolean);
  if (segments[0] !== 'skills') {return null;}
  if (segments.some((s) => s === '.' || s === '..')) {return null;}
  return segments.join('/');
}

/** 下载文件名：{slug}-SKILL.md */
export function skillDownloadFilename(slug: string): string {
  return `${slug}-SKILL.md`;
}

/**
 * 按行截取 Markdown 预览。
 * @returns text 预览正文；truncated 是否发生截断
 */
export function previewMarkdownLines(
  markdown: string,
  maxLines: number = DEFAULT_SKILL_PREVIEW_LINES,
): { text: string; truncated: boolean } {
  const lines = markdown.split('\n');
  if (lines.length <= maxLines) {
    return { text: markdown, truncated: false };
  }
  return {
    text: lines.slice(0, maxLines).join('\n'),
    truncated: true,
  };
}
