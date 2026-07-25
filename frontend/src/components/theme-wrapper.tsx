'use client';

import { ThemeProvider } from '@/context/theme-context';
import { MotionConfig } from '@/lib/framer-motion';
import AmbientBackground from '@/components/visual/AmbientBackground';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/*
        全局环境背景：双世界氛围 —— 深色「深邃星空」（canvas 三层星 + 慢流星 +
        旋臂星系 + 紫蓝星云 + 微尘）/ 浅色「林间晨光」（暖金晨空 + 林隙光柱 +
        冷杉林与鹿剪影 + 花粉光尘），按 html.light/.dark 主题切换。
        公开页请用透明壳透出氛围背景；后台/弹层可继续实底。
      */}
      <AmbientBackground />
      {/* reducedMotion="user"：全站（含 admin）framer-motion 动画自动遵循
          系统偏好，开启「减少动态效果」时降级为瞬时，无需逐组件判断 */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  );
}
