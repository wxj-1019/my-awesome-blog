'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  /** 导航栏是否处于强调态（滚动/悬停），仅影响视觉，不改布局宽度 */
  emphasized?: boolean;
  className?: string;
}

/**
 * 站点品牌 Logo：固定宽度 SVG + 字标，hover 只做色彩/透明度，不挤压导航项。
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
        // 固定槽位：防止强调态动画改变占位
        'group flex items-center gap-2.5 h-10 w-[9.5rem] sm:w-[10.5rem] flex-shrink-0',
        'text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg',
        className
      )}
    >
      {/* 固定 40×40 图标槽 */}
      <span
        className={cn(
          'relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
          'bg-gradient-to-br from-primary/90 to-tech-lightcyan/80',
          'shadow-sm shadow-primary/20 ring-1 ring-primary/30',
          'transition-shadow duration-300',
          emphasized && 'shadow-md shadow-primary/30'
        )}
      >
        <BrandMark className="h-6 w-6 text-primary-foreground transition-transform duration-300 group-hover:scale-105" />
      </span>

      {/* 固定宽度字标区：不因 hover 改变文案长度 */}
      <span className="flex min-w-0 flex-col justify-center leading-none">
        <span
          className={cn(
            'font-display text-sm font-bold tracking-tight truncate',
            'transition-colors duration-300',
            emphasized ? 'text-foreground' : 'text-foreground/90',
            'group-hover:text-primary'
          )}
        >
          Awesome
        </span>
        <span
          className={cn(
            'mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] truncate',
            'text-muted-foreground transition-colors duration-300',
            'group-hover:text-primary/80'
          )}
        >
          Blog
        </span>
      </span>
    </Link>
  );
}

/** 字母 A + 底部横笔的 monogram，viewBox 固定，currentColor 着色 */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* 抽象 A：两斜竖 + 中横 */}
      <path
        d="M16 5.5L6.5 26.5h4.2l1.7-4.2h7.2l1.7 4.2H25.5L16 5.5Z"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <path
        d="M16 8.2 9.1 24.2h3.1l1.35-3.35h5.1L20 24.2h3.05L16 8.2Z"
        fill="currentColor"
      />
      <path
        d="M13.15 17.85h5.7l-2.85-7.05-2.85 7.05Z"
        fill="currentColor"
        fillOpacity="0.35"
      />
      {/* 底部强调弧：科技感 */}
      <path
        d="M8 27.2h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="24.5" cy="8.5" r="1.6" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
