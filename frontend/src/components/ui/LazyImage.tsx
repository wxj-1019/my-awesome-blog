'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className,
  fallbackClassName,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer 实现懒加载
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {return;}

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  // 图片加载完成
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // 图片加载失败
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        !isLoaded && 'bg-slate-800/50 animate-pulse',
        className
      )}
    >
      {/* 占位符 */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder || (
            <div className={cn(
              'w-full h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50',
              fallbackClassName
            )} />
          )}
        </div>
      )}

      {/* 实际图片 */}
      {isInView && src && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
          <span className="text-xs text-white/40">Failed</span>
        </div>
      )}
    </div>
  );
}

// 头像懒加载组件
export function LazyAvatar({
  src,
  fallback,
  className
}: {
  src?: string;
  fallback: string;
  className?: string;
}) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {return;}

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '30px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-full',
        !isLoaded && 'bg-slate-700 animate-pulse',
        className
      )}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white/50">
            {fallback[0].toUpperCase()}
          </span>
        </div>
      )}
      {isInView && src && (
        <img
          src={src}
          alt="Avatar"
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}
