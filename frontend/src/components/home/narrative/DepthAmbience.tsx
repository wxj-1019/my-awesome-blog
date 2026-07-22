'use client';

import { cn } from '@/lib/utils';
import { HOME_DEPTH, type HomeDepth } from './homeMotion';

export interface DepthAmbienceProps {
  /** 分幕深度：shallow 展厅 / cabin 舱内 / current 洋流 / shore 靠岸 */
  depth?: HomeDepth;
  className?: string;
}

/**
 * 四期 · 分幕环境层：让玻璃卡有「水」可透。
 *
 * 设计决策（对比 spec §4.2 的可选视差）：
 * - 本层全部静态 CSS，不挂 ScrollFloat/Parallax。滚动叙事由 Dive scrub 与
 *   幕标视差/接续引线承担，本层保持静止以免稀释焦点（静态 70% + 滚动 30% 原则）。
 * - 色彩全部走 CSS 变量 token（color-mix 百分比来自 HOME_DEPTH 预算），
 *   浅色模式同比例生效，不压文字对比。
 * - 纯装饰：pointer-events-none + aria-hidden，不拦截任何交互。
 */
export default function DepthAmbience({ depth, className }: DepthAmbienceProps) {
  if (!depth) {
    return null;
  }

  const budget = HOME_DEPTH[depth];

  return (
    <div
      data-depth-ambience={depth}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {/* 浅色模式压暗层降强度，避免 tech-darkblue 发灰压字（无 JS，纯 CSS 类切换） */}
      <style jsx>{`
        :global(.light) .depth-tint {
          opacity: 0.55;
        }
      `}</style>

      {/* 基调水色：给整幕一层极淡的水体色，玻璃折射才不空 */}
      <div
        className="depth-tint absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent, color-mix(in srgb, var(--primary) ${budget.tint}%, transparent) 45%, transparent)`,
        }}
      />

      {depth === 'shallow' && (
        /* 浅水展厅：顶部天光 */
        <div
          className="absolute inset-x-0 top-0 h-2/5"
          style={{
            background: `radial-gradient(ellipse 65% 100% at 50% 0%, color-mix(in srgb, var(--primary) ${budget.glow}%, transparent), transparent 72%)`,
          }}
        />
      )}

      {depth === 'cabin' && (
        <>
          {/* 舱内：舷窗式左右压暗 */}
          <div
            className="depth-tint absolute inset-y-0 left-0 w-[18%]"
            style={{
              background: `linear-gradient(to right, color-mix(in srgb, var(--tech-darkblue) ${budget.vignette}%, transparent), transparent)`,
            }}
          />
          <div
            className="depth-tint absolute inset-y-0 right-0 w-[18%]"
            style={{
              background: `linear-gradient(to left, color-mix(in srgb, var(--tech-darkblue) ${budget.vignette}%, transparent), transparent)`,
            }}
          />
          {/* 舱顶一盏弱仪表灯 */}
          <div
            className="absolute inset-x-0 top-0 h-1/4"
            style={{
              background: `radial-gradient(ellipse 40% 100% at 50% 0%, color-mix(in srgb, var(--primary) ${budget.glow}%, transparent), transparent 70%)`,
            }}
          />
        </>
      )}

      {depth === 'current' && (
        <>
          {/* 洋流：中轴两侧弱水色晕，托住描边路径 */}
          <div
            className="absolute inset-y-0 left-0 w-1/2"
            style={{
              background: `radial-gradient(ellipse 45% 60% at 18% 50%, color-mix(in srgb, var(--primary) ${budget.glow}%, transparent), transparent 70%)`,
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/2"
            style={{
              background: `radial-gradient(ellipse 45% 60% at 82% 50%, color-mix(in srgb, var(--tech-lightcyan) ${budget.glow}%, transparent), transparent 70%)`,
            }}
          />
        </>
      )}

      {depth === 'shore' && (
        /* 靠岸：自底部上浮的提亮 */
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background: `radial-gradient(ellipse 60% 100% at 50% 100%, color-mix(in srgb, var(--tech-lightcyan) ${budget.glow}%, transparent), transparent 72%)`,
          }}
        />
      )}

      {/* 边缘暗角（靠岸最轻）：收拢视线到幕中央 */}
      <div
        className="depth-tint absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 130% 90% at 50% 50%, transparent 62%, color-mix(in srgb, var(--tech-darkblue) ${budget.vignette}%, transparent) 100%)`,
        }}
      />
    </div>
  );
}
