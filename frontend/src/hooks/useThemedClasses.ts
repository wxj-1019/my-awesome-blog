'use client';

import { useCallback, useMemo } from 'react';
import { useTheme } from '@/context/theme-context';

/**
 * 主题样式钩子 — Token 统一版
 *
 * themedClasses 全部映射到 Tailwind 语义色 / CSS 变量，
 * 不再维护 light/dark 两套硬编码字符串。
 *
 * 新代码优先直接写：
 *   className="bg-card text-foreground border-border"
 * 本 hook 仅为存量调用（cardBgClass 等）提供兼容层。
 *
 * getThemeClass(dark, light) 仍保留，用于迁移期双分支；
 * 新代码应避免使用，改为单一语义类。
 */
export interface ThemedClassesMap {
  cardBgClass: string;
  textClass: string;
  mutedTextClass: string;
  dropdownBgClass: string;
  dropdownShadowClass: string;
  dropdownItemClass: string;
  separatorClass: string;
  textColorClass: string;
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
  /** @deprecated 迁移期保留；(darkClass, lightClass) */
  getThemeClass: (darkClass: string, lightClass: string) => string;
  isDark: boolean;
  resolvedTheme: 'light' | 'dark';
}

/** 与 mode 无关的语义类（值来自当前 html 上的 CSS 变量） */
const TOKEN_CLASSES: ThemedClassesMap = {
  cardBgClass: 'bg-card/90 border-border',
  textClass: 'text-foreground',
  mutedTextClass: 'text-muted-foreground',
  dropdownBgClass:
    'bg-popover/95 backdrop-blur-xl border border-border',
  dropdownShadowClass: 'shadow-xl shadow-black/10 dark:shadow-black/40',
  dropdownItemClass: 'hover:bg-primary/10 focus:bg-primary/10',
  separatorClass: 'bg-border',
  textColorClass: 'text-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
  muted: 'text-muted-foreground',
  background: 'bg-background',
  foreground: 'text-foreground',
  border: 'border-border',
  card: 'bg-card text-card-foreground',
};

export function useThemedClasses(): ThemedClassesResult {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const getThemeClass = useCallback(
    (darkClass: string, lightClass: string): string => {
      return isDark ? darkClass : lightClass;
    },
    [isDark]
  );

  // 引用 resolvedTheme 仅保证主题切换时消费方重渲染；类名本身已是 token
  const themedClasses = useMemo(() => {
    void resolvedTheme;
    return TOKEN_CLASSES;
  }, [resolvedTheme]);

  return {
    themedClasses,
    getThemeClass,
    isDark,
    resolvedTheme,
  };
}

export default useThemedClasses;
