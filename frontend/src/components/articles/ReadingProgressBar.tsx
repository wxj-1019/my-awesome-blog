'use client';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
interface ReadingProgressBarProps {
  targetRef?: React.RefObject<HTMLElement>;
  className?: string;
}
export default function ReadingProgressBar({ targetRef, className }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const contentRef = useRef<HTMLElement>(null);
  const targetElement = targetRef?.current || contentRef.current;
  useEffect(() => {
    if (!targetElement) {return;}
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const elementTop = targetElement.offsetTop;
      const elementBottom = elementTop + targetElement.offsetHeight;
      const scrolledTop = Math.max(0, scrollTop - elementTop + windowHeight);
      const scrollableHeight = elementBottom - elementTop;
      let percentage = 0;
      if (scrollTop >= elementTop - windowHeight) {
        percentage = (scrolledTop / scrollableHeight) * 100;
      }
      percentage = Math.min(100, Math.max(0, percentage));
      setProgress(percentage);
      setIsVisible(scrollTop > elementTop - windowHeight);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetElement]);
  if (!isVisible) {return null;}
  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-1 z-50 transition-opacity duration-300',
        className
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-tech-cyan via-tech-lightcyan to-tech-sky transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}