'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/context/theme-context';
import { motion, useScroll, useTransform } from '@/lib/framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { createStarfield, type Starfield } from '@/lib/starfield';

/**
 * 全站氛围背景 · 贴合 Hero 双视频场景（纯 CSS 场景层）
 *
 * dark  · 月夜云海（深邃蓝夜）：亮月（含环形山）居左 · 月光海路 · 三层银边云海
 *         · 星空明灭 + 星座描边绘入（居右）· 双流星 · 山脉剪影 ×2 · 近地草雾
 * light · 林间晨光（暖金绿）：旭日居右 · 林隙光柱 ×3 · 花粉上浮 + 落叶飘坠
 *         · 冷杉林剪影 ×2 · 鹿剪影
 *
 * 区分策略：两场景镜像构图（月左 vs 日右）、色域分离（蓝夜 vs 金绿晨）、
 * 运动对比（星升云移 vs 花粉升 + 落叶坠）。
 *
 * 动画技术：
 * - 滚动视差：useScroll 驱动远/中/近景不同速率位移（星 24 / 月 36 / 云 56 / 山 84px）
 * - SVG 描边绘入：星座连线 stroke-dashoffset 绘出
 * - CSS keyframes：云漂移、星明灭、光柱摇曳、落叶旋转下落
 *
 * 原则：
 * - 场景感优先：色板采自视频氛围（本文件为氛围层，特许使用场景色值，不走 token）
 * - 柔和：所有边缘 blur / 低透明度；中间区域更透，保证正文与玻璃卡可读
 * - 只动 transform / opacity；prefers-reduced-motion → 全部静态（视差归零、流星/落叶隐藏）
 * - 全站层不挂 BubbleField，气泡仅留在 Hero/入水叙事段
 */
export default function AmbientBackground() {
  const { resolvedTheme, isMounted } = useTheme();
  const reducedMotion = useReducedMotion();

  // 滚动视差：远/中/近景不同速率，营造纵深（reduced-motion 时归零）
  const { scrollYProgress } = useScroll();
  const yFar = useTransform(scrollYProgress, [0, 1], [0, 24]);
  const yNear = useTransform(scrollYProgress, [0, 1], [0, 84]);

  const mode: 'dark' | 'light' = !isMounted
    ? typeof document !== 'undefined' &&
      document.documentElement.classList.contains('light')
      ? 'light'
      : 'dark'
    : resolvedTheme;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sfRef = useRef<Starfield | null>(null);

  useEffect(() => {
    if (mode !== 'dark') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sf = createStarfield(canvas, { reducedMotion });
    sfRef.current = sf;
    sf.start();

    const onResize = () => sf.resize();
    const onVis = () => {
      if (document.hidden) sf.stop();
      else sf.start();
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      sf.stop();
      sfRef.current = null;
    };
  }, [mode, reducedMotion]);

  return (
    <div
      data-ambient-background
      data-ambient-mode={mode}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <style jsx>{`
        /* ===== 浅色 · 林间晨光（dark 已改 canvas 渲染，不再需要 CSS keyframes） ===== */
        @keyframes shaft-sway-a {
          0%, 100% { transform: translate3d(-1.6vw, 0, 0) skewX(-14deg); opacity: 0.55; }
          50% { transform: translate3d(1.6vw, 0, 0) skewX(-11deg); opacity: 0.9; }
        }
        @keyframes shaft-sway-b {
          0%, 100% { transform: translate3d(1.4vw, 0, 0) skewX(-17deg); opacity: 0.4; }
          50% { transform: translate3d(-1.4vw, 0, 0) skewX(-13deg); opacity: 0.7; }
        }
        @keyframes shaft-sway-c {
          0%, 100% { transform: translate3d(-1vw, 0, 0) skewX(-10deg); opacity: 0.35; }
          50% { transform: translate3d(1vw, 0, 0) skewX(-12deg); opacity: 0.6; }
        }
        @keyframes bokeh-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
          50% { transform: translate3d(2.4vw, -1.6vh, 0) scale(1.06); opacity: 0.85; }
        }
        @keyframes pollen-float {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.55; }
          50% { transform: translate3d(0.8vw, -2vh, 0); opacity: 0.95; }
        }
        /* 落叶：旋转飘落 + 横向摆动（与花粉上浮形成运动对比） */
        @keyframes leaf-fall {
          0% { transform: translate3d(0, -6vh, 0) rotate(0deg); opacity: 0; }
          8% { opacity: 0.55; }
          50% { transform: translate3d(3vw, 48vh, 0) rotate(170deg); opacity: 0.5; }
          92% { opacity: 0.45; }
          100% { transform: translate3d(-2vw, 104vh, 0) rotate(340deg); opacity: 0; }
        }
        @keyframes tree-sway {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0.5vw, 0, 0); }
        }
        @keyframes sun-breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.04); opacity: 1; }
        }

        .shaft-sway-a { animation: shaft-sway-a 26s ease-in-out infinite; }
        .shaft-sway-b { animation: shaft-sway-b 33s ease-in-out infinite; }
        .shaft-sway-c { animation: shaft-sway-c 40s ease-in-out infinite; }
        .bokeh-drift { animation: bokeh-drift 30s ease-in-out infinite; }
        .bokeh-drift-alt { animation: bokeh-drift 38s ease-in-out -14s infinite; }
        .pollen-float { animation: pollen-float 24s ease-in-out infinite; }
        .pollen-float-alt { animation: pollen-float 32s ease-in-out -11s infinite; }
        .leaf-fall-a { animation: leaf-fall 19s linear infinite; }
        .leaf-fall-b { animation: leaf-fall 24s linear -8s infinite; }
        .leaf-fall-c { animation: leaf-fall 28s linear -15s infinite; }
        .tree-sway { animation: tree-sway 46s ease-in-out infinite; }
        .sun-breathe { animation: sun-breathe 32s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .shaft-sway-a, .shaft-sway-b, .shaft-sway-c,
          .bokeh-drift, .bokeh-drift-alt, .pollen-float, .pollen-float-alt,
          .leaf-fall-a, .leaf-fall-b, .leaf-fall-c,
          .tree-sway, .sun-breathe {
            animation: none;
          }
          .leaf-fall-a, .leaf-fall-b, .leaf-fall-c { opacity: 0; animation: none; }
        }
      `}</style>

      {mode === 'dark' ? (
        <div className="absolute inset-0" data-ambient-world="dark">
          {/* 深邃星空：canvas 渲染（三层星 + 慢流星 + 旋臂星系 + 紫蓝星云 + 微尘） */}
          <canvas
            ref={canvasRef}
            aria-hidden
            className="absolute inset-0 h-full w-full"
          />
          {/* 中部提亮暗角：保证正文/卡片可读 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 130% 100% at 50% 42%, transparent 58%, rgba(6, 14, 26, 0.3) 100%)',
            }}
          />
        </div>
      ) : (
        <div className="absolute inset-0" data-ambient-world="light">
          {/* 晨空底：暖金 → 雾绿 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #f6ecd4 0%, #f2ecd8 26%, #e6eed9 52%, #d2e2cc 78%, #c0d6c0 100%)',
            }}
          />
          {/* 旭日（居右，与深色满月镜像）：远视差 */}
          <motion.div
            className="absolute right-[8%] top-[4%] h-[min(44vh,380px)] w-[min(44vh,380px)]"
            style={{ y: reducedMotion ? 0 : yFar }}
          >
            <div
              data-sun
              className="sun-breathe h-full w-full rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255, 240, 200, 0.85) 0%, rgba(255, 216, 150, 0.42) 22%, rgba(250, 200, 140, 0.16) 44%, transparent 68%)',
              }}
            />
          </motion.div>
          {/* 林隙光柱 ×3：金色，错峰摇曳 */}
          <div
            className="shaft-sway-a absolute -top-[6%] left-[16%] h-[80vh] w-[16vw]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255, 226, 160, 0.5), rgba(255, 226, 160, 0.12) 55%, transparent 80%)',
              filter: 'blur(7px)',
            }}
          />
          <div
            className="shaft-sway-b absolute -top-[4%] left-[48%] h-[65vh] w-[10vw]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255, 214, 150, 0.42), rgba(255, 214, 150, 0.1) 55%, transparent 78%)',
              filter: 'blur(6px)',
            }}
          />
          <div
            className="shaft-sway-c absolute -top-[5%] right-[14%] h-[70vh] w-[12vw]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255, 232, 170, 0.38), rgba(255, 232, 170, 0.08) 55%, transparent 76%)',
              filter: 'blur(6px)',
            }}
          />
          {/* 柔和 bokeh ×3：金/绿光斑慢漂移 */}
          <div
            className="bokeh-drift absolute top-[26%] left-[10%] h-52 w-52 rounded-full"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255, 224, 160, 0.4), transparent 68%)',
              filter: 'blur(10px)',
            }}
          />
          <div
            className="bokeh-drift-alt absolute top-[48%] right-[10%] h-64 w-64 rounded-full"
            style={{
              background:
                'radial-gradient(circle at center, rgba(170, 210, 160, 0.35), transparent 70%)',
              filter: 'blur(12px)',
            }}
          />
          <div
            className="bokeh-drift absolute bottom-[16%] left-[38%] h-44 w-44 rounded-full"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255, 236, 190, 0.3), transparent 68%)',
              filter: 'blur(9px)',
              animationDelay: '-20s',
            }}
          />
          {/* 花粉光尘 ×2：上浮（与落叶下坠形成运动对比） */}
          <div
            className="pollen-float absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle 2px at 16% 34%, rgba(255, 232, 170, 0.75) 0%, transparent 100%), radial-gradient(circle 1.5px at 34% 22%, rgba(255, 244, 210, 0.7) 0%, transparent 100%), radial-gradient(circle 2px at 58% 40%, rgba(255, 226, 150, 0.7) 0%, transparent 100%), radial-gradient(circle 1.5px at 76% 28%, rgba(255, 244, 210, 0.65) 0%, transparent 100%), radial-gradient(circle 2px at 88% 52%, rgba(255, 232, 170, 0.6) 0%, transparent 100%)',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div
            className="pollen-float-alt absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle 1.5px at 24% 62%, rgba(255, 244, 210, 0.65) 0%, transparent 100%), radial-gradient(circle 2px at 46% 54%, rgba(255, 232, 170, 0.6) 0%, transparent 100%), radial-gradient(circle 1.5px at 68% 70%, rgba(255, 226, 150, 0.55) 0%, transparent 100%), radial-gradient(circle 1.5px at 84% 44%, rgba(255, 244, 210, 0.6) 0%, transparent 100%)',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {/* 落叶 ×3：旋转飘落 + 横摆 */}
          {[
            { left: '22%', cls: 'leaf-fall-a', size: 10, color: 'rgba(120, 165, 95, 0.55)' },
            { left: '55%', cls: 'leaf-fall-b', size: 8, color: 'rgba(150, 180, 100, 0.5)' },
            { left: '78%', cls: 'leaf-fall-c', size: 12, color: 'rgba(105, 150, 90, 0.45)' },
          ].map((leaf) => (
            <span
              key={leaf.cls}
              data-leaf
              className={`ambient-leaf ${leaf.cls} absolute top-0`}
              style={{
                left: leaf.left,
                width: `${leaf.size}px`,
                height: `${leaf.size}px`,
                background: leaf.color,
                borderRadius: '60% 0 60% 60%',
                opacity: 0,
                willChange: 'transform, opacity',
              }}
            />
          ))}
          {/* 冷杉林剪影 ×2（近景视差，远浅近深） */}
          <motion.div
            className="absolute bottom-[6%] left-0 w-full h-[22vh]"
            style={{ y: reducedMotion ? 0 : yNear }}
          >
            <svg
              data-treeline="far"
              className="tree-sway h-full w-full"
              viewBox="0 0 1440 180"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M0 180 V116 L36 116 L56 72 L76 116 L112 116 L136 48 L160 116 L206 116 L232 80 L258 116 L304 116 L334 58 L364 116 L414 116 L444 84 L474 116 L524 116 L554 44 L584 116 L644 116 L674 74 L704 116 L764 116 L794 58 L824 116 L884 116 L914 88 L944 116 L1004 116 L1034 52 L1064 116 L1124 116 L1154 78 L1184 116 L1244 116 L1274 62 L1304 116 L1364 116 L1394 84 L1424 116 L1440 116 V180 Z"
                fill="rgba(120, 160, 125, 0.4)"
              />
            </svg>
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-0 w-full h-[16vh]"
            style={{ y: reducedMotion ? 0 : yNear }}
          >
            <svg
              data-treeline="near"
              className="h-full w-full"
              viewBox="0 0 1440 140"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M0 140 V92 L48 92 L74 40 L100 92 L152 92 L182 24 L212 92 L272 92 L304 56 L336 92 L400 92 L436 30 L472 92 L540 92 L574 62 L608 92 L676 92 L712 20 L748 92 L820 92 L856 52 L892 92 L960 92 L996 34 L1032 92 L1104 92 L1140 58 L1176 92 L1244 92 L1280 28 L1316 92 L1380 92 L1412 52 L1440 92 V140 Z"
                fill="rgba(72, 110, 82, 0.5)"
              />
            </svg>
          </motion.div>
          {/* 鹿剪影：立于林间 */}
          <svg
            data-deer
            className="absolute bottom-[13%] left-[16%] h-[9vh] w-auto"
            viewBox="0 0 100 96"
            aria-hidden
          >
            <path
              d="M18 66 C20 61 26 59 34 58 L50 56 C54 55 56 51 58 45 L60 37 C61 34 63 32 66 31 L70 29 L72 23 L74 25 L76 20 L78 22 L81 17 L83 20 C85 23 84 27 82 31 L78 37 C76 43 75 49 74 55 L73 61 C75 64 75 69 75 75 L75 88 L71 88 L71 74 C70 70 68 68 64 68 L40 70 C36 71 33 74 32 80 L31 88 L27 88 L27 76 C26 72 22 70 18 66 Z"
              fill="rgba(84, 105, 78, 0.65)"
            />
          </svg>
          {/* 中间更透，利于卡片 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 125% 95% at 50% 42%, transparent 55%, rgba(240, 238, 220, 0.34) 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>
      )}
    </div>
  );
}
