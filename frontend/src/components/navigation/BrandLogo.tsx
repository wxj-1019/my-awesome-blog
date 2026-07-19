'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  /** 导航栏是否处于强调态（滚动/悬停），仅影响视觉，不改布局宽度 */
  emphasized?: boolean;
  className?: string;
}

/**
 * 站点品牌 Logo：固定宽度 monogram + 字标。
 * 深/浅色均用实心 primary 底 + primary-foreground 图标，保证对比度。
 * 透明导航叠在视频上时，字标用实色 foreground + 轻阴影。
 */
export default function BrandLogo({
  emphasized = false,
  className,
}: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="Awesome Blog 首页"
      className={cn(
        'group flex items-center gap-2.5 h-10 w-[9.5rem] sm:w-[10.5rem] flex-shrink-0',
        'rounded-lg px-1 -mx-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <span
        className={cn(
          'relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
          // 实心品牌色（非半透明渐变）
          'bg-primary text-primary-foreground',
          // 与页面背景隔离的描边，深浅主题都清晰
          'ring-2 ring-background shadow-md shadow-black/10 dark:shadow-black/40',
          'transition-[box-shadow,transform] duration-300',
          emphasized && 'shadow-lg shadow-primary/30',
          'group-hover:scale-[1.03] group-hover:shadow-lg group-hover:shadow-primary/35'
        )}
      >
        <BrandMark className="h-6 w-6" />
      </span>

      <span className="flex min-w-0 flex-col justify-center leading-none">
        <span
          className={cn(
            'font-display text-sm font-bold tracking-tight truncate',
            'text-foreground',
            // 叠在亮/暗视频上时略提清晰度
            '[text-shadow:0_1px_2px_color-mix(in_oklab,var(--background)_70%,transparent)]',
            'transition-colors duration-300 group-hover:text-primary'
          )}
        >
          Awesome
        </span>
        <span
          className={cn(
            'mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] truncate',
            // 比 muted-foreground 更易读
            'text-foreground/75 dark:text-foreground/80',
            '[text-shadow:0_1px_2px_color-mix(in_oklab,var(--background)_70%,transparent)]',
            'transition-colors duration-300 group-hover:text-primary/90'
          )}
        >
          Blog
        </span>
      </span>
    </Link>
  );
}

/** monogram：纯 currentColor 实心路径，继承 primary-foreground */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-primary-foreground', className)}
      aria-hidden
    >
      <path
        d="M16 7.5 8.2 25.5h3.5l1.4-3.5h6.8l1.4 3.5h3.5L16 7.5Z"
        fill="currentColor"
      />
      {/* 中空：用背景色挖空，保证任何主题下都是「底色洞」而非半透明糊在一起 */}
      <path d="M13.2 18h5.6L16 11.2 13.2 18Z" className="fill-primary" />
      <path
        d="M8.5 27h15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24.2" cy="9" r="1.8" fill="currentColor" />
    </svg>
  );
}
