'use client';

import type { ReactNode } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { FadeIn } from '@/components/motion';
import { cn } from '@/lib/utils';

export interface StatsSoftCardProps {
  children: ReactNode;
  className?: string;
  /** 标题区左侧图标（已包好） */
  icon?: ReactNode;
  title: string;
  /** 右上角 meta，如「近6个月」 */
  meta?: ReactNode;
  /** 无障碍标签 */
  'aria-label'?: string;
  /** 是否包一层 FadeIn 入场 */
  fadeIn?: boolean;
}

/**
 * 首页统计 · 柔雾仪表壳
 * - 统一圆角/玻璃/顶线高光
 * - 无装饰圆环、无硬网格
 */
export default function StatsSoftCard({
  children,
  className,
  icon,
  title,
  meta,
  'aria-label': ariaLabel,
  fadeIn = true,
}: StatsSoftCardProps) {
  const body = (
    <GlassCard
      padding="none"
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 sm:p-6',
        'bg-glass/30 border-glass-border',
        'transition-[box-shadow,border-color] duration-300 ease-out',
        'hover:border-primary/30 hover:shadow-[0_12px_40px_color-mix(in_oklab,var(--primary)_12%,transparent)]',
        className
      )}
      aria-label={ariaLabel ?? title}
    >
      {/* 顶边柔光一线 — 非圆环 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent"
        aria-hidden
      />
      <div className="relative z-10 mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center text-primary">
              {icon}
            </div>
          ) : null}
          <h3 className="truncate font-serif text-lg font-semibold text-foreground sm:text-xl">
            {title}
          </h3>
        </div>
        {meta ? (
          <div className="shrink-0 text-xs text-muted-foreground">{meta}</div>
        ) : null}
      </div>
      <div className="relative z-10">{children}</div>
    </GlassCard>
  );

  if (!fadeIn) {
    return body;
  }

  return <FadeIn>{body}</FadeIn>;
}

/** KPI 小格：柔玻璃 + tabular 数字 */
export function StatsKpiCell({
  label,
  children,
  hint,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-t border-primary/15 p-3 text-center',
        'transition-colors duration-200 hover:border-primary/40',
        className
      )}
    >
      <div className="mb-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-serif text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
        {children}
      </div>
      {hint ? (
        <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
