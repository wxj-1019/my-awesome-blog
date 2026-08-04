/**
 * 塔罗抽牌统计（localStorage 纯前端存储）。
 * 纯函数便于单测；读写注入 storage。
 */

import { tarotDeck } from '@/mock/tarot';
import type { DrawnCard } from '@/types/tarot';

/** 抽牌统计 */
export interface TarotStats {
  /** 各牌累计出现次数 */
  cardCount: Record<string, number>;
  /** 正/逆位累计次数 */
  orientation: { upright: number; reversed: number };
  /** 累计占卜次数 */
  totalReadings: number;
}

const STATS_KEY = 'tarot_stats_v1';

/** 空统计 */
export function emptyStats(): TarotStats {
  return { cardCount: {}, orientation: { upright: 0, reversed: 0 }, totalReadings: 0 };
}

/** 把一次占卜的抽牌结果并入统计（纯函数，返回新对象） */
export function addStats(stats: TarotStats, drawn: DrawnCard[]): TarotStats {
  const cardCount: Record<string, number> = { ...stats.cardCount };
  let upright = stats.orientation.upright;
  let reversed = stats.orientation.reversed;
  for (const d of drawn) {
    cardCount[d.card.id] = (cardCount[d.card.id] ?? 0) + 1;
    if (d.isReversed) {reversed += 1;} else {upright += 1;}
  }
  return {
    cardCount,
    orientation: { upright, reversed },
    totalReadings: stats.totalReadings + 1,
  };
}

/** 校验并规范化原始统计；非法返回空统计 */
export function sanitizeStats(raw: unknown): TarotStats {
  if (typeof raw !== 'object' || raw === null) {return emptyStats();}
  const r = raw as Record<string, unknown>;
  const cardCountRaw = r.cardCount;
  const cardCount: Record<string, number> = {};
  if (typeof cardCountRaw === 'object' && cardCountRaw !== null) {
    for (const [k, v] of Object.entries(cardCountRaw as Record<string, unknown>)) {
      if (typeof v === 'number' && v > 0 && tarotDeck.some((c) => c.id === k)) {
        cardCount[k] = v;
      }
    }
  }
  const orientation = r.orientation;
  const upright =
    typeof orientation === 'object' && orientation !== null && typeof (orientation as Record<string, unknown>).upright === 'number'
      ? (orientation as Record<string, number>).upright
      : 0;
  const reversed =
    typeof orientation === 'object' && orientation !== null && typeof (orientation as Record<string, unknown>).reversed === 'number'
      ? (orientation as Record<string, number>).reversed
      : 0;
  const totalReadings = typeof r.totalReadings === 'number' ? r.totalReadings : 0;
  return { cardCount, orientation: { upright, reversed }, totalReadings };
}

/** 从 localStorage 读取统计 */
export function loadStats(storage?: Pick<Storage, 'getItem'>): TarotStats {
  if (typeof window === 'undefined') {return emptyStats();}
  try {
    return sanitizeStats(JSON.parse((storage ?? window.localStorage).getItem(STATS_KEY) ?? ''));
  } catch {
    return emptyStats();
  }
}

/** 写入 localStorage */
export function saveStats(stats: TarotStats, storage?: Pick<Storage, 'setItem'>): void {
  if (typeof window === 'undefined') {return;}
  try {
    (storage ?? window.localStorage).setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // 静默降级
  }
}

/** 统计出现次数最多的 top N 牌（返回 [{cardId, count}]，降序） */
export function computeTopCards(stats: TarotStats, topN = 3): Array<{ cardId: string; count: number }> {
  return Object.entries(stats.cardCount)
    .map(([cardId, count]) => ({ cardId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}
