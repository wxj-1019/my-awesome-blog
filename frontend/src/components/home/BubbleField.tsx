'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface BubbleSpec {
  left: number; // %
  size: number; // px
  duration: number; // s
  delay: number; // s
  drift: number; // px 横向漂移
}

/**
 * 水中气泡装饰：从底部向上浮起，带轻微横向漂移。
 * - 进入视口才开始（避免首屏外空跑）
 * - prefers-reduced-motion 时静默不渲染
 * - 颜色用 token，浅色/深色自适应
 * - 上浮行程按容器实际高度计算（--rise），确保气泡真正穿过视区
 */
export default function BubbleField({
  count = 14,
  className = '',
  withHighlight = true,
}: {
  count?: number;
  className?: string;
  /** 是否渲染气泡内高光点；水下稀疏段可关闭以减半 DOM */
  withHighlight?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);

  // 伪随机但稳定（ hydration 一致 ）
  const bubbles = useMemo<BubbleSpec[]>(() => {
    const seed = (n: number) => {
      const x = Math.sin(n * 9973 + 17) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      left: 4 + seed(i + 1) * 92,
      size: 4 + seed(i + 2) * 12,
      duration: 6 + seed(i + 3) * 7,
      delay: seed(i + 4) * 8,
      drift: (seed(i + 5) - 0.5) * 60,
    }));
  }, [count]);

  useEffect(() => {
    if (reduced || !ref.current) {
      return;
    }
    const el = ref.current;
    // 上浮行程 = 容器高度 + 余量；translate 百分比相对气泡自身，必须用像素值
    const syncRise = () => {
      el.style.setProperty('--rise', `${el.offsetHeight + 40}px`);
    };
    syncRise();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            syncRise();
            setActive(true);
          } else {
            setActive(false);
          }
        });
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    window.addEventListener('resize', syncRise);
    return () => {
      io.disconnect();
      window.removeEventListener('resize', syncRise);
    };
  }, [reduced]);

  if (reduced) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <style jsx>{`
        @keyframes bubble-rise {
          0% {
            transform: translate3d(0, 20px, 0) scale(0.6);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          50% {
            transform: translate3d(var(--drift), calc(var(--rise, 320px) * -0.5), 0) scale(1);
            opacity: 0.9;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translate3d(calc(var(--drift) * 0.6), calc(var(--rise, 320px) * -1), 0) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
      {active &&
        bubbles.map((b, i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full border border-primary/15 bg-primary/8"
            style={{
              left: `${b.left}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              // CSS 变量供 keyframes 读取横向漂移
              ['--drift' as string]: `${b.drift}px`,
              animation: `bubble-rise ${b.duration}s ease-in ${b.delay}s infinite`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      {/* 气泡内高光，增强立体感；水下稀疏段可关闭 */}
      {active &&
        withHighlight &&
        bubbles.map((b, i) => (
          <span
            key={`g-${i}`}
            className="absolute bottom-0 rounded-full bg-primary/25"
            style={{
              left: `calc(${b.left}% + ${b.size * 0.18}px)`,
              bottom: `${b.size * 0.35}px`,
              width: `${b.size * 0.28}px`,
              height: `${b.size * 0.28}px`,
              animation: `bubble-rise ${b.duration}s ease-in ${b.delay}s infinite`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
    </div>
  );
}
