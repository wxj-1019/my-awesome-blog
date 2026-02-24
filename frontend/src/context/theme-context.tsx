'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (stored as Theme) : 'auto';
  } catch {
    return 'auto';
  }
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'light') return 'light';
  if (theme === 'dark') return 'dark';
  
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  return 'dark';
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
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => 
    resolveTheme(getInitialTheme())
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') {
      return;
    }

    const root = window.document.documentElement;
    const actualTheme = resolveTheme(theme);

    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    setResolvedTheme(actualTheme);

    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.error('无法保存主题到localStorage:', e);
    }
  }, [theme, storageKey, isMounted, setResolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      const actualTheme = resolveTheme(newTheme);
      
      root.classList.remove('light', 'dark');
      root.classList.add(actualTheme);
      setResolvedTheme(actualTheme);
      
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (e) {
        console.error('无法更新主题:', e);
      }
    }
  };

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined' || theme !== 'auto') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let timeoutId: NodeJS.Timeout;

    const handleChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
        setResolvedTheme(newTheme);
      }, 50);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      clearTimeout(timeoutId);
    };
  }, [theme, isMounted, setResolvedTheme]);

  const value = {
    theme,
    setTheme,
    resolvedTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {isMounted ? children : null}
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
