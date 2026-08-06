import type { GenType } from '@/lib/api/imageGen';

/** 会话历史条目：一次成功生成的完整快照（提示词/类型/结果），可一键恢复 */
export interface GenHistoryEntry {
  id: string;
  createdAt: number;
  kind: GenType;
  prompt: string;
  /** 图片尺寸/张数（kind=image 时回填用；RunningHub 工作流是否支持取决于模板） */
  size?: string;
  count?: number;
  /** 生成图片 URL（kind=image 时非空） */
  images: string[];
  /** 生成视频 URL（kind=video 时非空） */
  videoUrl: string | null;
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
