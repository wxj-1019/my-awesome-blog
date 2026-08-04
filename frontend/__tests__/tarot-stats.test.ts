import { addStats, computeTopCards, emptyStats, sanitizeStats } from '@/lib/tarot-stats';
import { tarotDeck } from '@/mock/tarot';
import type { DrawnCard } from '@/types/tarot';

const moon = tarotDeck.find((c) => c.id === 'moon')!;
const sun = tarotDeck.find((c) => c.id === 'sun')!;
const fool = tarotDeck.find((c) => c.id === 'fool')!;

function drawn(card: typeof moon, isReversed: boolean): DrawnCard {
  return { card, isReversed };
}

describe('addStats · 并入抽牌结果', () => {
  it('累计牌次数与正逆位、占卜次数', () => {
    let stats = emptyStats();
    stats = addStats(stats, [drawn(moon, true), drawn(sun, false)]);
    expect(stats.cardCount['moon']).toBe(1);
    expect(stats.cardCount['sun']).toBe(1);
    expect(stats.orientation).toEqual({ upright: 1, reversed: 1 });
    expect(stats.totalReadings).toBe(1);

    stats = addStats(stats, [drawn(moon, false)]);
    expect(stats.cardCount['moon']).toBe(2);
    expect(stats.orientation).toEqual({ upright: 2, reversed: 1 });
    expect(stats.totalReadings).toBe(2);
  });

  it('不修改原对象（不可变）', () => {
    const base = emptyStats();
    const next = addStats(base, [drawn(fool, false)]);
    expect(base.cardCount).toEqual({});
    expect(next.cardCount['fool']).toBe(1);
  });
});

describe('sanitizeStats · 校验', () => {
  it('非法输入返回空统计', () => {
    expect(sanitizeStats(null)).toEqual(emptyStats());
    expect(sanitizeStats('str')).toEqual(emptyStats());
    expect(sanitizeStats({})).toEqual(emptyStats());
  });

  it('过滤不存在的 cardId 与非数字计数', () => {
    const cleaned = sanitizeStats({
      cardCount: { moon: 2, ghost: 1, sun: 'bad' },
      orientation: { upright: 1, reversed: 1 },
      totalReadings: 2,
    });
    expect(cleaned.cardCount).toEqual({ moon: 2 });
    expect(cleaned.totalReadings).toBe(2);
  });
});

describe('computeTopCards · 高频牌', () => {
  it('按出现次数降序返回 top N', () => {
    let stats = emptyStats();
    stats = addStats(stats, [drawn(moon, true), drawn(sun, false)]);
    stats = addStats(stats, [drawn(moon, false), drawn(fool, false)]);
    stats = addStats(stats, [drawn(moon, true)]);

    const top = computeTopCards(stats, 2);
    expect(top[0]).toEqual({ cardId: 'moon', count: 3 });
    expect(top[1].cardId).toMatch(/^(sun|fool)$/);
  });

  it('无数据返回空数组', () => {
    expect(computeTopCards(emptyStats())).toEqual([]);
  });
});
