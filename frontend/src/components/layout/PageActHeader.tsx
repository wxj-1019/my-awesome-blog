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
  /** kicker 艺术字体类（如 font-tarot / font-creative），不传则用默认 font-medium */
  kickerFont?: string;
  /** 标题下方额外内容（徽章、统计等） */
  children?: ReactNode;
}

/**
 * 幕标式页面头部：与首页「分幕」叙事同源。
 * kicker 小字（tracking 加宽）→ 标题 → 描述 → 渐变引线。
 * 标题/描述为透出氛围背景上的裸文字：两个氛围世界均为深色底，统一 text-white 系；
 * 入场用 FadeIn（自带 reduced-motion 回退）。
 */
export default function PageActHeader({
  kicker,
  title,
  description,
  icon: Icon,
  align = 'center',
  className,
  kickerFont,
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
          className={cn(
            'text-[11px] sm:text-xs tracking-[0.28em] text-white/80',
            kickerFont ?? 'font-medium'
          )}
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-sm">
          {title}
        </h1>
      </div>

      {description ? (
        <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
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
