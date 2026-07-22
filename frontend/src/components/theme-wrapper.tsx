'use client';

import { ThemeProvider } from '@/context/theme-context';
import AmbientBackground from '@/components/visual/AmbientBackground';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/*
        全局环境背景：深浅色两套水光气质（html.light / html.dark）。
        公开页请用透明壳（PageShell）透出；后台/弹层可继续实底。
      */}
      <AmbientBackground />
      {children}
    </ThemeProvider>
  );
}
