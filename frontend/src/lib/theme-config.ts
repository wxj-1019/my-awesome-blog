/**
 * 主题运行时配置（单一入口）
 *
 * - Mode 状态：ThemeProvider（context/theme-context.tsx）
 * - 色值权威：styles/base/variables.css
 * - 约定文档：docs/theme-tokens.md、docs/theme-audit.md
 *
 * FOUC 内联脚本与 Provider 必须共用 STORAGE_KEY。
 */

/** localStorage key — 与 layout.tsx FOUC 脚本保持一致 */
export const THEME_STORAGE_KEY = 'theme';

/** 用户可选 mode */
export type ThemeMode = 'light' | 'dark' | 'auto';

/** 解析后的实际 mode */
export type ResolvedMode = 'light' | 'dark';

/** 未来皮肤包 id（当前仅 default，勿在业务里硬编码分支） */
export type ThemePackId = 'default';

export const DEFAULT_THEME_MODE: ThemeMode = 'auto';
export const DEFAULT_THEME_PACK: ThemePackId = 'default';

/** theme-color meta 回退（优先读 CSS 变量 --background） */
export const THEME_COLOR_FALLBACK: Record<ResolvedMode, string> = {
  light: '#f8fafc',
  dark: '#0a0f1a',
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto';
}

/**
 * 读取当前文档上的语义色（canvas / chart / meta 用）
 */
export function readCssVar(
  name: string,
  fallback = ''
): string {
  if (typeof document === 'undefined') {
    return fallback;
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw || fallback;
}
