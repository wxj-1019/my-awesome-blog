'use client';

import { useEffect, useMemo, useState } from 'react';
import BubbleField from '@/components/home/BubbleField';

/** 稀疏上浮微粒预算（较首页再减半，全站常驻需克制） */
const AMBIENT_BUBBLE_COUNT = {
  desktop: 6,
  mobile: 3,
} as const;

/** 深色生物荧光点预算 */
const FIREFLY_COUNT = {
  desktop: 12,
  mobile: 6,
} as const;

interface FireflySpec {
  left: number; // %
  top: number; // %
  size: number; // px
  duration: number; // s
  delay: number; // s
  drift: number; // px 横向漂移
}

/**
 * 全局环境背景：按主题气质分两套动态层。
 *
 * 浅色 ·「白昼浅海」：天光自水面洒落 —— 顶部天光 + 两道缓慢摇曳的日光柱
 *   + 云影柔光斑横向漂移，明亮、通透、安静。
 * 深色 ·「夜海深潜」：黑暗中微光 —— 月光光斑错峰漂移 + 顶部月柱
 *   + 生物荧光点明灭（深海萤火虫），幽静、有纵深。
 *
 * 主题切换：纯 CSS（html.light / html.dark 已由 FOUC 脚本预置，无闪烁、
 * 无 hydration 分支）；两套层常驻 DOM，display 切换，切换瞬间无重建成本。
 *
 * 红线：
 * - 只动 transform / opacity（keyframes 内无 layout 属性、无 background-position 动画）
 * - 颜色全部走 CSS 变量 token（color-mix），不写 isDark 色值分支
 * - prefers-reduced-motion → 全部静态终态；移动端微粒/荧光减半
 * - 纯装饰：fixed + -z-10 + pointer-events-none + aria-hidden
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

  // 生物荧光点：伪随机但稳定（hydration 一致），偏下半屏营造纵深
  const fireflies = useMemo<FireflySpec[]>(() => {
    const count = isDesktop ? FIREFLY_COUNT.desktop : FIREFLY_COUNT.mobile;
    const seed = (n: number) => {
      const x = Math.sin(n * 7919 + 31) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      left: 3 + seed(i + 1) * 94,
      top: 30 + seed(i + 11) * 65,
      size: 2 + seed(i + 21) * 3,
      duration: 3.5 + seed(i + 31) * 4,
      delay: seed(i + 41) * 6,
      drift: (seed(i + 51) - 0.5) * 24,
    }));
  }, [isDesktop]);

  return (
    <div
      data-ambient-background
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <style jsx>{`
        /* 主题层切换：FOUC 脚本已在 <html> 预置 .light / .dark */
        .ambient-layer-light,
        .ambient-layer-dark {
          display: none;
        }
        :global(.light) .ambient-layer-light {
          display: block;
        }
        :global(.dark) .ambient-layer-dark {
          display: block;
        }

        /* ===== 浅色 · 白昼浅海 ===== */
        @keyframes ambient-shaft-sway-a {
          0%,
          100% {
            transform: translate3d(-2vw, 0, 0) skewX(-12deg);
            opacity: 0.5;
          }
          50% {
            transform: translate3d(2.5vw, 0, 0) skewX(-10deg);
            opacity: 0.85;
          }
        }
        @keyframes ambient-shaft-sway-b {
          0%,
          100% {
            transform: translate3d(2vw, 0, 0) skewX(-16deg);
            opacity: 0.35;
          }
          50% {
            transform: translate3d(-2vw, 0, 0) skewX(-13deg);
            opacity: 0.6;
          }
        }
        @keyframes ambient-cloud-drift {
          0%,
          100% {
            transform: translate3d(-4vw, 1vh, 0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translate3d(5vw, -2vh, 0) scale(1.06);
            opacity: 0.8;
          }
        }
        .ambient-shaft-a {
          animation: ambient-shaft-sway-a 24s ease-in-out infinite;
        }
        .ambient-shaft-b {
          animation: ambient-shaft-sway-b 30s ease-in-out infinite;
        }
        .ambient-cloud {
          animation: ambient-cloud-drift 36s ease-in-out infinite;
        }

        /* ===== 深色 · 夜海深潜 ===== */
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
        @keyframes ambient-firefly {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(0.7);
            opacity: 0.08;
          }
          50% {
            transform: translate3d(var(--drift), -10px, 0) scale(1);
            opacity: 0.85;
          }
        }
        .ambient-glow-a {
          animation: ambient-drift-a 26s ease-in-out infinite;
        }
        .ambient-glow-b {
          animation: ambient-drift-b 32s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .ambient-shaft-a,
          .ambient-shaft-b,
          .ambient-cloud,
          .ambient-glow-a,
          .ambient-glow-b,
          .ambient-firefly-dot {
            animation: none;
          }
        }
      `}</style>

      {/* 兜底基底：静态水体渐变（上淡 primary，下淡深水蓝，双主题通用） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in srgb, var(--primary) 4%, transparent), transparent 30%, transparent 70%, color-mix(in srgb, var(--tech-deepblue) 5%, transparent))',
        }}
      />

      {/* ===== 浅色层 · 白昼浅海 ===== */}
      <div className="ambient-layer-light absolute inset-0">
        {/* 顶部天光：水面之上的白昼光源 */}
        <div
          className="absolute inset-x-0 top-0 h-[55vh]"
          style={{
            background:
              'radial-gradient(ellipse 75% 100% at 50% 0%, color-mix(in srgb, var(--tech-sky) 22%, transparent), transparent 72%)',
          }}
        />
        {/* 日光柱 · 主：左倾宽柱，缓慢摇曳 */}
        <div
          className="ambient-shaft-a absolute -top-[8%] left-[16%] h-[85vh] w-[22vw]"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--tech-lightcyan) 20%, transparent), transparent 78%)',
            filter: 'blur(6px)',
          }}
        />
        {/* 日光柱 · 副：更窄更淡，错峰摇曳 */}
        <div
          className="ambient-shaft-b absolute -top-[6%] left-[52%] h-[70vh] w-[12vw]"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--tech-sky) 16%, transparent), transparent 75%)',
            filter: 'blur(5px)',
          }}
        />
        {/* 云影柔光斑 · 右下：横向慢漂移，模拟云过水面 */}
        <div
          className="ambient-cloud absolute -bottom-[18%] -right-[10%] h-[60vh] w-[50vw]"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 7%, transparent), transparent 70%)',
          }}
        />
      </div>

      {/* ===== 深色层 · 夜海深潜 ===== */}
      <div className="ambient-layer-dark absolute inset-0">
        {/* 月光光斑 · 左上（primary） */}
        <div
          className="ambient-glow-a absolute -top-[20%] -left-[10%] h-[70vh] w-[60vw]"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 10%, transparent), transparent 70%)',
          }}
        />
        {/* 月光光斑 · 右下（lightcyan，错峰反向漂移） */}
        <div
          className="ambient-glow-b absolute -bottom-[25%] -right-[15%] h-[80vh] w-[55vw]"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in srgb, var(--tech-lightcyan) 8%, transparent), transparent 70%)',
          }}
        />
        {/* 月柱：海面月路，自上而下的窄光带（静态，动态由荧光点承担） */}
        <div
          className="absolute inset-x-0 top-0 mx-auto h-[60vh] w-[26vw]"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--tech-lightcyan) 9%, transparent), transparent 80%)',
            filter: 'blur(8px)',
          }}
        />
        {/* 生物荧光点：深海萤火虫，明灭 + 微漂移 */}
        {fireflies.map((f, i) => (
          <span
            key={i}
            className="ambient-firefly-dot absolute rounded-full"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              background:
                'color-mix(in srgb, var(--tech-lightcyan) 85%, transparent)',
              boxShadow:
                '0 0 8px 2px color-mix(in srgb, var(--tech-lightcyan) 45%, transparent)',
              opacity: 0.08,
              ['--drift' as string]: `${f.drift}px`,
              animation: `ambient-firefly ${f.duration}s ease-in-out ${f.delay}s infinite`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      {/* 稀疏上浮微粒：复用 BubbleField，省略高光（双主题通用） */}
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
