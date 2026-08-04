import { getSpread, tarotDeck, tarotSpreads } from '@/mock/tarot';
import {
  buildAiReadingMessages,
  buildReadingEntries,
  buildReadingText,
  buildSpreadSummary,
  cutDeck,
  dailySeed,
  drawCards,
  filterTarotCards,
  getDailyCard,
  mulberry32,
  orientationLabel,
  randomCutPoint,
  shuffleDeck,
  toRomanNumeral,
} from '@/lib/tarot';
import type { DrawnCard } from '@/types/tarot';

describe('tarotDeck · 78 张牌数据完整性', () => {
  it('共 78 张：22 大阿尔克那 + 每花色 14 张小阿尔克那', () => {
    expect(tarotDeck).toHaveLength(78);
    expect(tarotDeck.filter((c) => c.arcana === 'major')).toHaveLength(22);
    for (const suit of ['wands', 'cups', 'swords', 'pentacles'] as const) {
      expect(tarotDeck.filter((c) => c.suit === suit)).toHaveLength(14);
    }
  });

  it('id 全局唯一', () => {
    const ids = tarotDeck.map((c) => c.id);
    expect(new Set(ids).size).toBe(78);
  });

  it('每张牌都有牌名、关键词与正逆位含义', () => {
    for (const card of tarotDeck) {
      expect(card.name.length).toBeGreaterThan(0);
      expect(card.nameEn.length).toBeGreaterThan(0);
      expect(card.keywords.length).toBeGreaterThan(0);
      expect(card.upright.length).toBeGreaterThan(0);
      expect(card.reversed.length).toBeGreaterThan(0);
      expect(card.glyph.length).toBeGreaterThan(0);
    }
  });

  it('宫廷牌带 court 等级，数字牌不带', () => {
    const courts = tarotDeck.filter((c) => c.court);
    expect(courts).toHaveLength(16);
    for (const c of courts) {
      expect(c.number).toBeGreaterThanOrEqual(11);
    }
  });

  it('小阿尔克那必有元素（火/水/风/土）', () => {
    const minor = tarotDeck.filter((c) => c.arcana === 'minor');
    expect(minor).toHaveLength(56);
    const validElements = ['火', '水', '风', '土'];
    for (const c of minor) {
      expect(c.element).toBeDefined();
      expect(validElements).toContain(c.element);
    }
  });

  it('花色与元素映射一致（权杖火/圣杯水/宝剑风/星币土）', () => {
    const expectElement = (suit: string, el: string) => {
      const cards = tarotDeck.filter((c) => c.suit === suit);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.every((c) => c.element === el)).toBe(true);
    };
    expectElement('wands', '火');
    expectElement('cups', '水');
    expectElement('swords', '风');
    expectElement('pentacles', '土');
  });

  it('大阿尔克那 22 张均有占星对应、无元素', () => {
    const major = tarotDeck.filter((c) => c.arcana === 'major');
    expect(major).toHaveLength(22);
    for (const c of major) {
      expect(c.astrology).toBeTruthy();
      expect(c.element).toBeUndefined();
    }
  });
});

describe('tarotSpreads · 牌阵', () => {
  it('单张 1 个牌位，三张 3 个牌位', () => {
    expect(getSpread('single').positions).toHaveLength(1);
    expect(getSpread('three').positions).toEqual(['过去', '现在', '未来']);
  });

  it('未知牌阵抛错', () => {
    expect(() => getSpread('celtic' as never)).toThrow();
  });

  it('tarotSpreads 列表包含全部两种牌阵', () => {
    expect(tarotSpreads.map((s) => s.type)).toEqual(['single', 'three']);
  });
});

describe('shuffleDeck · 洗牌', () => {
  it('不改动原数组，且元素集合不变', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const snapshot = [...input];
    const result = shuffleDeck(input);
    expect(input).toEqual(snapshot);
    expect([...result].sort((a, b) => a - b)).toEqual(snapshot);
  });

  it('注入固定 random 时结果确定', () => {
    const a = shuffleDeck(tarotDeck, () => 0.42);
    const b = shuffleDeck(tarotDeck, () => 0.42);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });
});

describe('drawCards · 抽牌', () => {
  it('抽取数量正确且牌不重复', () => {
    const drawn = drawCards(tarotDeck, 3);
    expect(drawn).toHaveLength(3);
    expect(new Set(drawn.map((d) => d.card.id)).size).toBe(3);
  });

  it('random 恒 0 时全部正位', () => {
    const drawn = drawCards(tarotDeck, 5, () => 0);
    expect(drawn.every((d) => !d.isReversed)).toBe(true);
  });

  it('random 恒 0.999 时全部逆位', () => {
    const drawn = drawCards(tarotDeck, 5, () => 0.999);
    expect(drawn.every((d) => d.isReversed)).toBe(true);
  });
});

describe('cutDeck · 切牌', () => {
  it('从切点旋转：前半段接到后半段后面', () => {
    const deck = [1, 2, 3, 4, 5];
    expect(cutDeck(deck, 3)).toEqual([4, 5, 1, 2, 3]);
    expect(cutDeck(deck, 1)).toEqual([2, 3, 4, 5, 1]);
  });

  it('切点 0 或越界时安全处理', () => {
    const deck = [1, 2, 3];
    expect(cutDeck(deck, 0)).toEqual([1, 2, 3]);
    expect(cutDeck(deck, 5)).toEqual([3, 1, 2]); // 5 % 3 = 2
    expect(cutDeck(deck, -1)).toEqual([3, 1, 2]); // 负数归一化
  });

  it('不改原数组，元素集合不变', () => {
    const deck = [1, 2, 3, 4, 5, 6];
    const snapshot = [...deck];
    const result = cutDeck(deck, 4);
    expect(deck).toEqual(snapshot);
    expect([...result].sort()).toEqual(snapshot);
  });
});

describe('randomCutPoint · 随机切牌点', () => {
  it('范围在 1..n-1（保证牌序确实变化）', () => {
    for (let i = 0; i < 50; i++) {
      const p = randomCutPoint(78);
      expect(p).toBeGreaterThanOrEqual(1);
      expect(p).toBeLessThan(78);
    }
  });

  it('n < 2 时返回 0', () => {
    expect(randomCutPoint(1)).toBe(0);
    expect(randomCutPoint(0)).toBe(0);
  });
});

describe('filterTarotCards · 牌义搜索', () => {
  it('空查询返回全部牌', () => {
    expect(filterTarotCards(tarotDeck, '  ')).toHaveLength(78);
  });

  it('按中文名匹配', () => {
    const hits = filterTarotCards(tarotDeck, '月亮');
    expect(hits).toHaveLength(1);
    expect(hits[0].name).toBe('月亮');
  });

  it('按英文名匹配（大小写不敏感）', () => {
    const hits = filterTarotCards(tarotDeck, 'tower');
    expect(hits).toHaveLength(1);
    expect(hits[0].nameEn).toBe('The Tower');
  });

  it('按关键词匹配（如「灵感」命中权杖一与星星）', () => {
    const hits = filterTarotCards(tarotDeck, '灵感');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((c) => c.keywords.some((kw) => kw.includes('灵感')))).toBe(true);
    expect(hits.map((c) => c.id).sort()).toEqual(
      ['star', 'wands-01'].sort()
    );
  });
});

describe('toRomanNumeral · 罗马数字', () => {
  it('覆盖大阿尔克那 0-21', () => {
    expect(toRomanNumeral(0)).toBe('0');
    expect(toRomanNumeral(4)).toBe('IV');
    expect(toRomanNumeral(9)).toBe('IX');
    expect(toRomanNumeral(11)).toBe('XI');
    expect(toRomanNumeral(13)).toBe('XIII');
    expect(toRomanNumeral(21)).toBe('XXI');
  });

  it('表外数字回退为字符串', () => {
    expect(toRomanNumeral(99)).toBe('99');
  });
});

describe('buildReadingEntries · 预设解读', () => {
  const drawn: DrawnCard[] = [
    { card: tarotDeck[0], isReversed: false },
    { card: tarotDeck[1], isReversed: true },
    { card: tarotDeck[2], isReversed: false },
  ];

  it('三张牌阵按牌位生成带语境的文案', () => {
    const entries = buildReadingEntries(drawn, getSpread('three'));
    expect(entries.map((e) => e.position)).toEqual(['过去', '现在', '未来']);
    expect(entries[0].text).toContain('过去的影响');
    expect(entries[1].text).toContain('当下的状态');
    expect(entries[2].text).toContain('未来的走向');
    // 逆位牌使用逆位含义
    expect(entries[1].text).toContain(tarotDeck[1].reversed);
  });

  it('单张牌阵直接使用牌义原文', () => {
    const entries = buildReadingEntries([drawn[0]], getSpread('single'));
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe(tarotDeck[0].upright);
  });

  it('orientationLabel 返回正位/逆位', () => {
    expect(orientationLabel(false)).toBe('正位');
    expect(orientationLabel(true)).toBe('逆位');
  });
});

describe('dailySeed / mulberry32 / getDailyCard · 每日一牌', () => {
  it('同一天种子与抽牌结果确定', () => {
    const d1 = new Date(2026, 7, 4, 10, 30);
    const d2 = new Date(2026, 7, 4, 23, 59);
    expect(dailySeed(d1)).toBe(dailySeed(d2));
    expect(getDailyCard(tarotDeck, d1)).toEqual(getDailyCard(tarotDeck, d2));
  });

  it('不同日期种子不同', () => {
    const a = dailySeed(new Date(2026, 7, 4));
    const b = dailySeed(new Date(2026, 7, 5));
    expect(a).not.toBe(b);
  });

  it('mulberry32 同种子序列相同、范围在 [0,1)', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    const seq1 = Array.from({ length: 5 }, () => r1());
    const seq2 = Array.from({ length: 5 }, () => r2());
    expect(seq1).toEqual(seq2);
    for (const v of seq1) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('getDailyCard 返回合法结构（牌在牌堆中，朝向为布尔）', () => {
    const daily = getDailyCard(tarotDeck, new Date(2026, 7, 4));
    expect(tarotDeck.some((c) => c.id === daily.card.id)).toBe(true);
    expect(typeof daily.isReversed).toBe('boolean');
  });
});

describe('buildAiReadingMessages · AI prompt 构建', () => {
  const drawn: DrawnCard[] = [{ card: tarotDeck[18], isReversed: true }]; // 月亮 逆位

  it('包含 system 人设与 user 上下文两条消息', () => {
    const messages = buildAiReadingMessages('最近的工作会顺利吗？', getSpread('single'), drawn);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
  });

  it('user 消息包含问题、牌阵、牌名与朝向', () => {
    const messages = buildAiReadingMessages('最近的工作会顺利吗？', getSpread('single'), drawn);
    const user = messages[1].content;
    expect(user).toContain('最近的工作会顺利吗？');
    expect(user).toContain(getSpread('single').name);
    expect(user).toContain(tarotDeck[18].name);
    expect(user).toContain('逆位');
  });

  it('问题为空时使用综合解读话术', () => {
    const messages = buildAiReadingMessages('   ', getSpread('single'), drawn);
    expect(messages[1].content).toContain('综合解读');
  });
});

describe('buildAiReadingMessages · 多张牌阵提示强化', () => {
  const three: DrawnCard[] = [
    { card: tarotDeck[0], isReversed: false },
    { card: tarotDeck[1], isReversed: true },
    { card: tarotDeck[2], isReversed: false },
  ];

  it('三张牌阵的 system prompt 追加串联解读要求', () => {
    const messages = buildAiReadingMessages('', getSpread('three'), three);
    expect(messages[0].content).toContain('按牌位顺序串联解读');
    expect(messages[0].content).toContain('避免逐张孤立分析');
  });

  it('单张牌阵不追加串联要求', () => {
    const messages = buildAiReadingMessages('', getSpread('single'), [three[0]]);
    expect(messages[0].content).not.toContain('串联解读');
  });
});

describe('buildSpreadSummary · 整体联动文案', () => {
  const three: DrawnCard[] = [
    { card: tarotDeck[0], isReversed: false }, // 愚者
    { card: tarotDeck[1], isReversed: true }, // 魔术师 逆位
    { card: tarotDeck[2], isReversed: false }, // 女祭司
  ];

  it('三张牌阵返回包含三张牌名的联动文案', () => {
    const summary = buildSpreadSummary(three);
    expect(summary).not.toBeNull();
    expect(summary).toContain('愚者');
    expect(summary).toContain('魔术师');
    expect(summary).toContain('女祭司');
  });

  it('逆位牌会被点名提醒', () => {
    const summary = buildSpreadSummary(three);
    expect(summary).toContain('逆位');
    expect(summary).toContain('魔术师');
  });

  it('单张牌阵返回 null', () => {
    expect(buildSpreadSummary([three[0]])).toBeNull();
  });
});

describe('buildReadingText · 解读汇总文本', () => {
  const three: DrawnCard[] = [
    { card: tarotDeck[18], isReversed: true }, // 月亮
    { card: tarotDeck[19], isReversed: false }, // 太阳
  ];

  it('包含问题、牌阵、牌名、朝向与免责声明', () => {
    const text = buildReadingText('最近的工作会顺利吗？', getSpread('three'), three);
    expect(text).toContain('最近的工作会顺利吗？');
    expect(text).toContain(getSpread('three').name);
    expect(text).toContain('月亮');
    expect(text).toContain('逆位');
    expect(text).toContain('太阳');
    expect(text).toContain('正位');
    expect(text).toContain('仅供娱乐与自我觉察参考');
  });

  it('问题为空时不含问题行', () => {
    const text = buildReadingText('  ', getSpread('single'), [three[0]]);
    expect(text).not.toContain('问题：');
  });

  it('传入 AI 解读时追加 AI 段落', () => {
    const text = buildReadingText('', getSpread('single'), [three[0]], 'AI 生成的解读内容');
    expect(text).toContain('【AI 深度解读】');
    expect(text).toContain('AI 生成的解读内容');
  });
});
