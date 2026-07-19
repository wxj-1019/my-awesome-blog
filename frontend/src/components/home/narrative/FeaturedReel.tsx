'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { HOME_REEL } from './homeMotion';
import ReelCard, { type ReelHighlightItem } from './ReelCard';

export interface FeaturedReelProps {
  items: ReelHighlightItem[];
  className?: string;
}

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * 电影胶片卷轴：横滑 snap + 桌面拖拽阈值 + 键盘/箭头。
 * 自动漂移默认关。触控走原生 scroll-snap，避免与自定义 drag 打架。
 */
export default function FeaturedReel({ items, className }: FeaturedReelProps) {
  const reduced = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suppressClick, setSuppressClick] = useState(false);

  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startScroll: number;
    moved: boolean;
  }>({ active: false, pointerId: null, startX: 0, startScroll: 0, moved: false });

  const findNearestIndex = useCallback(() => {
    const root = scrollerRef.current;
    if (!root || items.length === 0) {
      return 0;
    }
    const center = root.scrollLeft + root.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    cardRefs.current.forEach((el, i) => {
      if (!el) {
        return;
      }
      const cardCenter = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(cardCenter - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }, [items.length]);

  const updateActiveFromScroll = useCallback(() => {
    setActiveIndex(findNearestIndex());
  }, [findNearestIndex]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const root = scrollerRef.current;
      const el = cardRefs.current[index];
      if (!root || !el) {
        return;
      }
      const left = el.offsetLeft - (root.clientWidth - el.offsetWidth) / 2;
      root.scrollTo({
        left: Math.max(0, left),
        behavior: reduced ? 'auto' : 'smooth',
      });
      setActiveIndex(index);
    },
    [reduced]
  );

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) {
      return;
    }
    updateActiveFromScroll();
    const onScroll = () => {
      updateActiveFromScroll();
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateActiveFromScroll);
    return () => {
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateActiveFromScroll);
    };
  }, [updateActiveFromScroll, items.length]);

  /** 非 passive wheel：React 合成事件无法可靠 preventDefault */
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || reduced) {
      return;
    }

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) {
        return;
      }
      const atStart = root.scrollLeft <= 0;
      const atEnd = root.scrollLeft + root.clientWidth >= root.scrollWidth - 2;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) {
        return;
      }
      e.preventDefault();
      root.scrollLeft += e.deltaY;
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, [reduced, items.length]);

  const go = useCallback(
    (delta: number) => {
      const next = Math.min(items.length - 1, Math.max(0, activeIndex + delta));
      scrollToIndex(next);
    },
    [activeIndex, items.length, scrollToIndex]
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToIndex(items.length - 1);
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // 触控：原生横滑 + snap，避免自定义 drag 抢手势
    if (e.pointerType === 'touch' || isCoarsePointer()) {
      return;
    }
    if (e.button !== 0) {
      return;
    }
    const root = scrollerRef.current;
    if (!root) {
      return;
    }
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: root.scrollLeft,
      moved: false,
    };
    setSuppressClick(false);
    root.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const root = scrollerRef.current;
    if (!d.active || !root || d.pointerId !== e.pointerId) {
      return;
    }
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) >= HOME_REEL.dragThreshold) {
      d.moved = true;
      setSuppressClick(true);
    }
    if (d.moved) {
      root.scrollLeft = d.startScroll - dx;
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const root = scrollerRef.current;
    if (!d.active || d.pointerId !== e.pointerId) {
      return;
    }
    const moved = d.moved;
    d.active = false;
    d.pointerId = null;
    if (root) {
      try {
        root.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (moved) {
      scrollToIndex(findNearestIndex());
      window.setTimeout(() => setSuppressClick(false), 120);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)} data-testid="featured-reel">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-16 bg-gradient-to-r from-background to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-16 bg-gradient-to-l from-background to-transparent"
        aria-hidden
      />

      <div
        ref={scrollerRef}
        role="listbox"
        aria-label="精选文章胶片卷轴"
        aria-orientation="horizontal"
        aria-activedescendant={
          items[activeIndex] ? `reel-card-${items[activeIndex].id}` : undefined
        }
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          'flex gap-4 sm:gap-5 overflow-x-auto overflow-y-hidden px-8 sm:px-12 py-4',
          'snap-x snap-mandatory',
          !reduced && 'scroll-smooth',
          'cursor-grab active:cursor-grabbing',
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl',
          'touch-pan-x'
        )}
      >
        {items.map((item, index) => {
          const focused = index === activeIndex;
          const scale = reduced
            ? 1
            : focused
              ? HOME_REEL.focusScale
              : HOME_REEL.sideScale;
          const opacity = reduced ? 1 : focused ? 1 : HOME_REEL.sideOpacity;

          return (
            <div
              key={item.id}
              id={`reel-card-${item.id}`}
              role="option"
              aria-selected={focused}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={cn(
                'snap-center shrink-0 w-[min(85vw,22rem)] sm:w-[min(70vw,26rem)]',
                'transition-[transform,opacity] duration-300 ease-out'
              )}
              style={{
                transform: `scale(${scale})`,
                opacity,
              }}
            >
              <ReelCard
                item={item}
                focused={focused}
                suppressClick={suppressClick}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={activeIndex <= 0}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-full',
            'border border-border bg-glass/40 text-foreground',
            'hover:border-primary/40 hover:text-primary transition-colors',
            'disabled:opacity-40 disabled:pointer-events-none'
          )}
          aria-label="上一张精选"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5" role="tablist" aria-label="胶片位置">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === activeIndex
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70'
              )}
              aria-label={`跳到第 ${i + 1} 张`}
              aria-current={i === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={activeIndex >= items.length - 1}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-full',
            'border border-border bg-glass/40 text-foreground',
            'hover:border-primary/40 hover:text-primary transition-colors',
            'disabled:opacity-40 disabled:pointer-events-none'
          )}
          aria-label="下一张精选"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        第 {activeIndex + 1} / {items.length} 篇：{items[activeIndex]?.title}
      </p>
    </div>
  );
}
