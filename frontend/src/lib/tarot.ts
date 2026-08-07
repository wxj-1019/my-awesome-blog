/**
 * 塔罗占卜纯函数库（/tools/tarot）
 * 全部可注入 random 以便单测；不含任何 UI 依赖。
 */

import type { DrawnCard, ReadingEntry, TarotCard, TarotSpread } from '@/types/tarot';

/** Fisher-Yates 洗牌，返回新数组（不改原数组） */
export function shuffleDeck<T>(deck: readonly T[], random: () => number = Math.random): T[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 从牌堆抽 count 张牌（从顶部取），每张 50% 概率逆位。
 * random < 0.5 视为正位，>= 0.5 逆位（与单测注入的固定值对应）。
 */
export function drawCards(
  deck: readonly TarotCard[],
  count: number,
  random: () => number = Math.random
): DrawnCard[] {
  const shuffled = shuffleDeck(deck, random);
  return shuffled.slice(0, count).map((card) => ({
    card,
    isReversed: random() >= 0.5,
  }));
}

/** 牌面朝向文案 */
export function orientationLabel(isReversed: boolean): '正位' | '逆位' {
  return isReversed ? '逆位' : '正位';
}

/** 罗马数字（大阿尔克那 0-21 用） */
export function toRomanNumeral(n: number): string {
  const table: Array<[number, string]> = [
    [21, 'XXI'], [20, 'XX'], [19, 'XIX'], [18, 'XVIII'], [17, 'XVII'],
    [16, 'XVI'], [15, 'XV'], [14, 'XIV'], [13, 'XIII'], [12, 'XII'],
    [11, 'XI'], [10, 'X'], [9, 'IX'], [8, 'VIII'], [7, 'VII'],
    [6, 'VI'], [5, 'V'], [4, 'IV'], [3, 'III'], [2, 'II'], [1, 'I'],
    [0, '0'],
  ];
  const hit = table.find(([value]) => value === n);
  return hit ? hit[1] : String(n);
}

/**
 * 切牌：把牌堆从 cutPoint 处切开，上下两叠互换叠回。
 * 返回新数组（不改原数组）；cutPoint 在 1..n-1 之间才有实际意义。
 */
export function cutDeck<T>(deck: readonly T[], cutPoint: number): T[] {
  const n = deck.length;
  if (n === 0) {return [];}
  const k = ((cutPoint % n) + n) % n;
  if (k === 0) {return [...deck];}
  return [...deck.slice(k), ...deck.slice(0, k)];
}

/** 随机切牌点（1..n-1，保证牌序确实变化） */
export function randomCutPoint(n: number, random: () => number = Math.random): number {
  if (n < 2) {return 0;}
  return 1 + Math.floor(random() * (n - 1));
}

/** 牌义速查搜索：匹配中文名、英文名、关键词（大小写不敏感） */
export function filterTarotCards(
  cards: readonly TarotCard[],
  query: string
): TarotCard[] {
  const q = query.trim().toLowerCase();
  if (!q) {return [...cards];}
  return cards.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.keywords.some((kw) => kw.toLowerCase().includes(q))
  );
}

/** 从日期生成确定性种子（FNV-1a 32 位哈希，基于本地年月日） */
export function dailySeed(date: Date): number {
  const s = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 伪随机数发生器（种子确定 → 序列确定） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 每日一牌：同一天结果确定（含正逆位，由种子随机流决定） */
export function getDailyCard(deck: readonly TarotCard[], date: Date): DrawnCard {
  const rand = mulberry32(dailySeed(date));
  const shuffled = shuffleDeck(deck, rand);
  return { card: shuffled[0], isReversed: rand() >= 0.5 };
}

/** 牌位语境：把牌义套进牌位，生成一句结合解读 */
function positionContext(position: string, drawn: DrawnCard): string {
  const meaning = drawn.isReversed ? drawn.card.reversed : drawn.card.upright;
  switch (position) {
    case '过去':
      return `过去的影响：${meaning}`;
    case '现在':
      return `当下的状态：${meaning}`;
    case '未来':
      return `未来的走向：${meaning}`;
    default:
      return meaning;
  }
}

/** 生成预设解读条目（无需网络，本地即时可用） */
export function buildReadingEntries(drawn: DrawnCard[], spread: TarotSpread): ReadingEntry[] {
  return drawn.map((d, i) => {
    const position = spread.positions[i] ?? spread.name;
    return {
      position,
      drawn: d,
      text: positionContext(position, d),
    };
  });
}

/** AI 解读使用的消息结构（与 LLMChatRequest.messages 对齐） */
export interface TarotChatMessage {
  role: 'system' | 'user';
  content: string;
}

/** 塔罗解读师 system prompt */
const TAROT_SYSTEM_PROMPT = [
  '你是一位温和而专业的塔罗解读师，熟悉韦特塔罗体系。',
  '解读要求：',
  '1. 结合每张牌的牌位、正逆位含义与用户的问题进行个性化解读，不要复述牌义模板。',
  '2. 语气温暖、具体、有建设性；避免宿命论与恐吓式表述。',
  '3. 结构：先总述牌面能量（1-2 句），再逐牌解读，最后给出一条可执行的建议。',
  '4. 篇幅控制在 150 字以内，使用简体中文。',
  '5. 结尾附一句「仅供娱乐与自我觉察参考」。',
].join('\n');

/** 多张牌阵时追加的串联解读要求 */
const TAROT_SYSTEM_SPREAD_EXTRA = [
  '',
  '本牌阵包含多张牌：请按牌位顺序串联解读，说明各张牌之间的因果与演变关系，避免逐张孤立分析。',
].join('\n');

/** 构建 AI 深度解读的 messages（system + user 两条） */
export function buildAiReadingMessages(
  question: string,
  spread: TarotSpread,
  drawn: DrawnCard[]
): TarotChatMessage[] {
  const lines = drawn.map((d, i) => {
    const position = spread.positions[i] ?? spread.name;
    return `- ${position}：${d.card.name}（${d.card.nameEn}）${orientationLabel(d.isReversed)}`;
  });
  const userContent = [
    question.trim() ? `我的问题：${question.trim()}` : '我没有具体问题，请做一次综合解读。',
    `牌阵：${spread.name}`,
    '抽到的牌：',
    ...lines,
  ].join('\n');

  const system =
    spread.positions.length > 1 ? TAROT_SYSTEM_PROMPT + TAROT_SYSTEM_SPREAD_EXTRA : TAROT_SYSTEM_PROMPT;

  return [
    { role: 'system', content: system },
    { role: 'user', content: userContent },
  ];
}

/**
 * 多张牌阵的整体联动文案（基于牌位规则的模板化串联）。
 * 单张牌阵返回 null（无联动可言）。
 */
export function buildSpreadSummary(drawn: DrawnCard[]): string | null {
  if (drawn.length < 3) {return null;}
  const [past, present, future] = drawn;
  const kw = (d: DrawnCard) => d.card.keywords.slice(0, 2).join('、');
  const parts: string[] = [];
  parts.push(
    `${past.card.name}（${orientationLabel(past.isReversed)}）的「${kw(past)}」局面，正在演变为${present.card.name}（${orientationLabel(present.isReversed)}）所代表的「${kw(present)}」状态。`
  );
  parts.push(
    `若顺应这个趋势，发展将导向${future.card.name}（${orientationLabel(future.isReversed)}）预示的「${kw(future)}」。`
  );
  const reversed = drawn.filter((d) => d.isReversed);
  if (reversed.length > 0) {
    parts.push(
      `其中「${reversed.map((d) => d.card.name).join('、')}」为逆位，提示这一环需要额外留意与调整。`
    );
  }
  return parts.join('\n');
}

/** 解读汇总文本（复制/导出用） */
export function buildReadingText(
  question: string,
  spread: TarotSpread,
  drawn: DrawnCard[],
  aiText = ''
): string {
  const lines: string[] = [];
  lines.push(`【塔罗占卜 · ${spread.name}】`);
  if (question.trim()) {lines.push(`问题：${question.trim()}`);}
  // 注意：不用 for...of entries()——ts-jest 降级后迭代器无 length 会跳过循环
  drawn.forEach((d, i) => {
    const position = spread.positions[i] ?? `第 ${i + 1} 张`;
    const meaning = d.isReversed ? d.card.reversed : d.card.upright;
    lines.push('');
    lines.push(`${position}：${d.card.name}（${d.card.nameEn}）${orientationLabel(d.isReversed)}`);
    lines.push(`关键词：${d.card.keywords.join('、')}`);
    lines.push(meaning);
  });
  const summary = buildSpreadSummary(drawn);
  if (summary) {
    lines.push('');
    lines.push('【整体联动】');
    lines.push(summary);
  }
  if (aiText.trim()) {
    lines.push('');
    lines.push('【AI 深度解读】');
    lines.push(aiText.trim());
  }
  lines.push('');
  lines.push('—— 塔罗仅供娱乐与自我觉察参考');
  return lines.join('\n');
}
