'use client';

import { ThemeProvider, useTheme } from '@/context/theme-context';
import DynamicBackground from '@/components/ui/DynamicBackground';

function ThemeBackground() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      {/* 矩阵雨已从全局卸下（首页深海×电影叙事，避免赛博与电影气质冲突） */}
      {resolvedTheme === 'light' && <DynamicBackground />}
    </>
  );
}

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeBackground />
      {children}
    </ThemeProvider>
  );
}
