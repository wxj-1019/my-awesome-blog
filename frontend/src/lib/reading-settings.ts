/**
 * 文章阅读设置：字号 / 行距 / 字距 / 字体，持久化到 localStorage。
 *
 * 范式与 lib/image-gen-history.ts 一致：纯函数 + 注入 storage（便于单测）、
 * SSR 守卫、脏数据 sanitize、try/catch 静默降级。
 */

export type ReadingFontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type ReadingLineHeight = 'compact' | 'comfortable' | 'relaxed';
export type ReadingLetterSpacing = 'normal' | 'wide';
export type ReadingFontFamily = 'serif' | 'sans';

export interface ReadingSettings {
  fontSize: ReadingFontSize;
  lineHeight: ReadingLineHeight;
  letterSpacing: ReadingLetterSpacing;
  fontFamily: ReadingFontFamily;
}

export const READING_SETTINGS_KEY = 'reading_settings_v1';

/** 默认设置：与现网正文视觉一致（17px / 1.8 / 0.02em / 思源宋体） */
export const DEFAULT_READING_SETTINGS: ReadingSettings = {
  fontSize: 'medium',
  lineHeight: 'comfortable',
  letterSpacing: 'normal',
  fontFamily: 'serif',
};

const FONT_SIZES: ReadingFontSize[] = ['small', 'medium', 'large', 'xlarge'];
const LINE_HEIGHTS: ReadingLineHeight[] = ['compact', 'comfortable', 'relaxed'];
const LETTER_SPACINGS: ReadingLetterSpacing[] = ['normal', 'wide'];
const FONT_FAMILIES: ReadingFontFamily[] = ['serif', 'sans'];

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/** 校验外部数据（localStorage 内容不可信）：逐字段类型守卫，非法回默认值 */
export function sanitizeSettings(raw: unknown): ReadingSettings {
  if (typeof raw !== 'object' || raw === null) {
    return { ...DEFAULT_READING_SETTINGS };
  }
  const obj = raw as Record<string, unknown>;
  return {
    fontSize: isOneOf(obj.fontSize, FONT_SIZES) ? obj.fontSize : DEFAULT_READING_SETTINGS.fontSize,
    lineHeight: isOneOf(obj.lineHeight, LINE_HEIGHTS) ? obj.lineHeight : DEFAULT_READING_SETTINGS.lineHeight,
    letterSpacing: isOneOf(obj.letterSpacing, LETTER_SPACINGS) ? obj.letterSpacing : DEFAULT_READING_SETTINGS.letterSpacing,
    fontFamily: isOneOf(obj.fontFamily, FONT_FAMILIES) ? obj.fontFamily : DEFAULT_READING_SETTINGS.fontFamily,
  };
}

/** 读取设置（SSR 或解析失败时回默认值） */
export function loadReadingSettings(
  storage?: Pick<Storage, 'getItem'>
): ReadingSettings {
  if (typeof window === 'undefined' && !storage) {
    return { ...DEFAULT_READING_SETTINGS };
  }
  try {
    const store = storage ?? window.localStorage;
    const raw = store.getItem(READING_SETTINGS_KEY);
    if (!raw) {
      return { ...DEFAULT_READING_SETTINGS };
    }
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_READING_SETTINGS };
  }
}

/** 保存设置（写入失败静默降级） */
export function saveReadingSettings(
  settings: ReadingSettings,
  storage?: Pick<Storage, 'setItem'>
): void {
  try {
    const store = storage ?? window.localStorage;
    store.setItem(READING_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage 不可用（隐私模式/配额）时静默降级，仅本次会话生效
  }
}
