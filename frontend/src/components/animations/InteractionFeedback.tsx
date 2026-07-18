'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Check, X, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeedbackType = 'success' | 'error' | 'info' | 'warning' | 'sparkle';

export interface RippleEffectProps {
  x: number;
  y: number;
  color?: string;
  onComplete?: () => void;
}

export function RippleEffect({ x, y, color = 'rgba(6, 182, 212, 0.3)', onComplete }: RippleEffectProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 4, opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      className="fixed pointer-events-none rounded-full"
      style={{
        left: x - 50,
        top: y - 50,
        width: 100,
        height: 100,
        backgroundColor: color,
      }}
    />
  );
}

export interface ClickFeedbackProps {
  isActive: boolean;
  children: React.ReactNode;
  feedbackType?: FeedbackType;
  className?: string;
}

export function ClickFeedback({
  isActive,
  children,
  feedbackType = 'success',
  className
}: ClickFeedbackProps) {
  const [ripples, setRipples] = useState<Array<{ id: string; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent) => {
    const ripple = {
      id: Math.random().toString(36),
      x: e.clientX,
      y: e.clientY,
    };
    setRipples(prev => [...prev, ripple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);
  };

  const icons = {
    success: <Check className="w-4 h-4 text-green-500" />,
    error: <X className="w-4 h-4 text-red-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    sparkle: <Sparkles className="w-4 h-4 text-tech-cyan" />,
  };

  return (
    <div
      onClick={handleClick}
      className={cn('relative inline-block', className)}
    >
      {children}

      {isActive && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-1 -right-1"
        >
          {icons[feedbackType]}
        </motion.div>
      )}

      <AnimatePresence>
        {ripples.map(ripple => (
          <RippleEffect
            key={ripple.id}
            x={ripple.x}
            y={ripple.y}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function LoadingDots({ size = 'md', color = 'currentColor', className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* 加载动画点：列表固定不变，使用 index 作为 key */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('rounded-full', sizeClasses[size])}
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export interface ShimmerProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function Shimmer({ children, speed = 2, className }: ShimmerProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {children}
    </div>
  );
}

export interface PulseGlowProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  className?: string;
}

export function PulseGlow({ children, color = 'rgba(6, 182, 212, 0.5)', intensity = 1, className }: PulseGlowProps) {
  return (
    <motion.div
      className={cn('relative inline-block', className)}
      whileHover={{
        boxShadow: [
          `0 0 0px ${color}`,
          `0 0 ${20 * intensity}px ${color}`,
          `0 0 0px ${color}`,
        ],
        transition: { duration: 1.5, repeat: Infinity },
      }}
    >
      {children}
    </motion.div>
  );
}

export interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({ children, strength = 0.5, className, onClick }: MagneticButtonProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: mousePosition.x,
        y: mousePosition.y,
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

export interface ParallaxTiltProps {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
}

export function ParallaxTilt({ children, intensity = 20, className }: ParallaxTiltProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);

    setRotate({
      x: -y * intensity,
      y: x * intensity,
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotate.x,
        rotateY: rotate.y,
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{ transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
