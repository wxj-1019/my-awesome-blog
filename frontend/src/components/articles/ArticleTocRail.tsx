'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, List } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import type { TocHeading } from '@/hooks/useActiveHeading';

interface ArticleTocRailProps {
  headings: TocHeading[];
  activeId: string;
  progress: number;
  cardBgClass: string;
  textClass: string;
  mutedTextClass: string;
  accentActiveClass: string;
  idleLinkClass: string;
  /** 桌面 sticky 左轨；移动用抽屉 */
  variant?: 'rail' | 'drawer';
  className?: string;
}

function scrollToHeading(id: string, reduced: boolean) {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }
  el.scrollIntoView({
    behavior: reduced ? 'auto' : 'smooth',
    block: 'start',
  });
  // 更新 hash 但不触发默认跳变
  if (typeof history !== 'undefined') {
    history.replaceState(null, '', `#${id}`);
  }
}

export default function ArticleTocRail({
  headings,
  activeId,
  progress,
  cardBgClass,
  textClass,
  mutedTextClass,
  accentActiveClass,
  idleLinkClass,
  variant = 'rail',
  className,
}: ArticleTocRailProps) {
  const reduced = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const body = (
    <>
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className={cn('text-lg font-semibold', textClass)}>目录</h3>
        <span className={cn('text-xs tabular-nums', mutedTextClass)}>
          {progress}%
        </span>
      </div>
      <div className="mb-4">
        <Progress value={progress} className="w-full h-1.5" />
      </div>
      {headings.length === 0 ? (
        <p className={cn('text-sm', mutedTextClass)}>本文暂无目录</p>
      ) : (
        <nav className="space-y-1 max-h-[50vh] overflow-y-auto pr-1" aria-label="文章目录">
          {headings.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                scrollToHeading(item.id, reduced);
                setDrawerOpen(false);
              }}
              className={cn(
                'block w-full text-left py-1.5 px-3 rounded-md text-sm transition-colors',
                activeId === item.id ? accentActiveClass : idleLinkClass
              )}
              style={{ paddingLeft: `${12 + (item.level - 1) * 10}px` }}
            >
              {item.text}
            </button>
          ))}
        </nav>
      )}
      <div className="mt-6 pt-4 border-t border-dashed border-opacity-30">
        <Link href="/articles" prefetch={false}>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>
      </div>
    </>
  );

  if (variant === 'drawer') {
    return (
      <div className={cn('lg:hidden', className)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="fixed bottom-6 right-4 z-40 shadow-lg"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-expanded={drawerOpen}
        >
          <List className="h-4 w-4 mr-2" />
          目录
        </Button>
        {drawerOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/40"
              aria-label="关闭目录"
              onClick={() => setDrawerOpen(false)}
            />
            <GlassCard
              className={cn(
                'fixed bottom-20 right-4 left-4 z-50 p-5 max-h-[70vh] overflow-auto',
                cardBgClass
              )}
            >
              {body}
            </GlassCard>
          </>
        )}
      </div>
    );
  }

  if (headings.length === 0) {
    return (
      <GlassCard
        padding="none"
        className={cn(
          'p-5 xl:p-6 xl:sticky xl:top-24 shadow-xl xl:shadow-lg',
          cardBgClass,
          className
        )}
      >
        <Link href="/articles" prefetch={false}>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      padding="none"
      className={cn(
        // xl+ 文档流内 sticky；lg 由父级 fixed 定位
        'p-5 xl:p-6 xl:sticky xl:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto shadow-xl xl:shadow-lg',
        cardBgClass,
        className
      )}
    >
      {body}
    </GlassCard>
  );
}
