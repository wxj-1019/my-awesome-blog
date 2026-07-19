'use client';

import { useCallback, useMemo } from 'react';
import { useTheme } from '@/context/theme-context';

/**
 * 主题样式钩子（审查修复版）
 *
 * 历史问题：
 * 1. 返回的 themedClasses 键是 primary/secondary…，但业务侧用 cardBgClass/textClass…
 * 2. getThemeClass(LIGHT, DARK) 参数顺序与「dark 在前」约定相反
 * 3. 直接读 document.classList，主题切换后不会触发重渲染
 *
 * 现改为：订阅 ThemeContext.resolvedTheme，并导出业务实际使用的类名键。
 */
export interface ThemedClassesMap {
  /** 卡片/面板背景 */
  cardBgClass: string;
  /** 主文字 */
  textClass: string;
  /** 次要文字 */
  mutedTextClass: string;
  /** 下拉菜单背景 */
  dropdownBgClass: string;
  /** 下拉阴影 */
  dropdownShadowClass: string;
  /** 下拉项 hover */
  dropdownItemClass: string;
  /** 分隔线 */
  separatorClass: string;
  /** 菜单文字色 */
  textColorClass: string;
  /** 兼容旧 key（token 风格，仍保留） */
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  background: string;
  foreground: string;
  border: string;
  card: string;
}

export interface ThemedClassesResult {
  themedClasses: ThemedClassesMap;
  /** (darkClass, lightClass) — 暗色主题取第一个 */
  getThemeClass: (darkClass: string, lightClass: string) => string;
  isDark: boolean;
  resolvedTheme: 'light' | 'dark';
}

export function useThemedClasses(): ThemedClassesResult {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const getThemeClass = useCallback(
    (darkClass: string, lightClass: string): string => {
      return isDark ? darkClass : lightClass;
    },
    [isDark]
  );

  const themedClasses = useMemo<ThemedClassesMap>(() => {
    return {
      // —— 业务侧实际使用的键 ——
      cardBgClass: isDark
        ? 'bg-glass/40 border-glass-border'
        : 'bg-white/90 border-gray-200',
      textClass: isDark ? 'text-foreground' : 'text-gray-900',
      mutedTextClass: isDark ? 'text-foreground/60' : 'text-gray-600',
      dropdownBgClass: isDark
        ? 'bg-[#1a1a2e]/95 backdrop-blur-xl border border-glass-border'
        : 'bg-white/95 backdrop-blur-xl border border-gray-200',
      dropdownShadowClass: isDark
        ? 'shadow-2xl shadow-black/40'
        : 'shadow-xl shadow-gray-200/80',
      dropdownItemClass: isDark
        ? 'hover:bg-glass/30 focus:bg-glass/30'
        : 'hover:bg-gray-100 focus:bg-gray-100',
      separatorClass: isDark ? 'bg-glass-border' : 'bg-gray-200',
      textColorClass: isDark ? 'text-foreground' : 'text-gray-800',

      // —— 兼容旧 token 键（少部分页面可能用到） ——
      primary: isDark ? 'bg-tech-cyan text-black' : 'bg-slate-900 text-white',
      secondary: isDark ? 'bg-slate-800 text-foreground' : 'bg-slate-100 text-slate-900',
      accent: isDark ? 'bg-cyan-500 text-black' : 'bg-blue-600 text-white',
      muted: isDark ? 'text-slate-400' : 'text-slate-500',
      background: isDark ? 'bg-background' : 'bg-white',
      foreground: isDark ? 'text-foreground' : 'text-slate-900',
      border: isDark ? 'border-glass-border' : 'border-gray-200',
      card: isDark ? 'bg-card text-card-foreground' : 'bg-white text-slate-900',
    };
  }, [isDark]);

  return {
    themedClasses,
    getThemeClass,
    isDark,
    resolvedTheme,
  };
}

export default useThemedClasses;
