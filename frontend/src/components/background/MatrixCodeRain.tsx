'use client';
import { useRef, useEffect } from 'react';
import { useTheme } from '@/context/theme-context';

const MatrixCodeRain = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // 只在深色主题时渲染
    if (resolvedTheme !== 'dark') {
      return;
    }

    // Phase 2 性能预算：移动端 / 减少动效 不启矩阵雨
    if (
      window.matchMedia('(max-width: 767px)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {return;}

    // 字符集：英文字母、特殊符号和数字
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const fontSize = 20;
    const frameCount = { current: 0 };
    let drops: number[] = [];
    let columnActive: boolean[] = [];
    let columnChars: string[] = [];

    const getRandomChar = () => characters.charAt(Math.floor(Math.random() * characters.length));

    const initDrops = (width: number) => {
      const columns = Math.floor(width / fontSize);
      const center = columns / 2;

      drops = Array(columns).fill(1);
      columnActive = Array(columns).fill(false).map((_, i) => {
        const distanceFromCenter = Math.abs(i - center) / center;
        const probability = 0.2 + distanceFromCenter * 0.8;
        return Math.random() < probability;
      });
      columnChars = Array(columns).fill('').map(() => getRandomChar());
      return columns;
    };

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {return;}

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px monospace`;

      const shouldUpdatePosition = frameCount.current % 6 === 0;
      const shouldUpdateChars = frameCount.current % 12 === 0;

      for (let i = 0; i < drops.length; i++) {
        if (!columnActive[i]) {continue;}

        if (shouldUpdateChars) {
          columnChars[i] = getRandomChar();
        }
        const text = columnChars[i];
        const isHighlight = Math.random() > 0.9;
        ctx.fillStyle = isHighlight ? '#10b981' : '#059669';

        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(text, x, y);

        if (shouldUpdatePosition) {
          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      }

      frameCount.current++;
      animationRef.current = requestAnimationFrame(draw);
    };

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) {return;}

      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      initDrops(rect.width);
    };

    resizeCanvas();
    draw();

    let resizeTimeout: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        resizeCanvas();
        draw();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [resolvedTheme]);

  // 如果不是深色主题，不渲染 Canvas
  if (resolvedTheme !== 'dark') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
export default MatrixCodeRain;
