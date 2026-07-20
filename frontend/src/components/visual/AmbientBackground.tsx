'use client';

import { useEffect, useState } from 'react';
import BubbleField from '@/components/home/BubbleField';

/** 稀疏上浮微粒预算（较首页再减半，全站常驻需克制） */
const AMBIENT_BUBBLE_COUNT = {
  desktop: 6,
  mobile: 3,
} as const;

/**
 * 全局环境背景：深海延续（光斑漂移 + 稀疏微粒）+ 静态渐变基底兜底。
 *
 * 红线：
 * - 只动 transform / opacity（keyframes 内无 layout 属性、无 background-position 动画）
 * - 颜色全部走 CSS 变量 token（color-mix），light / dark 自适应
 * - prefers-reduced-motion → 静态终态；移动端微粒减半
 * - 纯装饰：fixed + -z-10 + pointer-events-none + aria-hidden，
 *   页面容器自带背景处自然被遮盖（首页有自己的深海叙事，不受影响）
 */
export default function AmbientBackground() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return (
    <div
      data-ambient-background
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <style jsx>{`
        @keyframes ambient-drift-a {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.55;
          }
          50% {
            transform: translate3d(4vw, 3vh, 0) scale(1.07);
            opacity: 0.85;
          }
        }
        @keyframes ambient-drift-b {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1.05);
            opacity: 0.45;
          }
          50% {
            transform: translate3d(-3vw, -4vh, 0) scale(1);
            opacity: 0.75;
          }
        }
        .ambient-glow-a {
          animation: ambient-drift-a 26s ease-in-out infinite;
        }
        .ambient-glow-b {
          animation: ambient-drift-b 32s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ambient-glow-a,
          .ambient-glow-b {
            animation: none;
          }
        }
      `}</style>

      {/* 兜底基底：静态水体渐变（上淡 primary，下淡深水蓝） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in srgb, var(--primary) 4%, transparent), transparent 30%, transparent 70%, color-mix(in srgb, var(--tech-deepblue) 5%, transparent))',
        }}
      />

      {/* 水面光斑 · 左上（primary） */}
      <div
        className="ambient-glow-a absolute -top-[20%] -left-[10%] h-[70vh] w-[60vw]"
        style={{
          background:
            'radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 10%, transparent), transparent 70%)',
        }}
      />
      {/* 水面光斑 · 右下（lightcyan，错峰反向漂移） */}
      <div
        className="ambient-glow-b absolute -bottom-[25%] -right-[15%] h-[80vh] w-[55vw]"
        style={{
          background:
            'radial-gradient(ellipse at center, color-mix(in srgb, var(--tech-lightcyan) 8%, transparent), transparent 70%)',
        }}
      />

      {/* 稀疏上浮微粒：复用 BubbleField，省略高光 */}
      <BubbleField
        count={isDesktop ? AMBIENT_BUBBLE_COUNT.desktop : AMBIENT_BUBBLE_COUNT.mobile}
        withHighlight={false}
      />

      {/* 噪点纹理：消除大面积纯色的塑料感 */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
