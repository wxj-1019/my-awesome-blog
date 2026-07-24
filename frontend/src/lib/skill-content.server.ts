import fs from 'node:fs/promises';
import path from 'node:path';
import { contentPathToPublicFile } from '@/lib/skill-content';

/**
 * Server 专用：从 frontend 工程根读取 public 下 skill 正文。
 * 文件不存在或路径非法返回 null，不抛错。
 */
export async function readSkillMarkdown(
  contentPath: string | undefined,
): Promise<string | null> {
  if (!contentPath) return null;
  const rel = contentPathToPublicFile(contentPath);
  if (!rel) return null;
  const abs = path.join(process.cwd(), 'public', ...rel.split('/'));
  try {
    const text = await fs.readFile(abs, 'utf8');
    return text.trim() === '' ? null : text;
  } catch {
    return null;
  }
}
