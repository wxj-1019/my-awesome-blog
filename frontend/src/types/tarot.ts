/**
 * 塔罗牌类型定义（/tools/tarot）
 * 78 张韦特体系：22 大阿尔克那 + 56 小阿尔克那
 */

/** 大/小阿尔克那 */
export type TarotArcana = 'major' | 'minor';

/** 小阿尔克那四花色：权杖(火) / 圣杯(水) / 宝剑(风) / 星币(土) */
export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles';

/** 四元素（小阿尔克那按花色固定映射） */
export type TarotElement = '火' | '水' | '风' | '土';

/** 宫廷牌等级 */
export type TarotCourt = 'page' | 'knight' | 'queen' | 'king';

/** 一张塔罗牌（静态数据） */
export interface TarotCard {
  /** 唯一标识，如 'fool'、'wands-ace'、'cups-king' */
  id: string;
  /** 中文牌名，如「愚者」「圣杯二」 */
  name: string;
  /** 英文牌名 */
  nameEn: string;
  arcana: TarotArcana;
  /** 仅小阿尔克那有花色 */
  suit?: TarotSuit;
  /**
   * 序号：大阿尔克那 0-21（牌面显示罗马数字）；
   * 小阿尔克那数字牌 1-10，宫廷牌 11-14
   */
  number: number;
  /** 仅宫廷牌有等级 */
  court?: TarotCourt;
  /** 中央 SVG 符号标识（牌面渲染用），大阿尔克那每牌一个，小牌用花色符号 */
  glyph: string;
  /** 关键词（正位），2-4 个 */
  keywords: string[];
  /** 正位含义（1-2 句） */
  upright: string;
  /** 逆位含义（1-2 句） */
  reversed: string;
  /** 元素（小阿尔克那按花色映射；大阿尔克那留空） */
  element?: TarotElement;
  /** 占星对应（大阿尔克那 22 条；小阿尔克那留空） */
  astrology?: string;
}

/** 牌阵类型 */
export type SpreadType = 'single' | 'three';

/** 牌阵定义 */
export interface TarotSpread {
  type: SpreadType;
  /** 牌阵名，如「每日指引」 */
  name: string;
  description: string;
  /** 牌位标签，长度即抽牌数 */
  positions: string[];
}

/** 一次抽牌结果（含正逆位） */
export interface DrawnCard {
  card: TarotCard;
  /** true = 逆位 */
  isReversed: boolean;
}

/** 占卜流程阶段 */
export type TarotPhase = 'ask' | 'shuffling' | 'cutting' | 'drawing' | 'revealing';

/** 预设解读条目（牌位 + 牌 + 文案） */
export interface ReadingEntry {
  /** 牌位标签，如「过去」；单张时为牌阵名 */
  position: string;
  drawn: DrawnCard;
  /** 结合牌位的一句话解读 */
  text: string;
}
