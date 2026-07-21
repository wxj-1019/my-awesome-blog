'use client';

import { ThemeProvider } from '@/context/theme-context';
import AmbientBackground from '@/components/visual/AmbientBackground';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/*
        全局环境背景：浅色「林间晨光」（丁达尔光柱 + 光尘孢子）/
        深色「月夜云海」（月亮 + 云海 + 星空 + 流星），
        纯 CSS 按 html.light/.dark 切换，token 取色，零 rAF 成本。
      */}
      <AmbientBackground />
      {children}
    </ThemeProvider>
  );
}
