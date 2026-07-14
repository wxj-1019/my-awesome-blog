'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

interface UseScrollRevealReturn {
  isVisible: boolean;
  ref: (node: HTMLElement | null) => void;
  animationClass: string;
  animationStyle: React.CSSProperties;
}

export function useScrollReveal(options: UseScrollRevealOptions = {}): UseScrollRevealReturn {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -100px 0px',
    triggerOnce = true,
    delay = 0
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    if (elementRef.current) {
      observerRef.current?.unobserve(elementRef.current);
    }
    elementRef.current = node;
    if (node && !hasTriggered) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            if (triggerOnce) {
              setHasTriggered(true);
            }
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
          }
        },
        { threshold, rootMargin }
      );
      observerRef.current.observe(node);
    }
  }, [threshold, rootMargin, triggerOnce, delay, hasTriggered]);

  useEffect(() => {
    return () => {
      if (observerRef.current && elementRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
    };
  }, []);

  const animationClass = isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95';

  const animationStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.95)',
    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
  };

  return { isVisible, ref, animationClass, animationStyle };
}
