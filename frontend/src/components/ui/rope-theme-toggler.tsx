'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/theme-context';

// 绳子主题常量
const ROPE_THEME_CONSTANTS = {
  DEFAULT_ROPE_COLOR: 'from-[var(--rope-from)] to-[var(--rope-to)]',
  FIXED_POINT_GRADIENT: 'linear-gradient(to bottom, var(--rope-mid), var(--rope-to))',
  KNOT_GRADIENT: 'linear-gradient(to bottom, var(--rope-mid), var(--rope-to))',
  DEFAULT_ROPE_LENGTH: 120,
  DEFAULT_ROPE_WIDTH: 4,
  DEFAULT_ANIMATION_DURATION: 400,
} as const;

interface RopeThemeTogglerProps extends React.ComponentPropsWithoutRef<'div'> {
  ropeLength?: number;
  ropeColor?: string;
  ropeWidth?: number;
  animationDuration?: number;
}

// 检测View Transitions API支持
const hasViewTransitionSupport = typeof document !== 'undefined' &&
  'startViewTransition' in document;

export const RopeThemeToggler = ({
  ropeLength = ROPE_THEME_CONSTANTS.DEFAULT_ROPE_LENGTH,
  ropeColor = ROPE_THEME_CONSTANTS.DEFAULT_ROPE_COLOR,
  ropeWidth = ROPE_THEME_CONSTANTS.DEFAULT_ROPE_WIDTH,
  animationDuration = ROPE_THEME_CONSTANTS.DEFAULT_ANIMATION_DURATION,
  className,
  ...props
}: RopeThemeTogglerProps) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [isPulling, setIsPulling] = useState(false);

  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 在组件挂载后设置mounted状态，确保hydration一致性
  useEffect(() => {
    setMounted(true);
  }, []);

  // 根据当前主题确定图标显示：亮色主题显示太阳图标，暗色主题显示月亮图标
  const isDark = mounted && resolvedTheme === 'dark';

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current || typeof document === 'undefined') {
      return;
    }

    // 检查是否用户设置了减少动画偏好
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 触发绳子拉动动画
    setIsPulling(true);

    // 获取当前主题状态
    const currentIsDark = document.documentElement.classList.contains('dark');
    const newTheme = currentIsDark ? 'light' : 'dark';

    // 保存到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }

    // 在动画结束后切换主题
    setTimeout(async () => {
      // 如果支持View Transitions API，使用动画切换
      if (hasViewTransitionSupport && !prefersReducedMotion) {
        await document.startViewTransition(() => {
          setTheme(newTheme);
        }).ready;

        if (buttonRef.current) {
          const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
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
              easing: 'ease-in-out',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        }
      } else {
        // 不支持的浏览器或用户设置了减少动画，直接切换主题
        setTheme(newTheme);

        // 使用CSS动画作为fallback（除非用户设置了减少动画）
        if (!prefersReducedMotion) {
          document.documentElement.animate(
            [
              { opacity: 0.8 },
              { opacity: 1 },
            ],
            {
              duration: 200,
              easing: 'ease-out',
            }
          );
        }
      }

      // 动画完成后重置拉动状态
      setTimeout(() => {
        setIsPulling(false);
      }, 300);
    }, 150); // 等待下拉动画的一半时间后切换主题
  }, [setTheme, animationDuration]);

  return (
    <div
      ref={containerRef}
      className={cn("rope-container relative flex flex-col items-start", className)}

      {...props}
    >
      {/* 摇摆容器wrapper - 用于hover增强 */}
      <div className="rope-swing-wrapper">
        {/* 摇摆容器 - 包含绳子和按钮 */}
        <div
          className={cn(
            "swing-container relative flex flex-col items-center",
            isPulling ? "rope-pull" : "rope-swing"
          )}
          style={{
            transformOrigin: 'top center'
          } as React.CSSProperties}
        >
        {/* 固定点装饰 - 连接到导航栏底部 */}
        <div
          className="w-2 h-2 rounded-full mb-1 z-10"
          style={{
            background: ROPE_THEME_CONSTANTS.FIXED_POINT_GRADIENT
          }}
        ></div>

        {/* 绳子 */}
        <div
          className={cn(
            "rope-line w-[var(--rope-width)] relative overflow-hidden transition-all duration-300 ease-out",
            "bg-gradient-to-b",
            ropeColor,
            "rounded-full"
          )}
          style={{
            height: `${ropeLength}px`,
            '--rope-length': `${ropeLength}px`,
            '--rope-width': `${ropeWidth}px`
          } as React.CSSProperties}
        >
          {/* 绳子纹理效果 */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, var(--texture-color) 20%, transparent 40%, var(--texture-color) 60%, transparent 100%)'
            }}
          ></div>
        </div>
        
        {/* 绳结装饰 */}
        <div
          className="w-3 h-1.5 rounded-full -mt-0.5 z-10"
          style={{
            background: ROPE_THEME_CONSTANTS.KNOT_GRADIENT
          }}
        ></div>
        
        {/* 主题切换按钮 */}
        <button
          ref={buttonRef}
          onClick={toggleTheme}
          className={cn(
            'relative w-9 h-9 flex items-center justify-center rounded-full bg-glass backdrop-blur-xl border border-glass-border',
            'hover:shadow-lg hover:scale-110',
            'transition-all duration-300 ease-in-out cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-tech-cyan focus:ring-offset-2 focus:ring-offset-transparent',
            'z-10'
          )}
          aria-label={`切换到${isDark ? '浅色' : '深色'}主题，当前为${mounted ? resolvedTheme || 'auto' : 'auto'}模式`}
          title={`切换到${isDark ? '浅色' : '深色'}主题`}
        >
          {!isDark ? (
            <Sun
              className="h-5 w-5 transition-transform duration-500 text-tech-cyan"
              aria-hidden="true"
            />
          ) : (
            <Moon
              className="h-5 w-5 transition-transform duration-500 text-tech-sky"
              aria-hidden="true"
            />
          )}
        </button>
        </div>
      </div>
    </div>
  );
};