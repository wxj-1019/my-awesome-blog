'use client';

import { ThemeProvider } from '@/context/theme-context';
import AmbientBackground from '@/components/visual/AmbientBackground';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/*
        全局环境背景：深海氛围，token 自适应 light / dark。
        替代原浅色专用 Canvas 粒子（DynamicBackground）：气质与深海叙事统一，零 rAF 成本。
      */}
      <AmbientBackground />
      {children}
    </ThemeProvider>
  );
}
