'use client';

import { useEffect, useMemo, useState } from 'react';
import BubbleField from '@/components/home/BubbleField';

/** 稀疏上浮微粒预算（全站常驻需克制） */
const AMBIENT_BUBBLE_COUNT = {
  desktop: 6,
  mobile: 3,
} as const;

/** 深色：生物荧光点预算（海面层） */
const FIREFLY_COUNT = {
  desktop: 12,
  mobile: 6,
} as const;

/** 深色：星空预算（上半屏） */
const STAR_COUNT = {
  desktop: 24,
  mobile: 12,
} as const;

/** 浅色：光尘微粒预算（林间漂浮孢子） */
const MOTE_COUNT = {
  desktop: 16,
  mobile: 8,
} as const;

interface ParticleSpec {
  left: number; // %
  top: number; // %
  size: number; // px
  duration: number; // s
  delay: number; // s
  drift: number; // px 横向漂移
}

/** 伪随机但稳定（hydration 一致） */
function makeSeed(offset: number) {
  return (n: number) => {
    const x = Math.sin(n * 7919 + offset) * 10000;
    return x - Math.floor(x);
  };
}

/**
 * 全局环境背景：按主题气质分两套动态场景层。
 *
 * 浅色 ·「林间晨光」：灵感来自 Hero 鹿景视频 —— 透过林冠的丁达尔光柱 ×4、
 *   蒲公英式光尘微粒上浮、柔和 bokeh 光斑、底部远林剪影暗示。
 * 深色 ·「月夜云海」：灵感来自 Hero 月夜云海视频 —— 月亮与月晕、三层漂移云海、
 *   明灭星空、偶发流星，海面保留生物荧光点。
 *
 * 主题切换：纯 CSS（html.light / html.dark 已由 FOUC 脚本预置，无闪烁、
 * 无 hydration 分支）；两套层常驻 DOM，display 切换，切换瞬间无重建成本。
 *
 * 红线：
 * - 只动 transform / opacity（keyframes 内无 layout 属性、无 background-position 动画）
 * - 颜色全部走 CSS 变量 token（color-mix），不写裸色值、不写 isDark 分支
 * - prefers-reduced-motion → 全部静态终态；移动端粒子/云层减半
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

  // 生物荧光点：偏下半屏，海面萤火
  const fireflies = useMemo<ParticleSpec[]>(() => {
    const count = isDesktop ? FIREFLY_COUNT.desktop : FIREFLY_COUNT.mobile;
    const seed = makeSeed(31);
    return Array.from({ length: count }, (_, i) => ({
      left: 3 + seed(i + 1) * 94,
      top: 30 + seed(i + 11) * 65,
      size: 2 + seed(i + 21) * 3,
      duration: 3.5 + seed(i + 31) * 4,
      delay: seed(i + 41) * 6,
      drift: (seed(i + 51) - 0.5) * 24,
    }));
  }, [isDesktop]);

  // 星空：集中上半屏，明灭
  const stars = useMemo<ParticleSpec[]>(() => {
    const count = isDesktop ? STAR_COUNT.desktop : STAR_COUNT.mobile;
    const seed = makeSeed(97);
    return Array.from({ length: count }, (_, i) => ({
      left: 2 + seed(i + 1) * 96,
      top: 2 + seed(i + 11) * 48,
      size: 1 + seed(i + 21) * 1.5,
      duration: 3 + seed(i + 31) * 4,
      delay: seed(i + 41) * 7,
      drift: 0,
    }));
  }, [isDesktop]);

  // 光尘微粒：林间孢子，全屏上浮 + 横摆
  const motes = useMemo<ParticleSpec[]>(() => {
    const count = isDesktop ? MOTE_COUNT.desktop : MOTE_COUNT.mobile;
    const seed = makeSeed(53);
    return Array.from({ length: count }, (_, i) => ({
      left: 4 + seed(i + 1) * 92,
      top: 25 + seed(i + 11) * 72,
      size: 2 + seed(i + 21) * 2.5,
      duration: 12 + seed(i + 31) * 10,
      delay: seed(i + 41) * 12,
      drift: (seed(i + 51) - 0.5) * 60,
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

        /* ===== 浅色 · 林间晨光 ===== */
        @keyframes ambient-shaft-sway-a {
          0%, 100% { transform: translate3d(-2vw, 0, 0) skewX(-12deg); opacity: 0.5; }
          50% { transform: translate3d(2.5vw, 0, 0) skewX(-10deg); opacity: 0.85; }
        }
        @keyframes ambient-shaft-sway-b {
          0%, 100% { transform: translate3d(2vw, 0, 0) skewX(-16deg); opacity: 0.35; }
          50% { transform: translate3d(-2vw, 0, 0) skewX(-13deg); opacity: 0.6; }
        }
        @keyframes ambient-shaft-sway-c {
          0%, 100% { transform: translate3d(-1.5vw, 0, 0) skewX(-9deg); opacity: 0.3; }
          50% { transform: translate3d(1.5vw, 0, 0) skewX(-11deg); opacity: 0.55; }
        }
        @keyframes ambient-shaft-sway-d {
          0%, 100% { transform: translate3d(1vw, 0, 0) skewX(-18deg); opacity: 0.25; }
          50% { transform: translate3d(-1vw, 0, 0) skewX(-15deg); opacity: 0.45; }
        }
        .ambient-shaft-a { animation: ambient-shaft-sway-a 24s ease-in-out infinite; }
        .ambient-shaft-b { animation: ambient-shaft-sway-b 30s ease-in-out infinite; }
        .ambient-shaft-c { animation: ambient-shaft-sway-c 36s ease-in-out infinite; }
        .ambient-shaft-d { animation: ambient-shaft-sway-d 42s ease-in-out infinite; }

        /* 光尘微粒：上浮 + 横摆（两段 keyframe 近似正弦） */
        @keyframes ambient-mote-float {
          0% { transform: translate3d(0, 12px, 0) scale(0.8); opacity: 0; }
          15% { opacity: 0.7; }
          50% { transform: translate3d(var(--drift), -14px, 0) scale(1); opacity: 0.5; }
          85% { opacity: 0.6; }
          100% { transform: translate3d(calc(var(--drift) * -0.5), -30px, 0) scale(0.85); opacity: 0; }
        }

        /* 柔和 bokeh：慢漂移 + 呼吸 */
        @keyframes ambient-bokeh-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate3d(3vw, -2vh, 0) scale(1.08); opacity: 0.8; }
        }
        .ambient-bokeh-a { animation: ambient-bokeh-drift 26s ease-in-out infinite; }
        .ambient-bokeh-b { animation: ambient-bokeh-drift 34s ease-in-out infinite reverse; }
        .ambient-bokeh-c { animation: ambient-bokeh-drift 40s ease-in-out infinite; }

        /* ===== 深色 · 月夜云海 ===== */
        @keyframes ambient-drift-a {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
          50% { transform: translate3d(4vw, 3vh, 0) scale(1.07); opacity: 0.85; }
        }
        @keyframes ambient-drift-b {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.05); opacity: 0.45; }
          50% { transform: translate3d(-3vw, -4vh, 0) scale(1); opacity: 0.75; }
        }
        .ambient-glow-a { animation: ambient-drift-a 26s ease-in-out infinite; }
        .ambient-glow-b { animation: ambient-drift-b 32s ease-in-out infinite; }

        /* 云海：三层不同周期横向漂移 */
        @keyframes ambient-cloud-sea-a {
          0%, 100% { transform: translate3d(-6vw, 0, 0); }
          50% { transform: translate3d(6vw, 0, 0); }
        }
        @keyframes ambient-cloud-sea-b {
          0%, 100% { transform: translate3d(8vw, 0, 0); }
          50% { transform: translate3d(-8vw, 0, 0); }
        }
        @keyframes ambient-cloud-sea-c {
          0%, 100% { transform: translate3d(-10vw, 0, 0); }
          50% { transform: translate3d(10vw, 0, 0); }
        }
        .ambient-cloud-sea-a { animation: ambient-cloud-sea-a 60s ease-in-out infinite; }
        .ambient-cloud-sea-b { animation: ambient-cloud-sea-b 90s ease-in-out infinite; }
        .ambient-cloud-sea-c { animation: ambient-cloud-sea-c 120s ease-in-out infinite; }

        /* 星空明灭 */
        @keyframes ambient-star-twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.9; }
        }

        /* 流星：18s 周期，仅中段划过，其余时间藏屏外 */
        @keyframes ambient-meteor {
          0%, 78% { transform: translate3d(0, 0, 0) rotate(-32deg); opacity: 0; }
          82% { opacity: 0.9; }
          92% { transform: translate3d(-46vw, 30vh, 0) rotate(-32deg); opacity: 0.7; }
          96%, 100% { transform: translate3d(-52vw, 34vh, 0) rotate(-32deg); opacity: 0; }
        }

        /* 生物荧光点：明灭 + 微漂移 */
        @keyframes ambient-firefly {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.7); opacity: 0.08; }
          50% { transform: translate3d(var(--drift), -10px, 0) scale(1); opacity: 0.85; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ambient-shaft-a,
          .ambient-shaft-b,
          .ambient-shaft-c,
          .ambient-shaft-d,
          .ambient-bokeh-a,
          .ambient-bokeh-b,
          .ambient-bokeh-c,
          .ambient-glow-a,
          .ambient-glow-b,
          .ambient-cloud-sea-a,
          .ambient-cloud-sea-b,
          .ambient-cloud-sea-c,
          .ambient-meteor-dot,
          .ambient-firefly-dot,
          .ambient-star-dot,
          .ambient-mote-dot {
            animation: none;
          }
        }
      `}</style>

      {/* 兜底基底：静态水体渐变（双主题通用） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in srgb, var(--primary) 4%, transparent), transparent 30%, transparent 70%, color-mix(in srgb, var(--tech-deepblue) 5%, transparent))',
        }}
      />

      {/* ===== 浅色层 · 林间晨光 ===== */}
      <div className="ambient-layer-light absolute inset-0">
        {/* 晨光基底：顶部天光（林冠之上） */}
        <div
          className="absolute inset-x-0 top-0 h-[55vh]"
          style={{
            background:
              'radial-gradient(ellipse 75% 100% at 50% 0%, color-mix(in srgb, var(--tech-sky) 22%, transparent), transparent 72%)',
          }}
        />
        {/* 丁达尔光柱 ×4：穿过林冠的光，错峰摇曳 */}
        <div
          className="ambient-shaft-a absolute -top-[8%] left-[14%] h-[85vh] w-[20vw]"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--tech-lightcyan) 20%, transparent), transparent 78%)',
            filter: 'blur(6px)',
          }}
        />
        <div
          className="ambient-shaft-b absolute -top-[6%] left-[46%] h-[70vh] w-[11vw]"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--tech-sky) 16%, transparent), transparent 75%)',
            filter: 'blur(5px)',
          }}
        />
        <div
          className="ambient-shaft-c absolute -top-[7%] right-[22%] h-[75vh] w-[14vw]"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--tech-lightcyan) 14%, transparent), transparent 76%)',
            filter: 'blur(6px)',
          }}
        />
        <div
          className="ambient-shaft-d absolute -top-[5%] right-[6%] h-[60vh] w-[8vw]"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--tech-sky) 12%, transparent), transparent 72%)',
            filter: 'blur(4px)',
          }}
        />

        {/* 柔和 bokeh ×3：林间光斑 */}
        <div
          className="ambient-bokeh-a absolute top-[30%] left-[8%] h-56 w-56 rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, color-mix(in srgb, var(--tech-sky) 14%, transparent), transparent 70%)',
            filter: 'blur(10px)',
          }}
        />
        <div
          className="ambient-bokeh-b absolute top-[55%] right-[12%] h-72 w-72 rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, color-mix(in srgb, var(--success) 8%, transparent), transparent 70%)',
            filter: 'blur(12px)',
          }}
        />
        <div
          className="ambient-bokeh-c absolute bottom-[8%] left-[30%] h-64 w-64 rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, color-mix(in srgb, var(--tech-lightcyan) 10%, transparent), transparent 70%)',
            filter: 'blur(11px)',
          }}
        />

        {/* 光尘微粒：林间孢子，上浮 + 横摆 */}
        {motes.map((m, i) => (
          <span
            key={i}
            className="ambient-mote-dot absolute rounded-full"
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: `${m.size}px`,
              height: `${m.size}px`,
              background:
                'color-mix(in srgb, var(--tech-sky) 70%, white)',
              boxShadow:
                '0 0 6px 1px color-mix(in srgb, var(--tech-sky) 40%, transparent)',
              opacity: 0,
              ['--drift' as string]: `${m.drift}px`,
              animation: `ambient-mote-float ${m.duration}s ease-in-out ${m.delay}s infinite`,
              willChange: 'transform, opacity',
            }}
          />
        ))}

        {/* 远林剪影暗示：底部极低透明度绿意 */}
        <div
          className="absolute inset-x-0 bottom-0 h-[30vh]"
          style={{
            background:
              'linear-gradient(to top, color-mix(in srgb, var(--success) 6%, transparent), transparent)',
          }}
        />
      </div>

      {/* ===== 深色层 · 月夜云海 ===== */}
      <div className="ambient-layer-dark absolute inset-0">
        {/* 月亮 + 月晕（右上） */}
        <div
          data-moon
          className="absolute top-[9%] right-[14%] h-24 w-24 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 42% 38%, color-mix(in srgb, var(--tech-lightcyan) 55%, white), color-mix(in srgb, var(--tech-lightcyan) 30%, transparent) 62%, transparent 78%)',
            filter: 'blur(1px)',
          }}
        />
        <div
          className="absolute top-[4%] right-[9%] h-48 w-48 rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, color-mix(in srgb, var(--tech-lightcyan) 16%, transparent), transparent 70%)',
            filter: 'blur(10px)',
          }}
        />

        {/* 月光光斑 ×2（保留原有漂移，增加层次） */}
        <div
          className="ambient-glow-a absolute -top-[20%] -left-[10%] h-[70vh] w-[60vw]"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 10%, transparent), transparent 70%)',
          }}
        />
        <div
          className="ambient-glow-b absolute -bottom-[25%] -right-[15%] h-[80vh] w-[55vw]"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in srgb, var(--tech-lightcyan) 8%, transparent), transparent 70%)',
          }}
        />

        {/* 云海 ×3：中下部，60/90/120s 三速漂移 */}
        <div
          className="ambient-cloud-sea ambient-cloud-sea-a absolute top-[46%] -left-[15%] h-[22vh] w-[80vw] rounded-[50%]"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in srgb, var(--tech-sky) 10%, transparent), transparent 68%)',
            filter: 'blur(18px)',
          }}
        />
        <div
          className="ambient-cloud-sea ambient-cloud-sea-b absolute top-[58%] -right-[10%] h-[26vh] w-[90vw] rounded-[50%]"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in srgb, var(--tech-lightcyan) 8%, transparent), transparent 70%)',
            filter: 'blur(22px)',
          }}
        />
        <div
          className="ambient-cloud-sea ambient-cloud-sea-c absolute bottom-[4%] -left-[20%] h-[24vh] w-[95vw] rounded-[50%]"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in srgb, var(--tech-deepblue) 12%, transparent), transparent 72%)',
            filter: 'blur(20px)',
          }}
        />

        {/* 星空：上半屏明灭 */}
        {stars.map((s, i) => (
          <span
            key={i}
            className="ambient-star-dot absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background:
                'color-mix(in srgb, var(--tech-lightcyan) 85%, white)',
              boxShadow:
                '0 0 4px 1px color-mix(in srgb, var(--tech-lightcyan) 45%, transparent)',
              opacity: 0.15,
              animation: `ambient-star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              willChange: 'opacity',
            }}
          />
        ))}

        {/* 流星：偶发划过（趣味点） */}
        <div
          data-meteor
          className="ambient-meteor-dot absolute top-[12%] right-[6%] h-px w-32"
          style={{
            background:
              'linear-gradient(to left, color-mix(in srgb, var(--tech-lightcyan) 80%, white), transparent)',
            boxShadow:
              '0 0 6px 1px color-mix(in srgb, var(--tech-lightcyan) 40%, transparent)',
            opacity: 0,
            transformOrigin: 'right center',
            animation: 'ambient-meteor 18s linear 4s infinite',
            willChange: 'transform, opacity',
          }}
        />

        {/* 生物荧光点：海面萤火（保留） */}
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
