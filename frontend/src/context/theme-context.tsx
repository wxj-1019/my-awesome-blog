'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  THEME_STORAGE_KEY,
  THEME_COLOR_FALLBACK,
  isThemeMode,
  readCssVar,
  type ThemeMode,
  type ResolvedMode,
} from '@/lib/theme-config';

/** @deprecated 请使用 ThemeMode；保留别名避免破坏外部 import */
export type Theme = ThemeMode;
export type ResolvedTheme = ResolvedMode;

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: ResolvedMode;
  /** 是否完成客户端 hydrate（可读 localStorage） */
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeMode(stored)) {
      return stored;
    }
    return 'auto';
  } catch {
    return 'auto';
  }
}

function getSystemTheme(): ResolvedMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolveTheme(theme: ThemeMode): ResolvedMode {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
}

function applyThemeToDocument(mode: ResolvedMode) {
  const root = document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(mode);
  // data-theme 表示当前解析 mode；未来皮肤用 data-theme-pack
  root.setAttribute('data-theme', mode);
  root.setAttribute('data-mode', mode);

  const themeColor =
    readCssVar('--background', THEME_COLOR_FALLBACK[mode]) ||
    THEME_COLOR_FALLBACK[mode];

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', themeColor);
  } else {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = themeColor;
    document.head.appendChild(meta);
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'auto',
  storageKey = THEME_STORAGE_KEY,
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedMode>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const initialTheme = getInitialTheme();
    const initialResolved = resolveTheme(initialTheme);

    setThemeState(initialTheme);
    setResolvedTheme(initialResolved);
    applyThemeToDocument(initialResolved);

    setIsMounted(true);
  }, []);

  const updateTheme = useCallback(
    (newTheme: ThemeMode) => {
      const resolved = resolveTheme(newTheme);

      setThemeState(newTheme);
      setResolvedTheme(resolved);
      applyThemeToDocument(resolved);

      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (e) {
        console.error('Failed to save theme to localStorage:', e);
      }
    },
    [storageKey]
  );

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      updateTheme(newTheme);
    },
    [updateTheme]
  );

  useEffect(() => {
    if (!isMounted || theme !== 'auto') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme: ResolvedMode = e.matches ? 'dark' : 'light';
      setResolvedTheme(systemTheme);
      applyThemeToDocument(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, isMounted]);

  const value = {
    theme,
    setTheme,
    resolvedTheme,
    isMounted,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
