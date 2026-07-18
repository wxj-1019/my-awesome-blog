'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface CursorProps {
  cursorSize?: number;
  hoverScale?: number;
  magneticDistance?: number;
  trailLength?: number;
}

export default function InteractiveCursor({
  cursorSize = 20,
  hoverScale = 1.5,
  magneticDistance: _magneticDistance = 100,
  trailLength = 5
}: CursorProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([]);
  const cursorRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 700 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const scale = useTransform(mouseX, (_value) => isHovering ? hoverScale : 1);
  const opacity = useTransform(mouseX, () => 1);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      setTrail(prev => {
        const newTrail = [{ x: e.clientX, y: e.clientY }, ...prev].slice(0, trailLength);
        return newTrail;
      });
    };

    const handleMouseDown = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cursorX.get()}px, ${cursorY.get()}px) scale(0.8)`;
      }
    };

    const handleMouseUp = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cursorX.get()}px, ${cursorY.get()}px) scale(${isHovering ? hoverScale : 1})`;
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, [role="button"], [role="slider"]')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [mouseX, mouseY, trailLength, isHovering, hoverScale, cursorX, cursorY]);

  return (
    <>
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference hidden md:block"
        style={{
          x: cursorX,
          y: cursorY,
          scale,
          opacity
        }}
      >
        <div
          className="rounded-full border-2 border-white"
          style={{
            width: cursorSize,
            height: cursorSize
          }}
        />
      </motion.div>

      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] hidden md:block"
        style={{
          x: cursorX,
          y: cursorY
        }}
      >
        <div
          className="rounded-full bg-tech-cyan/20"
          style={{
            width: cursorSize * 3,
            height: cursorSize * 3
          }}
        />
      </motion.div>

      {/* 光标拖尾：数组长度固定，顺序不变，使用 index 作为 key */}
      {trail.map((point, index) => (
        <motion.div
          key={index}
          className="fixed top-0 left-0 pointer-events-none z-[9997] hidden md:block"
          style={{
            x: point.x - (cursorSize * 0.5),
            y: point.y - (cursorSize * 0.5)
          }}
          initial={{ opacity: 0.5 - (index * 0.1), scale: 1 - (index * 0.15) }}
          animate={{ opacity: 0.4 - (index * 0.08), scale: 0.8 - (index * 0.12) }}
        >
          <div
            className="rounded-full bg-tech-cyan/30"
            style={{
              width: cursorSize * (0.8 - index * 0.1),
              height: cursorSize * (0.8 - index * 0.1)
            }}
          />
        </motion.div>
      ))}
    </>
  );
}
