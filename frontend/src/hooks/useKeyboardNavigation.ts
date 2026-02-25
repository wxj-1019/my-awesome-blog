'use client';

import { useEffect, RefObject } from 'react';

export interface KeyboardNavigationOptions {
  refs: RefObject<HTMLElement>[];
  onEscape?: () => void;
  onEnter?: () => void;
  loop?: boolean;
}

export function useKeyboardNavigation({
  refs,
  onEscape,
  onEnter,
  loop = true
}: KeyboardNavigationOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = refs.findIndex(ref => ref.current === document.activeElement);

      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        if (currentIndex >= 0) {
          e.preventDefault();
          onEnter?.();
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = currentIndex + 1;
        if (nextIndex < refs.length) {
          refs[nextIndex].current?.focus();
        } else if (loop && refs[0].current) {
          refs[0].current.focus();
        }
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          refs[prevIndex].current?.focus();
        } else if (loop) {
          const lastRef = refs[refs.length - 1];
          if (lastRef.current) {
            lastRef.current.focus();
          }
        }
      }

      if (e.key === 'Home') {
        e.preventDefault();
        refs[0].current?.focus();
      }

      if (e.key === 'End') {
        e.preventDefault();
        refs[refs.length - 1].current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [refs, onEscape, onEnter, loop]);
}

export interface FocusTrapOptions {
  containerRef: RefObject<HTMLElement>;
  onEscape?: () => void;
}

export function useFocusTrap({ containerRef, onEscape }: FocusTrapOptions) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        onEscape?.();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, onEscape]);
}
