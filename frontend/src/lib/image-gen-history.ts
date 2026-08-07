import type { GenType } from '@/lib/api/imageGen';

/** 会话历史条目：一次成功生成的完整快照（提示词/类型/结果），可一键恢复 */
export interface GenHistoryEntry {
  id: string;
  createdAt: number;
  kind: GenType;
  prompt: string;
  /** 图片尺寸/张数（kind=image 时回填用；RunningHub 标准模型是否支持取决于模型） */
  size?: string;
  count?: number;
  /** 图生图参考图 URL（kind=image 且基于参考图生成时非空） */
  refImageUrl?: string | null;
  /** 生成图片 URL（kind=image 时非空） */
  images: string[];
  /** 生成视频 URL（kind=video 时非空） */
  videoUrl: string | null;
}

/** localStorage 键名（含版本号，未来结构变更可迁移/丢弃） */
const HISTORY_KEY = 'image_gen_history_v1';
/** 历史保留上限（条），超出丢弃最旧 */
export const HISTORY_MAX = 30;

const VALID_KINDS: GenType[] = ['image', 'video'];

/** 校验并规范化一条原始记录；不合法返回 null */
export function sanitizeEntry(raw: unknown): GenHistoryEntry | null {
  if (typeof raw !== 'object' || raw === null) {return null;}
  const r = raw as Record<string, unknown>;
  if (
    typeof r.id !== 'string' ||
    typeof r.prompt !== 'string' ||
    !VALID_KINDS.includes(r.kind as GenType) ||
    typeof r.createdAt !== 'number' ||
    !Array.isArray(r.images) ||
    r.images.some((u) => typeof u !== 'string')
  ) {
    return null;
  }
  return {
    id: r.id,
    createdAt: r.createdAt,
    kind: r.kind as GenType,
    prompt: r.prompt,
    size: typeof r.size === 'string' ? r.size : undefined,
    count: typeof r.count === 'number' ? r.count : undefined,
    refImageUrl: typeof r.refImageUrl === 'string' ? r.refImageUrl : null,
    images: r.images as string[],
    videoUrl: typeof r.videoUrl === 'string' ? r.videoUrl : null,
  };
}

/** 解析 localStorage 原始字符串为合法历史（非法 JSON / 脏数据返回 []） */
export function parseHistory(raw: string | null): GenHistoryEntry[] {
  if (!raw) {return [];}
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {return [];}
    const entries: GenHistoryEntry[] = [];
    for (const item of parsed) {
      const entry = sanitizeEntry(item);
      if (entry) {entries.push(entry);}
    }
    return entries;
  } catch {
    return [];
  }
}

/** 新条目插入头部并截断上限（纯函数，不修改入参） */
export function addHistoryEntry(
  entries: readonly GenHistoryEntry[],
  entry: GenHistoryEntry
): GenHistoryEntry[] {
  return [entry, ...entries].slice(0, HISTORY_MAX);
}

/** 删除指定条目（按 id，纯函数） */
export function deleteHistoryEntry(
  entries: readonly GenHistoryEntry[],
  id: string
): GenHistoryEntry[] {
  return entries.filter((e) => e.id !== id);
}

/** 从 localStorage 读取历史（解析失败/不可用时返回 []；SSR 时返回 []） */
export function loadHistory(storage?: Pick<Storage, 'getItem'>): GenHistoryEntry[] {
  if (typeof window === 'undefined') {return [];}
  try {
    return parseHistory((storage ?? window.localStorage).getItem(HISTORY_KEY));
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级
    return [];
  }
}

/** 写入 localStorage（不可用时静默降级） */
export function saveHistory(
  entries: readonly GenHistoryEntry[],
  storage?: Pick<Storage, 'setItem'>
): void {
  if (typeof window === 'undefined') {return;}
  try {
    (storage ?? window.localStorage).setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级
  }
}
