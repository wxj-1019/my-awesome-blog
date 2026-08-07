import {
  addHistoryEntry,
  deleteHistoryEntry,
  loadHistory,
  parseHistory,
  sanitizeEntry,
  saveHistory,
  HISTORY_MAX,
} from '@/lib/image-gen-history';
import type { GenHistoryEntry } from '@/lib/image-gen-history';

function makeEntry(overrides: Partial<GenHistoryEntry> = {}): GenHistoryEntry {
  return {
    id: 'e1',
    createdAt: 1700000000000,
    kind: 'image',
    prompt: '月光下的静谧湖泊',
    images: ['https://cdn.example.com/a.png'],
    videoUrl: null,
    refImageUrl: null,
    ...overrides,
  };
}

describe('sanitizeEntry · 历史条目校验', () => {
  it('合法图片条目原样通过', () => {
    const entry = makeEntry();
    expect(sanitizeEntry(entry)).toEqual(entry);
  });

  it('合法视频条目原样通过', () => {
    const entry = makeEntry({
      id: 'v1',
      kind: 'video',
      images: [],
      videoUrl: 'https://cdn.example.com/clip.mp4',
    });
    expect(sanitizeEntry(entry)).toEqual(entry);
  });

  it('缺字段/非对象/非法 kind 返回 null', () => {
    expect(sanitizeEntry(null)).toBeNull();
    expect(sanitizeEntry('str')).toBeNull();
    expect(sanitizeEntry({ ...makeEntry(), id: 123 })).toBeNull();
    expect(sanitizeEntry({ ...makeEntry(), prompt: 1 })).toBeNull();
    expect(sanitizeEntry({ ...makeEntry(), kind: 'audio' })).toBeNull();
    expect(sanitizeEntry({ ...makeEntry(), createdAt: 'now' })).toBeNull();
    expect(sanitizeEntry({ ...makeEntry(), images: 'not-array' })).toBeNull();
    expect(sanitizeEntry({ ...makeEntry(), images: [123] })).toBeNull();
  });

  it('可选字段 size/count/videoUrl 规范化', () => {
    const entry = sanitizeEntry({
      ...makeEntry(),
      size: '1024x1024',
      count: 4,
      videoUrl: 'https://cdn.example.com/x.mp4',
    });
    expect(entry).not.toBeNull();
    expect(entry!.size).toBe('1024x1024');
    expect(entry!.count).toBe(4);
    expect(entry!.videoUrl).toBe('https://cdn.example.com/x.mp4');

    // 类型不符的可选字段回落为 undefined/null
    const dirty = sanitizeEntry({ ...makeEntry(), size: 42, count: '2', videoUrl: 7 });
    expect(dirty).not.toBeNull();
    expect(dirty!.size).toBeUndefined();
    expect(dirty!.count).toBeUndefined();
    expect(dirty!.videoUrl).toBeNull();
  });

  it('sanitizeEntry 兼容旧数据（无 refImageUrl → null）', () => {
    const old = {
      id: 'e1',
      createdAt: 1,
      kind: 'image',
      prompt: '月光',
      images: ['https://cdn/x.png'],
      videoUrl: null,
    };
    expect(sanitizeEntry(old)?.refImageUrl).toBeNull();
  });

  it('sanitizeEntry 保留合法 refImageUrl', () => {
    const entry = {
      id: 'e2',
      createdAt: 1,
      kind: 'image',
      prompt: '月光',
      images: ['https://cdn/x.png'],
      videoUrl: null,
      refImageUrl: 'https://cdn/ref.png',
    };
    expect(sanitizeEntry(entry)?.refImageUrl).toBe('https://cdn/ref.png');
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
      makeEntry({ id: 'v2', kind: 'video', images: [], videoUrl: 'https://cdn.example.com/b.mp4' }),
    ]);
    const entries = parseHistory(raw);
    expect(entries.map((e) => e.id)).toEqual(['e1', 'v2']);
    expect(entries[1].videoUrl).toBe('https://cdn.example.com/b.mp4');
  });
});

describe('loadHistory / saveHistory · localStorage 读写', () => {
  it('getItem 抛异常时 loadHistory 降级为空数组', () => {
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

  it('saveHistory 写入 JSON；setItem 抛异常时静默降级', () => {
    const calls: string[] = [];
    const storage: Pick<Storage, 'setItem'> = {
      setItem: (key, value) => { calls.push(`${key}:${value}`); },
    };
    saveHistory([makeEntry()], storage);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('image_gen_history_v1');
    expect(calls[0]).toContain('月光下的静谧湖泊');

    const broken: Pick<Storage, 'setItem'> = {
      setItem() { throw new Error('QuotaExceededError'); },
    };
    expect(() => saveHistory([makeEntry()], broken)).not.toThrow();
  });
});

describe('addHistoryEntry · 插入与上限', () => {
  it('新条目插入头部', () => {
    const old = makeEntry({ id: 'old' });
    const next = addHistoryEntry([old], makeEntry({ id: 'new' }));
    expect(next.map((e) => e.id)).toEqual(['new', 'old']);
  });

  it('超过上限截断（不修改入参）', () => {
    const many = Array.from({ length: HISTORY_MAX }, (_, i) => makeEntry({ id: `e${i}` }));
    const next = addHistoryEntry(many, makeEntry({ id: 'newest' }));
    expect(next).toHaveLength(HISTORY_MAX);
    expect(next[0].id).toBe('newest');
    // 最旧的 e29（第 30 条）被丢弃
    expect(next.some((e) => e.id === 'e29')).toBe(false);
    expect(many).toHaveLength(HISTORY_MAX); // 纯函数：入参不变
  });
});

describe('deleteHistoryEntry · 删除', () => {
  it('按 id 删除指定条目', () => {
    const entries = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' }), makeEntry({ id: 'c' })];
    const next = deleteHistoryEntry(entries, 'b');
    expect(next.map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('删除不存在的 id 返回原列表', () => {
    const entries = [makeEntry({ id: 'a' })];
    expect(deleteHistoryEntry(entries, 'zzz')).toEqual(entries);
  });
});
