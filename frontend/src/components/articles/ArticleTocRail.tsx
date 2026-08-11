'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, List } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button, buttonVariants } from '@/components/ui/Button';
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

  useEffect(() => {
    if (variant !== 'drawer') {
      return;
    }

    const desktopQuery = window.matchMedia('(min-width: 1280px)');
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setDrawerOpen(false);
      }
    };

    if (desktopQuery.matches) {
      setDrawerOpen(false);
    }
    desktopQuery.addEventListener('change', closeAtDesktop);
    return () => desktopQuery.removeEventListener('change', closeAtDesktop);
  }, [variant]);

  const returnLink = (
    <Link
      href="/articles"
      prefetch={false}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'min-h-11 w-full justify-start'
      )}
    >
      <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
      返回列表
    </Link>
  );

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
        <nav
          className="space-y-1 max-h-[50vh] overflow-y-auto pr-1"
          aria-label="文章目录"
        >
          {headings.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                scrollToHeading(item.id, reduced);
                setDrawerOpen(false);
              }}
              aria-current={activeId === item.id ? 'location' : undefined}
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
        {returnLink}
      </div>
    </>
  );

  if (variant === 'drawer') {
    return (
      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <div className={cn('xl:hidden', className)}>
          <Dialog.Trigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-4 z-40 min-h-11 shadow-lg"
              aria-label={drawerOpen ? '关闭文章目录' : '打开文章目录'}
            >
              <List className="h-4 w-4 mr-2" />
              目录
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
            <Dialog.Content asChild aria-describedby={undefined}>
              <GlassCard
                className={cn(
                  'fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-4 left-4 z-50 p-5 max-h-[70vh] overflow-auto',
                  cardBgClass
                )}
              >
                <Dialog.Title className="sr-only">文章目录</Dialog.Title>
                {body}
              </GlassCard>
            </Dialog.Content>
          </Dialog.Portal>
        </div>
      </Dialog.Root>
    );
  }

  if (headings.length === 0) {
    return (
      <GlassCard
        padding="none"
        className={cn(
          'p-5 xl:p-6 shadow-xl xl:shadow-lg',
          cardBgClass,
          className
        )}
      >
        {returnLink}
      </GlassCard>
    );
  }

  return (
    <GlassCard
      padding="none"
      className={cn(
        'p-5 xl:p-6 max-h-[calc(100vh-7rem)] overflow-y-auto shadow-xl xl:shadow-lg',
        cardBgClass,
        className
      )}
    >
      {body}
    </GlassCard>
  );
}
