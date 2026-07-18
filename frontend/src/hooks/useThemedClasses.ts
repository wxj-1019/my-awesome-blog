import { useCallback } from 'react';
import type { Theme } from '@/constants/theme';
import {
  LIGHT_CLASS_NAMES,
  DARK_CLASS_NAMES,
  TECH_CLASS_NAMES,
} from '@/constants/theme';

export interface ThemedClassesResult {
  themedClasses: Record<string, string>;
  getThemeClass: (darkClass: string, lightClass: string) => string;
  isDark: boolean;
}

export function useThemedClasses(): ThemedClassesResult {
  const getTheme = useCallback((): Theme => {
    if (typeof window === 'undefined') {return 'dark';}
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }, []);

  const getThemeClass = useCallback((
    darkClass: string,
    lightClass: string
  ): string => {
    const theme = getTheme();
    return theme === 'dark' ? darkClass : lightClass;
  }, [getTheme]);

  const themedClasses = {
    primary: getThemeClass(LIGHT_CLASS_NAMES.primary, DARK_CLASS_NAMES.primary),
    secondary: getThemeClass(LIGHT_CLASS_NAMES.secondary, DARK_CLASS_NAMES.secondary),
    accent: getThemeClass(LIGHT_CLASS_NAMES.accent, DARK_CLASS_NAMES.accent),
    muted: getThemeClass(LIGHT_CLASS_NAMES.muted, DARK_CLASS_NAMES.muted),
    background: getThemeClass(LIGHT_CLASS_NAMES.background, DARK_CLASS_NAMES.background),
    foreground: getThemeClass(LIGHT_CLASS_NAMES.foreground, DARK_CLASS_NAMES.foreground),
    border: getThemeClass(LIGHT_CLASS_NAMES.border, DARK_CLASS_NAMES.border),
    card: getThemeClass(LIGHT_CLASS_NAMES.card, DARK_CLASS_NAMES.card),
    cardForeground: getThemeClass(LIGHT_CLASS_NAMES.cardForeground, DARK_CLASS_NAMES.cardForeground),
    popover: getThemeClass(LIGHT_CLASS_NAMES.popover, DARK_CLASS_NAMES.popover),
    popoverForeground: getThemeClass(LIGHT_CLASS_NAMES.popoverForeground, DARK_CLASS_NAMES.popoverForeground),
    destructive: getThemeClass(LIGHT_CLASS_NAMES.destructive, DARK_CLASS_NAMES.destructive),
    destructiveForeground: getThemeClass(LIGHT_CLASS_NAMES.destructiveForeground, DARK_CLASS_NAMES.destructiveForeground),
    ring: getThemeClass(LIGHT_CLASS_NAMES.ring, DARK_CLASS_NAMES.ring),
    techCyan: TECH_CLASS_NAMES.cyan,
    techDarkblue: TECH_CLASS_NAMES.darkblue,
    techDeepblue: TECH_CLASS_NAMES.deepblue,
    techSky: TECH_CLASS_NAMES.sky,
    glass: TECH_CLASS_NAMES.glass,
    glassLight: TECH_CLASS_NAMES.glassLight,
    glassDark: TECH_CLASS_NAMES.glassDark,
  };

  return {
    themedClasses,
    getThemeClass,
    isDark: getTheme() === 'dark',
  };
}

export default useThemedClasses;
