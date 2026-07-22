'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/context/theme-context';
import BubbleField from '@/components/home/BubbleField';

/**
 * 全站氛围 · 采样自 Hero 视频帧，并做可读性收光
 *
 * dark  · moonlit-clouds：青绿夜 #1a3034/#2d5254 · 月晕 #97b698 · 云带 · 地雾
 * light · fantasy-deer：紫穹 #4b2fa4 · 环日暖晕 · 双层帷幕 · 漂浮光尘 · 青绿地面光（呼吸）
 *
 * 原则：色板忠于视频；层数克制；中间区域更透，便于正文/卡片。
 */
const BUBBLES = {
  dark: { desktop: 5, mobile: 3 },
  light: { desktop: 6, mobile: 3 },
} as const;

export default function AmbientBackground() {
  const { resolvedTheme, isMounted } = useTheme();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const mode: 'dark' | 'light' = !isMounted
    ? typeof document !== 'undefined' &&
      document.documentElement.classList.contains('light')
      ? 'light'
      : 'dark'
    : resolvedTheme;

  const bubbleCount =
    mode === 'dark'
      ? isDesktop
        ? BUBBLES.dark.desktop
        : BUBBLES.dark.mobile
      : isDesktop
        ? BUBBLES.light.desktop
        : BUBBLES.light.mobile;

  return (
    <div
      data-ambient-background
      data-ambient-mode={mode}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <style jsx>{`
        @keyframes moon-soft {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.03);
            opacity: 1;
          }
        }
        @keyframes cloud-slow {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.5;
          }
          50% {
            transform: translate3d(1.8vw, 0, 0);
            opacity: 0.78;
          }
        }
        @keyframes cloud-slow-alt {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.4;
          }
          50% {
            transform: translate3d(-1.4vw, 0.3vh, 0);
            opacity: 0.65;
          }
        }
        @keyframes ring-soft {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.04);
            opacity: 0.95;
          }
        }
        @keyframes veil-flow {
          0%,
          100% {
            opacity: 0.45;
            transform: translate3d(0, 0, 0);
          }
          50% {
            opacity: 0.7;
            transform: translate3d(0.8vw, 0, 0);
          }
        }
        @keyframes veil-flow-alt {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.35;
          }
          50% {
            transform: translate3d(-1.2vw, 0.4vh, 0);
            opacity: 0.6;
          }
        }
        @keyframes mote-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.5;
          }
          50% {
            transform: translate3d(0.6vw, -1.2vh, 0);
            opacity: 0.9;
          }
        }
        @keyframes ground-breathe {
          0%,
          100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }

        .moon-soft {
          animation: moon-soft 44s ease-in-out infinite;
        }
        .cloud-slow {
          animation: cloud-slow 52s ease-in-out infinite;
        }
        .cloud-slow-alt {
          animation: cloud-slow-alt 58s ease-in-out infinite;
        }
        .ring-soft {
          animation: ring-soft 40s ease-in-out infinite;
        }
        .veil-flow {
          animation: veil-flow 48s ease-in-out infinite;
        }
        .veil-flow-alt {
          animation: veil-flow-alt 62s ease-in-out infinite;
        }
        .mote-float {
          animation: mote-float 26s ease-in-out infinite;
        }
        .ground-breathe {
          animation: ground-breathe 36s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .moon-soft,
          .cloud-slow,
          .cloud-slow-alt,
          .ring-soft,
          .veil-flow,
          .veil-flow-alt,
          .mote-float,
          .ground-breathe {
            animation: none;
            opacity: 0.65;
          }
        }
      `}</style>

      {mode === 'dark' ? (
        <div className="absolute inset-0" data-ambient-world="dark">
          {/* 视频底：上夜空 → 中云雾青 → 下草地暗 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #0c1a1c 0%, #1a3034 32%, #2a4e4f 58%, #1a3536 82%, #0f2224 100%)',
            }}
          />
          {/* 满月：黄绿月光，位置偏右上，与视频一致 */}
          <div
            className="moon-soft absolute right-[8%] top-[6%] h-[min(36vh,320px)] w-[min(36vh,320px)] rounded-full"
            style={{
              background:
                'radial-gradient(circle at 48% 48%, rgba(230, 240, 210, 0.5) 0%, rgba(151, 182, 152, 0.22) 26%, rgba(77, 124, 119, 0.08) 50%, transparent 72%)',
            }}
          />
          {/* 月下大晕：铺满中上云海亮度 */}
          <div
            className="absolute right-[-5%] top-[-5%] h-[75vh] w-[75vw]"
            style={{
              background:
                'radial-gradient(ellipse 55% 50% at 55% 40%, rgba(151, 182, 152, 0.12) 0%, rgba(57, 100, 100, 0.07) 40%, transparent 68%)',
            }}
          />
          {/* 云带：更软、更贴地平线分层 */}
          <div
            className="cloud-slow absolute left-[-8%] top-[20%] h-[18vh] w-[116%]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(45, 82, 84, 0.42) 22%, rgba(77, 124, 119, 0.28) 50%, rgba(42, 78, 81, 0.38) 78%, transparent 100%)',
              filter: 'blur(22px)',
            }}
          />
          <div
            className="cloud-slow-alt absolute left-[-6%] top-[38%] h-[14vh] w-[112%]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(32, 57, 59, 0.48) 30%, rgba(57, 100, 100, 0.28) 58%, transparent 100%)',
              filter: 'blur(26px)',
            }}
          />
          {/* 远灯带：极克制的暖点，呼应视频路灯 */}
          <div
            className="absolute inset-x-[12%] bottom-[24%] h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(212, 168, 75, 0.14) 15%, rgba(212, 168, 75, 0.08) 50%, rgba(212, 168, 75, 0.14) 85%, transparent)',
              filter: 'blur(3px)',
            }}
          />
          {/* 近地草雾 */}
          <div
            className="absolute inset-x-0 bottom-0 h-[36vh]"
            style={{
              background:
                'linear-gradient(to top, rgba(9, 24, 26, 0.72) 0%, rgba(22, 45, 43, 0.28) 45%, transparent 100%)',
            }}
          />
          {/* 中间更透，利于卡片 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 130% 100% at 50% 42%, transparent 58%, rgba(8, 24, 26, 0.32) 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.028]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
          <BubbleField count={bubbleCount} withHighlight={false} />
        </div>
      ) : (
        <div className="absolute inset-0" data-ambient-world="light">
          {/* 紫穹底：视频主色，略提亮中间便于阅读 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #523088 0%, #4530a0 30%, #5540b0 55%, #3a2480 80%, #2c1468 100%)',
            }}
          />
          {/* 中心提亮：让内容区不那么闷 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(100, 87, 185, 0.35) 0%, transparent 65%)',
            }}
          />
          {/* 暖环日 */}
          <div
            className="ring-soft absolute right-[10%] top-[4%] h-[min(48vh,420px)] w-[min(48vh,420px)]"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255, 248, 240, 0.7) 0%, rgba(255, 210, 180, 0.4) 14%, rgba(255, 150, 110, 0.18) 30%, rgba(130, 90, 200, 0.1) 50%, transparent 68%)',
            }}
          />
          {/* 柔和放射帷幕（比 conic 更稳、更不脏） */}
          <div
            className="veil-flow absolute inset-0"
            style={{
              background:
                'linear-gradient(125deg, transparent 20%, rgba(100, 150, 255, 0.12) 40%, transparent 55%, rgba(160, 100, 220, 0.1) 70%, transparent 85%)',
              filter: 'blur(32px)',
            }}
          />
          {/* 中景云纱：缓慢漂移的第二层帷幕，补运动中景 */}
          <div
            className="veil-flow-alt absolute left-[-6%] top-[30%] h-[20vh] w-[112%]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(140, 160, 255, 0.16) 25%, rgba(180, 130, 230, 0.12) 55%, rgba(120, 200, 230, 0.1) 80%, transparent 100%)',
              filter: 'blur(28px)',
            }}
          />
          {/* 漂浮光尘：小尺度视觉锚点，呼应 fantasy-deer 的微粒感 */}
          <div
            className="mote-float absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle 2px at 18% 30%, rgba(255, 240, 200, 0.5) 0%, transparent 100%), radial-gradient(circle 1.5px at 62% 22%, rgba(200, 230, 255, 0.45) 0%, transparent 100%), radial-gradient(circle 2px at 82% 45%, rgba(255, 220, 190, 0.4) 0%, transparent 100%), radial-gradient(circle 1.5px at 38% 55%, rgba(180, 255, 235, 0.35) 0%, transparent 100%)',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div
            className="mote-float absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle 1.5px at 28% 68%, rgba(255, 235, 205, 0.4) 0%, transparent 100%), radial-gradient(circle 2px at 72% 60%, rgba(190, 225, 255, 0.45) 0%, transparent 100%), radial-gradient(circle 1.5px at 50% 38%, rgba(230, 200, 255, 0.35) 0%, transparent 100%)',
              backgroundRepeat: 'no-repeat',
              animationDelay: '-13s',
            }}
          />
          {/* 地面青绿反光 */}
          <div
            className="ground-breathe absolute left-[-8%] bottom-[-8%] h-[48vh] w-[55vw]"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 40% 70%, rgba(0, 230, 190, 0.14) 0%, rgba(60, 180, 255, 0.08) 40%, transparent 70%)',
            }}
          />
          <div
            className="ground-breathe absolute right-[0%] bottom-[-5%] h-[40vh] w-[42vw]"
            style={{
              background:
                'radial-gradient(ellipse 55% 45% at 50% 75%, rgba(0, 200, 255, 0.1) 0%, transparent 65%)',
              animationDelay: '-18s',
            }}
          />
          {/* 地面 */}
          <div
            className="absolute inset-x-0 bottom-0 h-[34vh]"
            style={{
              background:
                'linear-gradient(to top, rgba(34, 0, 88, 0.55) 0%, rgba(70, 40, 130, 0.22) 50%, transparent 100%)',
            }}
          />
          {/* 边缘收，中间更开 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 120% 100% at 50% 42%, transparent 55%, rgba(40, 10, 90, 0.28) 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
          <BubbleField count={bubbleCount} withHighlight={false} />
        </div>
      )}
    </div>
  );
}
