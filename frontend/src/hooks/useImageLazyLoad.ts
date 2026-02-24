'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  className,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (isInView && !isLoaded && !hasError && imgRef.current) {
      imgRef.current.src = src;
    }
  }, [isInView, isLoaded, hasError, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (!isInView && placeholder) {
    return <div style={{ display: 'contents' }}>{placeholder}</div>;
  }

  return (
    <motion.img
      ref={imgRef}
      alt={alt}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      onLoad={handleLoad}
      onError={handleError}
      data-loaded={isLoaded}
    />
  );
}

export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: handleScroll,
    scrollTop,
  };
}

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className
}: VirtualListProps<T>) {
  const { visibleItems, totalHeight, offsetY, onScroll } = useVirtualScroll({
    items,
    itemHeight,
    containerHeight,
    overscan,
  });

  return (
    <div
      className={className}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', top: 0, left: 0, right: 0 }}>
          {visibleItems.map((item, index) => (
            <div
              key={index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
