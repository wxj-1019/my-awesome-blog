import { addHistoryEntry, loadHistory, parseHistory, sanitizeEntry, HISTORY_MAX } from '@/lib/tarot-history';
import type { TarotHistoryEntry } from '@/lib/tarot-history';

function makeEntry(overrides: Partial<TarotHistoryEntry> = {}): TarotHistoryEntry {
  return {
    id: 'e1',
    question: '今天运势如何？',
    spreadType: 'single',
    drawn: [{ cardId: 'moon', isReversed: true }],
    createdAt: 1700000000000,
    ...overrides,
  };
}

describe('sanitizeEntry · 历史条目校验', () => {
  it('合法条目原样通过', () => {
    const entry = makeEntry();
    expect(sanitizeEntry(entry)).toEqual(entry);
  });

  it('缺字段/非对象返回 null', () => {
    expect(sanitizeEntry(null)).toBeNull();
    expect(sanitizeEntry('str')).toBeNull();
    expect(sanitizeEntry({ ...makeEntry(), id: 123 })).toBeNull();
    expect(sanitizeEntry({ ...makeEntry(), question: 1 })).toBeNull();
    expect(sanitizeEntry({ ...makeEntry(), spreadType: 'celtic' })).toBeNull();
    expect(sanitizeEntry({ ...makeEntry(), drawn: 'not-array' })).toBeNull();
  });

  it('过滤不存在的 cardId 与非法朝向', () => {
    const entry = sanitizeEntry({
      ...makeEntry(),
      drawn: [
        { cardId: 'moon', isReversed: true },
        { cardId: 'not-a-card', isReversed: false },
        { cardId: 'sun', isReversed: 'yes' },
      ],
    });
    expect(entry).not.toBeNull();
    expect(entry!.drawn).toEqual([{ cardId: 'moon', isReversed: true }]);
  });

  it('drawn 全被过滤后返回 null', () => {
    expect(sanitizeEntry({ ...makeEntry(), drawn: [{ cardId: 'ghost', isReversed: false }] })).toBeNull();
  });
});

describe('parseHistory · localStorage 解析', () => {
  it('空值/非法 JSON/非数组返回 []', () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory('')).toEqual([]);
    expect(parseHistory('{bad json')).toEqual([]);
    expect(parseHistory('"str"')).toEqual([]);
    expect(parseHistory('42')).toEqual([]);
  });

  it('解析合法数组并过滤脏条目', () => {
    const raw = JSON.stringify([
      makeEntry({ id: 'e1' }),
      { broken: true },
      makeEntry({ id: 'e2', drawn: [{ cardId: 'star', isReversed: false }] }),
    ]);
    const entries = parseHistory(raw);
    expect(entries.map((e) => e.id)).toEqual(['e1', 'e2']);
  });
});

describe('loadHistory · localStorage 读取', () => {
  it('storage.getItem 抛异常时 loadHistory 降级为空数组', () => {
    const broken: Pick<Storage, 'getItem'> = {
      getItem() { throw new Error('SecurityError: The operation is insecure.'); },
    };
    expect(loadHistory(broken)).toEqual([]);
  });

  it('读取正常时返回解析后的历史', () => {
    const storage: Pick<Storage, 'getItem'> = {
      getItem: () => JSON.stringify([makeEntry({ id: 'e1' })]),
    };
    expect(loadHistory(storage).map((e) => e.id)).toEqual(['e1']);
  });
});

describe('addHistoryEntry · 插入与上限', () => {
  it('新条目插入头部', () => {
    const old = makeEntry({ id: 'old' });
    const next = addHistoryEntry([old], makeEntry({ id: 'new' }));
    expect(next.map((e) => e.id)).toEqual(['new', 'old']);
  });

  it('超过上限截断', () => {
    const many = Array.from({ length: HISTORY_MAX }, (_, i) => makeEntry({ id: `e${i}` }));
    const next = addHistoryEntry(many, makeEntry({ id: 'newest' }));
    expect(next).toHaveLength(HISTORY_MAX);
    expect(next[0].id).toBe('newest');
    expect(next.some((e) => e.id === 'e19')).toBe(false);
  });
});
