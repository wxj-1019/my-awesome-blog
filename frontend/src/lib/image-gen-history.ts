import type { GeneratedImage } from '@/lib/api/imageGen';

/** 会话历史条目：一次成功生成的完整快照（提示词/尺寸/张数/图片），可一键恢复 */
export interface GenHistoryEntry {
  id: string;
  createdAt: number;
  prompt: string;
  size: string;
  count: number;
  images: GeneratedImage[];
}

/** 会话内历史条数上限，超出后丢弃最旧条目 */
const HISTORY_MAX = 5;

/** 新条目插入头部并截断上限（纯函数，不修改入参） */
export function addHistoryEntry(
  entries: readonly GenHistoryEntry[],
  entry: GenHistoryEntry
): GenHistoryEntry[] {
  return [entry, ...entries].slice(0, HISTORY_MAX);
}
