'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';

interface HoloCardProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'purple' | 'pink' | 'blue' | 'green';
  tiltStrength?: number;
  glowIntensity?: number;
  scanline?: boolean;
  className?: string;
}

const HoloCard = ({
  children,
  variant = 'cyan',
  tiltStrength = 5,
  glowIntensity = 0.3,
  scanline = true,
  className: _className
}: HoloCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const [scale, setScale] = useState(1);

  const springConfig = { damping: 25, stiffness: 300 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const variantColors = {
    cyan: {
      border: 'border-tech-cyan/30 hover:border-tech-cyan/60',
      glow: 'shadow-tech-cyan/20 hover:shadow-tech-cyan/40',
      bg: 'bg-tech-cyan/5'
    },
    purple: {
      border: 'border-tech-purple/30 hover:border-tech-purple/60',
      glow: 'shadow-tech-purple/20 hover:shadow-tech-purple/40',
      bg: 'bg-tech-purple/5'
    },
    pink: {
      border: 'border-tech-pink/30 hover:border-tech-pink/60',
      glow: 'shadow-tech-pink/20 hover:shadow-tech-pink/40',
      bg: 'bg-tech-pink/5'
    },
    blue: {
      border: 'border-blue-500/30 hover:border-blue-500/60',
      glow: 'shadow-blue-500/20 hover:shadow-blue-500/40',
      bg: 'bg-blue-500/5'
    },
    green: {
      border: 'border-green-500/30 hover:border-green-500/60',
      glow: 'shadow-green-500/20 hover:shadow-green-500/40',
      bg: 'bg-green-500/5'
    }
  };

  const colors = variantColors[variant];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) {return;}

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXVal = ((y - centerY) / centerY) * -tiltStrength;
    const rotateYVal = ((x - centerX) / centerX) * tiltStrength;

    rotateX.set(rotateXVal);
    rotateY.set(rotateYVal);

    cardRef.current.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    setScale(1);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setScale(1.02);
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300",
        colors.border,
        colors.bg,
        colors.glow,
        !isMobile && "will-change-transform"
      )}
      style={{
        rotateX: !isMobile ? springRotateX : 0,
        rotateY: !isMobile ? springRotateY : 0,
        scale: isMobile ? 1 : scale,
        transformStyle: isMobile ? undefined : 'preserve-3d',
        perspective: isMobile ? undefined : 1000
      }}
      onMouseMove={!isMobile ? handleMouseMove : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {scanline && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] animate-scanline" />
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-tech-cyan/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-tech-cyan/50 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-transparent via-tech-cyan/50 to-transparent" />
        <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-tech-cyan/50 to-transparent" />
      </div>

      <div className="relative z-10 h-full">
        {children}
      </div>

      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: glowIntensity }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.1) 0%, transparent 70%)`
          }}
        />
      )}
    </motion.div>
  );
};

export default HoloCard;
