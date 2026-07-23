'use client';

import { useTheme } from '@/context/theme-context';
import { motion, useScroll, useTransform } from '@/lib/framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

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
  const yMoon = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const yMid = useTransform(scrollYProgress, [0, 1], [0, 56]);
  const yNear = useTransform(scrollYProgress, [0, 1], [0, 84]);

  const mode: 'dark' | 'light' = !isMounted
    ? typeof document !== 'undefined' &&
      document.documentElement.classList.contains('light')
      ? 'light'
      : 'dark'
    : resolvedTheme;

  return (
    <div
      data-ambient-background
      data-ambient-mode={mode}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <style jsx>{`
        /* ===== 深色 · 月夜云海 ===== */
        @keyframes moon-soft {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.03); opacity: 1; }
        }
        @keyframes cloud-slow {
          0%, 100% { transform: translate3d(-2vw, 0, 0); }
          50% { transform: translate3d(2vw, 0, 0); }
        }
        @keyframes cloud-slow-alt {
          0%, 100% { transform: translate3d(2.4vw, 0, 0); }
          50% { transform: translate3d(-2.4vw, 0, 0); }
        }
        @keyframes cloud-slow-c {
          0%, 100% { transform: translate3d(-3vw, 0, 0); }
          50% { transform: translate3d(3vw, 0, 0); }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.9; }
        }
        /* 流星 A（快）：16s 周期 → 14s，可见窗口更短，一闪而过 */
        @keyframes meteor-fall {
          0%, 86% { transform: translate3d(0, 0, 0) rotate(-30deg); opacity: 0; }
          88% { opacity: 1; }
          92.5% { transform: translate3d(-36vw, 22vh, 0) rotate(-30deg); opacity: 1; }
          94.5%, 100% { transform: translate3d(-40vw, 25vh, 0) rotate(-30deg); opacity: 0; }
        }
        /* 流星 B（慢）：22s → 24s，划过更从容，与 A 形成速度差 */
        @keyframes meteor-fall-b {
          0%, 88% { transform: translate3d(0, 0, 0) rotate(28deg); opacity: 0; }
          90% { opacity: 0.9; }
          95.5% { transform: translate3d(32vw, 19vh, 0) rotate(28deg); opacity: 0.9; }
          97.5%, 100% { transform: translate3d(37vw, 22vh, 0) rotate(28deg); opacity: 0; }
        }
        /* 流星亮核闪烁（燃烧感，仅可见窗口内起作用） */
        @keyframes meteor-head-flicker {
          0%, 100% { opacity: 1; }
          25% { opacity: 0.55; }
          50% { opacity: 0.95; }
          75% { opacity: 0.7; }
        }
        /* 尾迹：左侧收成尖的三角渐变 */
        .meteor-tail {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          height: 2px;
          filter: blur(0.4px);
        }
        /* 核后亮带：贴核最亮 → 12% 处快衰减 → 尾端渐隐 */
        .meteor-tail-right {
          right: 3px;
          width: 110px;
          background: linear-gradient(to left,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(222, 238, 252, 0.72) 10%,
            rgba(200, 222, 246, 0.32) 42%,
            rgba(190, 214, 240, 0.1) 70%,
            transparent 100%);
          clip-path: polygon(0 50%, 100% 0, 100% 100%);
        }
        .meteor-tail-left {
          left: 3px;
          width: 80px;
          background: linear-gradient(to right,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(222, 238, 252, 0.65) 10%,
            rgba(200, 222, 246, 0.28) 42%,
            rgba(190, 214, 240, 0.08) 70%,
            transparent 100%);
          clip-path: polygon(0 0, 100% 50%, 0 100%);
        }
        /* 亮核 + 光晕 */
        .meteor-head {
          position: absolute;
          top: 50%;
          width: 3px;
          height: 3px;
          border-radius: 9999px;
          transform: translateY(-50%);
          background: rgba(248, 251, 255, 0.95);
          box-shadow:
            0 0 4px 1px rgba(236, 246, 255, 0.9),
            0 0 14px 4px rgba(190, 214, 240, 0.45);
          animation: meteor-head-flicker 0.7s linear infinite;
        }
        .meteor-head-right { right: 0; }
        .meteor-head-left { left: 0; }
        /* 月光海路：倒影带轻微颤动 */
        @keyframes moon-road-shimmer {
          0%, 100% { opacity: 0.55; transform: scaleX(1); }
          50% { opacity: 0.9; transform: scaleX(1.06); }
        }
        /* 星座：整体呼吸明灭 + 连线描边绘入（一次性） */
        @keyframes constellation-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.95; }
        }
        @keyframes constellation-draw {
          from { stroke-dashoffset: 260; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes ground-breathe {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .moon-soft { animation: moon-soft 36s ease-in-out infinite; }
        .cloud-slow { animation: cloud-slow 55s ease-in-out infinite; }
        .cloud-slow-alt { animation: cloud-slow-alt 75s ease-in-out infinite; }
        .cloud-slow-c { animation: cloud-slow-c 95s ease-in-out infinite; }
        .star-twinkle { animation: star-twinkle 5s ease-in-out infinite; }
        .star-twinkle-alt { animation: star-twinkle 7s ease-in-out -3s infinite; }
        .meteor-fall { animation: meteor-fall 14s cubic-bezier(0.33, 0, 0.2, 1) 5s infinite; }
        .meteor-fall-b { animation: meteor-fall-b 24s cubic-bezier(0.33, 0, 0.2, 1) 11s infinite; }
        .moon-road-shimmer { animation: moon-road-shimmer 9s ease-in-out infinite; }
        .constellation-pulse { animation: constellation-pulse 12s ease-in-out infinite; }
        .constellation-draw-line {
          stroke-dasharray: 260;
          stroke-dashoffset: 260;
          animation: constellation-draw 4s ease-out 0.6s forwards;
        }
        .ground-breathe { animation: ground-breathe 36s ease-in-out infinite; }

        /* ===== 浅色 · 林间晨光 ===== */
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
          .moon-soft, .cloud-slow, .cloud-slow-alt, .cloud-slow-c,
          .star-twinkle, .star-twinkle-alt, .meteor-fall, .meteor-fall-b,
          .moon-road-shimmer, .constellation-pulse, .ground-breathe,
          .shaft-sway-a, .shaft-sway-b, .shaft-sway-c,
          .bokeh-drift, .bokeh-drift-alt, .pollen-float, .pollen-float-alt,
          .leaf-fall-a, .leaf-fall-b, .leaf-fall-c,
          .tree-sway, .sun-breathe {
            animation: none;
          }
          .meteor-fall, .meteor-fall-b, .meteor-head,
          .leaf-fall-a, .leaf-fall-b, .leaf-fall-c { opacity: 0; animation: none; }
          .constellation-draw-line {
            animation: none;
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      {mode === 'dark' ? (
        <div className="absolute inset-0" data-ambient-world="dark">
          {/* 夜空底：深邃蓝夜（与浅色暖金绿色域分离） */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #060d1a 0%, #0e1d33 30%, #1d3350 56%, #16273e 80%, #0a1626 100%)',
            }}
          />
          {/* 星空 ×2：明灭（远景视差） */}
          <motion.div
            className="star-twinkle absolute inset-x-0 top-0 h-[42vh]"
            style={{
              backgroundImage:
                'radial-gradient(circle 1.4px at 12% 18%, rgba(232,240,252,0.9) 0%, transparent 100%), radial-gradient(circle 1px at 28% 8%, rgba(214,228,248,0.8) 0%, transparent 100%), radial-gradient(circle 1.2px at 45% 22%, rgba(232,240,252,0.85) 0%, transparent 100%), radial-gradient(circle 1px at 58% 10%, rgba(214,228,248,0.75) 0%, transparent 100%), radial-gradient(circle 1.4px at 71% 26%, rgba(232,240,252,0.9) 0%, transparent 100%), radial-gradient(circle 1px at 86% 12%, rgba(214,228,248,0.8) 0%, transparent 100%), radial-gradient(circle 1px at 35% 32%, rgba(214,228,248,0.7) 0%, transparent 100%), radial-gradient(circle 1.2px at 93% 34%, rgba(232,240,252,0.8) 0%, transparent 100%)',
              backgroundRepeat: 'no-repeat',
              y: reducedMotion ? 0 : yFar,
            }}
          />
          <motion.div
            className="star-twinkle-alt absolute inset-x-0 top-0 h-[42vh]"
            style={{
              backgroundImage:
                'radial-gradient(circle 1px at 8% 30%, rgba(214,228,248,0.7) 0%, transparent 100%), radial-gradient(circle 1.2px at 22% 16%, rgba(232,240,252,0.85) 0%, transparent 100%), radial-gradient(circle 1px at 52% 28%, rgba(214,228,248,0.7) 0%, transparent 100%), radial-gradient(circle 1.3px at 66% 14%, rgba(232,240,252,0.85) 0%, transparent 100%), radial-gradient(circle 1px at 79% 20%, rgba(214,228,248,0.7) 0%, transparent 100%)',
              backgroundRepeat: 'no-repeat',
              y: reducedMotion ? 0 : yFar,
            }}
          />

          {/* 满月（居左，与浅色旭日镜像）：柔和光月 + 环形山 */}
          <motion.div
            className="absolute left-[10%] top-[6%] h-[min(30vh,260px)] w-[min(30vh,260px)]"
            style={{ y: reducedMotion ? 0 : yMoon }}
          >
            <div
              data-moon
              className="moon-soft h-full w-full rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 46% 44%, rgba(238, 244, 252, 0.72) 0%, rgba(222, 234, 248, 0.5) 14%, rgba(198, 216, 238, 0.3) 30%, rgba(165, 190, 220, 0.14) 48%, rgba(140, 168, 200, 0.05) 62%, transparent 76%)',
                filter: 'blur(2px)',
              }}
            >
              <div
                className="absolute left-[30%] top-[26%] h-[14%] w-[14%] rounded-full"
                style={{ background: 'radial-gradient(circle at center, rgba(148, 172, 205, 0.18), transparent 70%)', filter: 'blur(1px)' }}
              />
              <div
                className="absolute left-[52%] top-[40%] h-[10%] w-[10%] rounded-full"
                style={{ background: 'radial-gradient(circle at center, rgba(148, 172, 205, 0.15), transparent 70%)', filter: 'blur(1px)' }}
              />
              <div
                className="absolute left-[38%] top-[52%] h-[8%] w-[8%] rounded-full"
                style={{ background: 'radial-gradient(circle at center, rgba(148, 172, 205, 0.14), transparent 70%)', filter: 'blur(1px)' }}
              />
            </div>
          </motion.div>

          {/* 星座连线（居右）：描边绘入的小北斗 */}
          <svg
            data-constellation
            className="constellation-pulse absolute right-[10%] top-[8%] h-[16vh] w-[22vw] max-w-[280px]"
            viewBox="0 0 200 120"
            aria-hidden
          >
            <polyline
              className="constellation-draw-line"
              points="20,90 48,78 76,80 100,62 130,50 152,26 170,30 152,52"
              fill="none"
              stroke="rgba(200, 220, 245, 0.35)"
              strokeWidth="0.8"
            />
            {[ [20,90], [48,78], [76,80], [100,62], [130,50], [152,26], [170,30] ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.2" fill="rgba(232, 242, 252, 0.9)" />
            ))}
          </svg>

          {/* 月晕（居左托月） */}
          <motion.div
            className="absolute left-[-6%] top-[-6%] h-[72vh] w-[72vw]"
            style={{
              background:
                'radial-gradient(ellipse 55% 50% at 55% 40%, rgba(185, 208, 238, 0.14) 0%, rgba(120, 155, 200, 0.08) 30%, rgba(80, 115, 160, 0.04) 52%, transparent 72%)',
              y: reducedMotion ? 0 : yMoon,
            }}
          />

          {/* 月光海路：宽而淡的倒影带（视差包裹 + 内部颤动） */}
          <motion.div
            className="absolute left-[8%] top-[24%] h-[38vh] w-[13vw] min-w-[90px]"
            style={{ y: reducedMotion ? 0 : yMoon }}
          >
            <div
              data-moon-road
              className="moon-road-shimmer h-full w-full"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(214, 230, 248, 0.16), rgba(198, 220, 244, 0.09) 38%, rgba(184, 208, 236, 0.04) 68%, transparent)',
                filter: 'blur(14px)',
                transformOrigin: 'center top',
              }}
            />
          </motion.div>

          {/* 云海 ×3：月光银边 + 三速漂移（中景视差包裹） */}
          <motion.div
            className="absolute left-[-8%] top-[24%] h-[16vh] w-[116%]"
            style={{ y: reducedMotion ? 0 : yMid }}
          >
            <div className="cloud-slow absolute inset-0">
              <div
                className="absolute inset-x-0 top-0 h-[30%]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(205, 222, 242, 0.22) 25%, rgba(218, 234, 248, 0.3) 55%, rgba(198, 216, 238, 0.2) 80%, transparent 100%)',
                  filter: 'blur(14px)',
                }}
              />
              <div
                className="absolute inset-x-0 top-[20%] bottom-0"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(40, 62, 88, 0.5) 22%, rgba(70, 105, 140, 0.34) 50%, rgba(38, 60, 84, 0.44) 78%, transparent 100%)',
                  filter: 'blur(22px)',
                }}
              />
            </div>
          </motion.div>
          <motion.div
            className="absolute left-[-6%] top-[42%] h-[15vh] w-[112%]"
            style={{ y: reducedMotion ? 0 : yMid }}
          >
            <div className="cloud-slow-alt absolute inset-0">
              <div
                className="absolute inset-x-0 top-0 h-[26%]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(200, 218, 240, 0.16) 30%, rgba(212, 228, 246, 0.22) 60%, transparent 100%)',
                  filter: 'blur(12px)',
                }}
              />
              <div
                className="absolute inset-x-0 top-[18%] bottom-0"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(30, 50, 74, 0.52) 30%, rgba(55, 88, 120, 0.32) 58%, transparent 100%)',
                  filter: 'blur(26px)',
                }}
              />
            </div>
          </motion.div>
          <motion.div
            className="absolute left-[-12%] bottom-[6%] h-[18vh] w-[124%]"
            style={{ y: reducedMotion ? 0 : yMid }}
          >
            <div
              className="cloud-slow-c absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(18, 36, 56, 0.55) 20%, rgba(38, 62, 88, 0.4) 55%, rgba(22, 42, 64, 0.5) 82%, transparent 100%)',
                filter: 'blur(28px)',
              }}
            />
          </motion.div>

          {/* 流星 A：右上向左下（亮核 + 渐尖尾迹） */}
          <div
            data-meteor
            className="meteor-fall absolute right-[8%] top-[10%] h-[3px] w-32"
            style={{ opacity: 0, willChange: 'transform, opacity' }}
          >
            <span className="meteor-tail meteor-tail-right" />
            <span className="meteor-head meteor-head-right" />
          </div>
          {/* 流星 B：中部反向错峰 */}
          <div
            data-meteor="b"
            className="meteor-fall-b absolute left-[42%] top-[14%] h-[3px] w-24"
            style={{ opacity: 0, willChange: 'transform, opacity' }}
          >
            <span className="meteor-head meteor-head-left" />
            <span className="meteor-tail meteor-tail-left" />
          </div>

          {/* 山脉剪影 ×2（近景视差，远浅近深） */}
          <motion.div
            className="absolute bottom-[10%] left-0 w-full h-[18vh]"
            style={{ y: reducedMotion ? 0 : yNear }}
          >
            <svg
              data-ridge="far"
              className="h-full w-full"
              viewBox="0 0 1440 150"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M0 150 V108 L120 78 L260 112 L390 60 L520 104 L660 72 L800 110 L940 66 L1080 106 L1220 76 L1360 108 L1440 88 V150 Z"
                fill="rgba(14, 30, 52, 0.55)"
              />
            </svg>
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-0 w-full h-[13vh]"
            style={{ y: reducedMotion ? 0 : yNear }}
          >
            <svg
              data-ridge="near"
              className="h-full w-full"
              viewBox="0 0 1440 110"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M0 110 V76 L160 40 L320 80 L480 30 L640 74 L820 44 L980 82 L1140 38 L1300 78 L1440 52 V110 Z"
                fill="rgba(7, 16, 30, 0.8)"
              />
            </svg>
          </motion.div>

          {/* 远灯带：呼应视频路灯暖点 */}
          <div
            className="absolute inset-x-[12%] bottom-[24%] h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(212, 168, 75, 0.16) 15%, rgba(212, 168, 75, 0.09) 50%, rgba(212, 168, 75, 0.16) 85%, transparent)',
              filter: 'blur(3px)',
            }}
          />
          {/* 近地草雾（近景视差） */}
          <motion.div
            className="ground-breathe absolute inset-x-0 bottom-0 h-[34vh]"
            style={{
              background:
                'linear-gradient(to top, rgba(7, 15, 28, 0.72) 0%, rgba(16, 32, 52, 0.26) 45%, transparent 100%)',
              y: reducedMotion ? 0 : yNear,
            }}
          />
          {/* 中间更透，利于卡片 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 130% 100% at 50% 42%, transparent 58%, rgba(6, 14, 26, 0.3) 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.028]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
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
