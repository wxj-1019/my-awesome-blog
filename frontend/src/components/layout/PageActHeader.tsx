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
  /** kicker 艺术字体类（如 font-gothic / font-creative），不传则用默认 font-medium。
   *  含「 · 」时拆分中英：英文用艺术字体放大成主视觉，中文降为辅助小字。 */
  kickerFont?: string;
  /** 标题下方额外内容（徽章、统计等） */
  children?: ReactNode;
}

/**
 * 幕标式页面头部：与首页「分幕」叙事同源。
 * kicker 小字（tracking 加宽）→ 标题 → 描述 → 渐变引线。
 * 标题/描述用语义 token（text-foreground/muted-foreground），双主题自适应——
 * 此前硬编码 text-white 在浅色主题的浅底上不可读；
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

  // kicker 含「 · 」且有艺术字体时：拆分中英，英文放大用艺术字体，中文降为辅助
  const kickerParts = kicker && kickerFont ? kicker.split(' · ') : null;
  const hasSplit = kickerParts && kickerParts.length === 2;

  return (
    <FadeIn
      className={cn(
        'mb-10',
        centered ? 'max-w-2xl mx-auto text-center' : 'max-w-4xl',
        className
      )}
    >
      {kicker ? (
        hasSplit ? (
          /* 拆分模式：英文用艺术字体放大 + 中文辅助小字（拉丁字体不渲染中文，需分离） */
          <div className={cn('flex flex-col items-center gap-1', !centered && 'items-start')}>
            <p
              data-act-kicker
              className={cn(
                'text-sm sm:text-base tracking-[0.2em] text-foreground/90',
                kickerFont
              )}
            >
              {kickerParts![1]}
            </p>
            <p className="text-[10px] tracking-[0.15em] text-muted-foreground font-medium">
              {kickerParts![0]}
            </p>
          </div>
        ) : (
          <p
            data-act-kicker
            className={cn(
              'text-[11px] sm:text-xs tracking-[0.28em] text-primary',
              kickerFont ?? 'font-medium'
            )}
          >
            {kicker}
          </p>
        )
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif tracking-wide text-foreground">
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
