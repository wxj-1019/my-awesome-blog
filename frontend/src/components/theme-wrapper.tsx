'use client';

import { ThemeProvider } from '@/context/theme-context';
import AmbientBackground from '@/components/visual/AmbientBackground';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/*
        全局环境背景：双世界氛围 —— 深色「月夜云海」（亮月 + 银边云海 + 星空流星）/
        浅色「林间晨光」（暖金晨空 + 林隙光柱 + 冷杉林与鹿剪影 + 花粉光尘），
        按 html.light/.dark 主题切换，采样自 Hero 视频氛围。
        公开页请用透明壳透出氛围背景；后台/弹层可继续实底。
      */}
      <AmbientBackground />
      {children}
    </ThemeProvider>
  );
}
