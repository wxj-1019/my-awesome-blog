'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/motion';

export interface PageActHeaderProps {
  /** 幕标小字（ eyebrow ），如「第五幕 · 影音」或英文 kicker */
  kicker?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  align?: 'center' | 'left';
  className?: string;
  /** 标题下方额外内容（徽章、统计等） */
  children?: ReactNode;
}

/**
 * 幕标式页面头部：与首页「分幕」叙事同源。
 * kicker 小字（tracking 加宽 + primary）→ 标题 → 描述 → 渐变引线。
 * 颜色全走 token；入场用 FadeIn（自带 reduced-motion 回退）。
 */
export default function PageActHeader({
  kicker,
  title,
  description,
  icon: Icon,
  align = 'center',
  className,
  children,
}: PageActHeaderProps) {
  const centered = align === 'center';

  return (
    <FadeIn
      className={cn(
        'mb-10',
        centered ? 'max-w-2xl mx-auto text-center' : 'max-w-4xl',
        className
      )}
    >
      {kicker ? (
        <p
          data-act-kicker
          className="text-[11px] sm:text-xs font-medium tracking-[0.28em] text-primary/90"
        >
          {kicker}
        </p>
      ) : null}

      <div
        className={cn(
          'mt-3 flex items-center gap-3',
          centered && 'justify-center'
        )}
      >
        {Icon ? (
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/15 text-primary">
            <Icon className="w-5 h-5" aria-hidden />
          </span>
        ) : null}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          {title}
        </h1>
      </div>

      {description ? (
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}

      {/* 渐变引线：与首页幕标同源 */}
      <div
        className={cn(
          'mt-4 h-px w-16 bg-gradient-to-r from-primary/70 to-transparent',
          centered && 'mx-auto bg-gradient-to-r from-transparent via-primary/70 to-transparent'
        )}
        aria-hidden
      />

      {children ? <div className="mt-5">{children}</div> : null}
    </FadeIn>
  );
}
