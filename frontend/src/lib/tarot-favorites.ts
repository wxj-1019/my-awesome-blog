/**
 * 塔罗牌收藏（localStorage 纯前端存储）。
 * 纯函数便于单测；读写注入 storage。
 */

import { tarotDeck } from '@/mock/tarot';

const FAVORITES_KEY = 'tarot_favorites_v1';
/** 收藏上限（不超过牌数） */
export const FAVORITES_MAX = tarotDeck.length;

/** 全部合法牌 id 集合（校验用） */
const VALID_IDS = new Set(tarotDeck.map((c) => c.id));

/** 解析原始字符串为合法收藏列表（过滤脏 id、去重、限长） */
export function parseFavorites(raw: string | null): string[] {
  if (!raw) {return [];}
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {return [];}
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of parsed) {
      if (typeof item !== 'string') {continue;}
      if (!VALID_IDS.has(item) || seen.has(item)) {continue;}
      seen.add(item);
      result.push(item);
      if (result.length >= FAVORITES_MAX) {break;}
    }
    return result;
  } catch {
    return [];
  }
}

/** 切换收藏状态（纯函数，返回新数组） */
export function toggleFavorite(ids: readonly string[], cardId: string): string[] {
  if (!VALID_IDS.has(cardId)) {return [...ids];}
  if (ids.includes(cardId)) {
    return ids.filter((id) => id !== cardId);
  }
  if (ids.length >= FAVORITES_MAX) {return [...ids];}
  return [...ids, cardId];
}

/** 从 localStorage 读取收藏（不可用时返回 []） */
export function loadFavorites(storage?: Pick<Storage, 'getItem'>): string[] {
  if (typeof window === 'undefined') {return [];}
  try {
    return parseFavorites((storage ?? window.localStorage).getItem(FAVORITES_KEY));
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级
    return [];
  }
}

/** 写入 localStorage */
export function saveFavorites(ids: readonly string[], storage?: Pick<Storage, 'setItem'>): void {
  if (typeof window === 'undefined') {return;}
  try {
    (storage ?? window.localStorage).setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // 静默降级
  }
}
