'use client';

import { ThemeProvider } from '@/context/theme-context';
import AmbientBackground from '@/components/visual/AmbientBackground';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/*
        全局环境背景：双世界氛围 —— 深色「月夜云海」（月晕 + 云带 + 地雾）/
        浅色「奇幻鹿境」（紫穹 + 环日暖晕 + 帷幕 + 光尘 + 地面呼吸反光），
        按 html.light/.dark 主题切换，采样自 Hero 视频帧色板。
        公开页请用透明壳（PageShell）透出氛围背景；后台/弹层可继续实底。
      */}
      <AmbientBackground />
      {children}
    </ThemeProvider>
  );
}
