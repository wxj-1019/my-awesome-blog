'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

/** 用户偏好：含跟随系统 */
export type Theme = 'light' | 'dark' | 'auto';
/** 实际渲染主题（已解析 auto） */
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  /** 是否完成客户端 hydrate（可读 localStorage） */
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
    return 'auto';
  } catch {
    return 'auto';
  }
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
}

function applyThemeToDocument(theme: 'light' | 'dark') {
  const root = document.documentElement;
  
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  
  root.setAttribute('data-theme', theme);
  
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#f8fafc');
  } else {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = theme === 'dark' ? '#0a0a0a' : '#f8fafc';
    document.head.appendChild(meta);
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'auto',
  storageKey = STORAGE_KEY
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  // 默认 auto；首屏已由 layout 内联脚本写好 html.dark/light，此处 hydrate 后再对齐
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
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

  const updateTheme = useCallback((newTheme: Theme) => {
    const resolved = resolveTheme(newTheme);
    
    setThemeState(newTheme);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved);
    
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (e) {
      console.error('Failed to save theme to localStorage:', e);
    }
  }, [storageKey]);

  const setTheme = useCallback((newTheme: Theme) => {
    updateTheme(newTheme);
  }, [updateTheme]);

  useEffect(() => {
    if (!isMounted || theme !== 'auto') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? 'dark' : 'light';
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
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
