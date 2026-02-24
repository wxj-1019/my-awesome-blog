'use client';

import { useState, useEffect, useCallback, RefObject } from 'react';

interface MousePosition {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
}

export function useMousePosition(ref?: RefObject<HTMLElement>) {
  const [position, setPosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
  });

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (ref?.current) {
        const rect = ref.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const normalizedX = (x / rect.width - 0.5) * 2;
        const normalizedY = (y / rect.height - 0.5) * 2;
        setPosition({ x, y, normalizedX, normalizedY });
      } else {
        const normalizedX = (event.clientX / window.innerWidth - 0.5) * 2;
        const normalizedY = (event.clientY / window.innerHeight - 0.5) * 2;
        setPosition({
          x: event.clientX,
          y: event.clientY,
          normalizedX,
          normalizedY,
        });
      }
    },
    [ref]
  );

  useEffect(() => {
    const element = ref?.current || window;
    element.addEventListener('mousemove', handleMouseMove as EventListener);
    return () => {
      element.removeEventListener('mousemove', handleMouseMove as EventListener);
    };
  }, [ref, handleMouseMove, setPosition]);

  return position;
}

export function useElementMousePosition(ref: RefObject<HTMLElement>) {
  const [position, setPosition] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
  });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setPosition({
      rotateX,
      rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      glareOpacity: 1,
    });
  }, [ref]);

  const handleMouseLeave = useCallback(() => {
    setPosition({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
    });
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, handleMouseMove, handleMouseLeave, setPosition]);

  return position;
}
