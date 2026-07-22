'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/theme-context';

/** 潮汐浮标 · 主题拉杆（中档回调） */
const ROPE = {
  DEFAULT_LENGTH: 120,
  DEFAULT_WIDTH: 4,
  /** View Transition 圆扩散 */
  VT_MS: 420,
  /** 拉动回弹总时长（与 CSS rope-pull 对齐） */
  PULL_MS: 420,
  /** 单层涟漪 */
  RIPPLE_MS: 560,
  /** 拉动过半再切主题 */
  THEME_SWITCH_DELAY_MS: 160,
} as const;

interface RopeThemeTogglerProps extends React.ComponentPropsWithoutRef<'div'> {
  ropeLength?: number;
  ropeColor?: string;
  ropeWidth?: number;
  /** @deprecated 使用 ROPE.VT_MS；保留 prop 兼容旧调用 */
  animationDuration?: number;
}

const hasViewTransitionSupport =
  typeof document !== 'undefined' && 'startViewTransition' in document;

export const RopeThemeToggler = ({
  ropeLength = ROPE.DEFAULT_LENGTH,
  ropeColor = 'from-[var(--rope-from)] to-[var(--rope-to)]',
  ropeWidth = ROPE.DEFAULT_WIDTH,
  animationDuration = ROPE.VT_MS,
  className,
  ...props
}: RopeThemeTogglerProps) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [isPulling, setIsPulling] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    },
    []
  );

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current || typeof document === 'undefined' || isPulling) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const newTheme: 'light' | 'dark' =
      resolvedTheme === 'dark' ? 'light' : 'dark';

    if (prefersReducedMotion) {
      setTheme(newTheme);
      return;
    }

    setIsPulling(true);
    setShowRipple(true);
    schedule(() => setShowRipple(false), ROPE.RIPPLE_MS);

    schedule(async () => {
      if (hasViewTransitionSupport) {
        try {
          await document.startViewTransition(() => {
            setTheme(newTheme);
          }).ready;

          if (buttonRef.current) {
            const { top, left, width, height } =
              buttonRef.current.getBoundingClientRect();
            const x = left + width / 2;
            const y = top + height / 2;
            const maxRadius = Math.hypot(
              Math.max(left, window.innerWidth - left),
              Math.max(top, window.innerHeight - top)
            );

            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${maxRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: animationDuration,
                easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            );
          }
        } catch {
          setTheme(newTheme);
        }
      } else {
        setTheme(newTheme);
        document.documentElement.animate(
          [{ opacity: 0.88 }, { opacity: 1 }],
          { duration: 220, easing: 'ease-out' }
        );
      }

      schedule(() => setIsPulling(false), Math.max(0, ROPE.PULL_MS - ROPE.THEME_SWITCH_DELAY_MS));
    }, ROPE.THEME_SWITCH_DELAY_MS);
  }, [
    animationDuration,
    isPulling,
    resolvedTheme,
    schedule,
    setTheme,
  ]);

  return (
    <div
      className={cn(
        'rope-container relative flex flex-col items-start',
        className
      )}
      {...props}
    >
      <div className="rope-swing-wrapper relative">
        <div
          className={cn(
            'swing-container relative flex flex-col items-center',
            isPulling ? 'rope-pull' : 'rope-swing'
          )}
          style={{ transformOrigin: 'top center' }}
        >
          {/* 锚点 */}
          <div
            className="z-10 mb-1 h-2 w-2 rounded-full"
            style={{
              background:
                'linear-gradient(to bottom, var(--rope-mid), var(--rope-to))',
            }}
            aria-hidden
          />

          {/* 绳 */}
          <div
            className={cn(
              'rope-line relative overflow-hidden rounded-full bg-gradient-to-b transition-[height] duration-300 ease-out',
              ropeColor
            )}
            style={
              {
                height: `${ropeLength}px`,
                width: `${ropeWidth}px`,
                '--rope-length': `${ropeLength}px`,
                '--rope-width': `${ropeWidth}px`,
              } as React.CSSProperties
            }
            aria-hidden
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 0%, var(--texture-color, rgba(255,255,255,0.12)) 20%, transparent 40%, var(--texture-color, rgba(255,255,255,0.1)) 60%, transparent 100%)',
              }}
            />
          </div>

          {/* 绳结 */}
          <div
            className="z-10 -mt-0.5 h-1.5 w-3 rounded-full"
            style={{
              background:
                'linear-gradient(to bottom, var(--rope-mid), var(--rope-to))',
            }}
            aria-hidden
          />

          {/* 浮标环 + 日/月 */}
          <button
            ref={buttonRef}
            type="button"
            onClick={() => {
              void toggleTheme();
            }}
            className={cn(
              'rope-buoy relative z-10 flex h-9 w-9 items-center justify-center rounded-full',
              'border border-glass-border bg-glass backdrop-blur-xl',
              'transition-[box-shadow,transform,border-color] duration-300 ease-out',
              'hover:scale-105 hover:border-primary/40',
              'hover:shadow-[0_0_16px_color-mix(in_oklab,var(--primary)_20%,transparent)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              'active:scale-95',
              isDark
                ? 'shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_18%,transparent)]'
                : 'shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_12%,transparent)]'
            )}
            aria-label={`切换到${isDark ? '浅色' : '深色'}主题，当前为${mounted ? resolvedTheme || 'auto' : 'auto'}模式`}
            title={`切换到${isDark ? '浅色' : '深色'}主题`}
          >
            <span
              className={cn(
                'pointer-events-none absolute inset-[3px] rounded-full border',
                isDark ? 'border-primary/25' : 'border-primary/20'
              )}
              aria-hidden
            />
            {!isDark ? (
              <Sun
                className="relative h-4 w-4 text-amber-400 transition-transform duration-500"
                aria-hidden
              />
            ) : (
              <Moon
                className="relative h-4 w-4 text-sky-300 transition-transform duration-500"
                aria-hidden
              />
            )}
          </button>

          {/* 单层涟漪，仅拉动时一次 */}
          {showRipple ? (
            <span
              className="rope-tide-ripple pointer-events-none absolute bottom-0 left-1/2 z-0 h-10 w-10 -translate-x-1/2 translate-y-1/4 rounded-full border border-primary/35"
              aria-hidden
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
