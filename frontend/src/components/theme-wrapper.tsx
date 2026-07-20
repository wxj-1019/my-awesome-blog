'use client';

import { ThemeProvider } from '@/context/theme-context';
import AmbientBackground from '@/components/visual/AmbientBackground';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/*
        全局环境背景：浅色「白昼浅海」（日光柱摇曳）/ 深色「夜海深潜」（月光斑 + 生物荧光），
        纯 CSS 按 html.light/.dark 切换，token 取色，零 rAF 成本。
      */}
      <AmbientBackground />
      {children}
    </ThemeProvider>
  );
}
