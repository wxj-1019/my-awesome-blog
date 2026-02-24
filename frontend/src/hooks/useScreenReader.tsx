'use client';

import { useState, useEffect } from 'react';

export function useScreenReader() {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  useEffect(() => {
    const checkScreenReader = () => {
      const hasAriaElements = document.querySelectorAll('[aria-live], [aria-atomic]').length > 0;
      const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

      setIsScreenReaderActive(hasAriaElements || hasReducedMotion || hasHighContrast);
    };

    checkScreenReader();
    window.addEventListener('load', checkScreenReader);
    return () => window.removeEventListener('load', checkScreenReader);
  }, []);

  return isScreenReaderActive;
}

export interface AnnouncerOptions {
  message: string;
  priority?: 'polite' | 'assertive';
  clearPrevious?: boolean;
}

export function useAnnouncer() {
  const announce = ({ message, priority = 'polite', clearPrevious = true }: AnnouncerOptions) => {
    const existingAnnouncer = document.getElementById('sr-announcer');
    if (clearPrevious && existingAnnouncer) {
      existingAnnouncer.remove();
    }

    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    setTimeout(() => {
      announcer.remove();
    }, 1000);
  };

  return { announce };
}

export interface AriaLiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function AriaLiveRegion({
  children,
  priority = 'polite',
  className
}: AriaLiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className || ''}`}
    >
      {children}
    </div>
  );
}
