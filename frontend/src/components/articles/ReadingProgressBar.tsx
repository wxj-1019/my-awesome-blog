'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ReadingProgressBarProps {
  targetRef?: React.RefObject<HTMLElement | null>;
  /** 外部统一进度 0–100；传入时不再内部监听 scroll */
  progress?: number;
  className?: string;
}

export default function ReadingProgressBar({
  targetRef,
  progress: externalProgress,
  className,
}: ReadingProgressBarProps) {
  const [internalProgress, setInternalProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const contentRef = useRef<HTMLElement>(null);
  const controlled = typeof externalProgress === 'number';
  const progress = controlled ? externalProgress : internalProgress;

  useEffect(() => {
    if (controlled) {
      setIsVisible((externalProgress ?? 0) > 0);
      return;
    }

    const targetElement = targetRef?.current || contentRef.current;
    if (!targetElement) {
      return;
    }

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const elementTop = targetElement.offsetTop;
      const elementBottom = elementTop + targetElement.offsetHeight;
      const scrolledTop = Math.max(0, scrollTop - elementTop + windowHeight);
      const scrollableHeight = Math.max(elementBottom - elementTop, 1);
      let percentage = 0;
      if (scrollTop >= elementTop - windowHeight) {
        percentage = (scrolledTop / scrollableHeight) * 100;
      }
      percentage = Math.min(100, Math.max(0, percentage));
      setInternalProgress(percentage);
      setIsVisible(scrollTop > elementTop - windowHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetRef, controlled, externalProgress]);

  if (!controlled && !isVisible) {
    return null;
  }
  if (controlled && progress <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-1 z-50 transition-opacity duration-300',
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="阅读进度"
    >
      <div
        className="h-full bg-gradient-to-r from-tech-cyan via-tech-lightcyan to-tech-sky transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
