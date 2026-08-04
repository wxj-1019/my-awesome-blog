/**
 * 塔罗占卜历史（localStorage 纯前端存储，不上传）。
 * parseHistory/addHistoryEntry 为纯函数，便于单测；读写函数注入 storage 便于测试。
 */

import { tarotDeck } from '@/mock/tarot';
import type { SpreadType } from '@/types/tarot';

/** 历史条目中的一张牌（只存 id 与朝向，减少体积） */
export interface TarotHistoryDrawn {
  cardId: string;
  isReversed: boolean;
}

/** 一次占卜的历史条目 */
export interface TarotHistoryEntry {
  id: string;
  question: string;
  spreadType: SpreadType;
  drawn: TarotHistoryDrawn[];
  createdAt: number;
}

const HISTORY_KEY = 'tarot_history_v1';
/** 历史保留上限（条） */
export const HISTORY_MAX = 20;

const VALID_SPREADS: SpreadType[] = ['single', 'three'];

/** 校验并规范化一条原始记录；不合法返回 null */
export function sanitizeEntry(raw: unknown): TarotHistoryEntry | null {
  if (typeof raw !== 'object' || raw === null) {return null;}
  const r = raw as Record<string, unknown>;
  if (
    typeof r.id !== 'string' ||
    typeof r.question !== 'string' ||
    !VALID_SPREADS.includes(r.spreadType as SpreadType) ||
    typeof r.createdAt !== 'number' ||
    !Array.isArray(r.drawn)
  ) {
    return null;
  }
  const drawn: TarotHistoryDrawn[] = [];
  for (const item of r.drawn) {
    if (typeof item !== 'object' || item === null) {continue;}
    const d = item as Record<string, unknown>;
    if (
      typeof d.cardId === 'string' &&
      typeof d.isReversed === 'boolean' &&
      tarotDeck.some((c) => c.id === d.cardId)
    ) {
      drawn.push({ cardId: d.cardId, isReversed: d.isReversed });
    }
  }
  if (drawn.length === 0) {return null;}
  return {
    id: r.id,
    question: r.question,
    spreadType: r.spreadType as SpreadType,
    drawn,
    createdAt: r.createdAt,
  };
}

/** 解析 localStorage 原始字符串为合法历史（非法 JSON / 脏数据返回 []） */
export function parseHistory(raw: string | null): TarotHistoryEntry[] {
  if (!raw) {return [];}
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {return [];}
    const entries: TarotHistoryEntry[] = [];
    for (const item of parsed) {
      const entry = sanitizeEntry(item);
      if (entry) {entries.push(entry);}
    }
    return entries;
  } catch {
    return [];
  }
}

/** 新条目插入头部并截断上限（纯函数） */
export function addHistoryEntry(
  entries: readonly TarotHistoryEntry[],
  entry: TarotHistoryEntry
): TarotHistoryEntry[] {
  return [entry, ...entries].slice(0, HISTORY_MAX);
}

/** 从 localStorage 读取历史（解析失败返回 []；SSR 时返回 []） */
export function loadHistory(storage?: Pick<Storage, 'getItem'>): TarotHistoryEntry[] {
  if (typeof window === 'undefined') {return [];}
  return parseHistory((storage ?? window.localStorage).getItem(HISTORY_KEY));
}

/** 写入 localStorage（不可用时静默降级） */
export function saveHistory(
  entries: readonly TarotHistoryEntry[],
  storage?: Pick<Storage, 'setItem'>
): void {
  if (typeof window === 'undefined') {return;}
  try {
    (storage ?? window.localStorage).setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级
  }
}
