'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { HOME_CURRENT } from './homeMotion';

export interface TimelineCurrentPathProps {
  className?: string;
  trackClassName?: string;
}

const PATH_D =
  'M20 0 C 28 120, 12 240, 20 360 S 28 600, 20 720 S 12 900, 20 1000';

/**
 * 洋流中轴：SVG 柔和路径 + 滚动描边进度。
 * L0 / reduced-motion：直接满绘；pathLength 未测得前不画进度层，避免闪断。
 */
export default function TimelineCurrentPath({
  className,
  trackClassName,
}: TimelineCurrentPathProps) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  const [pathLength, setPathLength] = useState(0);
  const gradId = useId().replace(/:/g, '');

  useEffect(() => {
    const path = pathRef.current;
    if (!path) {
      return;
    }
    // 等布局稳定后再量长度
    const id = requestAnimationFrame(() => {
      try {
        setPathLength(path.getTotalLength());
      } catch {
        setPathLength(0);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }

    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }

    let raf = 0;
    let last = 0;

    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const start = vh * 0.85;
      const end = vh * 0.15;
      const y = rect.top;
      let p = (start - y) / (start - end + rect.height * 0.5);
      p = Math.min(1, Math.max(0, p));
      setProgress(p);
    };

    const onScroll = () => {
      const now = performance.now();
      if (now - last < HOME_CURRENT.progressThrottle) {
        return;
      }
      last = now;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduced]);

  const ready = pathLength > 0;
  const dashOffset = ready ? pathLength * (1 - progress) : 0;

  return (
    <div
      ref={wrapRef}
      data-testid="timeline-current-path"
      className={cn(
        'pointer-events-none absolute inset-y-0 left-6 sm:left-8 w-8 -translate-x-1/2 z-0',
        trackClassName,
        className
      )}
      aria-hidden
    >
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 40 1000"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`current-grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="12%" stopColor="var(--primary)" stopOpacity="0.55" />
            <stop offset="88%" stopColor="var(--primary)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 底轨始终可见 */}
        <path
          d={PATH_D}
          fill="none"
          stroke={`url(#current-grad-${gradId})`}
          strokeWidth={HOME_CURRENT.strokeWidth}
          strokeOpacity={0.28}
        />
        {/* 进度层：测得长度后再显示，避免 dash 闪断 */}
        <path
          ref={pathRef}
          d={PATH_D}
          fill="none"
          stroke={`url(#current-grad-${gradId})`}
          strokeWidth={HOME_CURRENT.strokeWidth + 0.5}
          strokeLinecap="round"
          strokeDasharray={ready ? pathLength : undefined}
          strokeDashoffset={reduced || !ready ? 0 : dashOffset}
          opacity={ready || reduced ? 1 : 0}
          style={{
            transition: reduced ? undefined : 'stroke-dashoffset 80ms linear',
            filter:
              'drop-shadow(0 0 6px color-mix(in oklab, var(--primary) 40%, transparent))',
          }}
        />
      </svg>
    </div>
  );
}
