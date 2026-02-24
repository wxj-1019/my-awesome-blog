'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparkline?: number[];
  className?: string;
  animationDelay?: number;
  loading?: boolean;
  onClick?: () => void;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ 
    label, 
    value, 
    icon: Icon, 
    color, 
    href, 
    trend,
    sparkline,
    className,
    animationDelay = 0,
    loading = false,
    onClick
  }, ref) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });
    
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        
        x.set(xPct);
        y.set(yPct);
      },
      [x, y]
    );

    const handleMouseLeave = React.useCallback(() => {
      x.set(0);
      y.set(0);
    }, [x, y]);

    const TrendIcon = trend?.isPositive 
      ? (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      : (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;

    const renderSparkline = () => {
      if (!sparkline || sparkline.length < 2) return null;
      
      const max = Math.max(...sparkline);
      const min = Math.min(...sparkline);
      const range = max - min || 1;
      
      const points = sparkline.map((val, i) => {
        const x = (i / (sparkline.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
      }).join(' ');

      return (
        <motion.svg
          viewBox="0 0 100 100"
          className="w-full h-12"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: animationDelay / 1000 + 0.3 }}
        >
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-lg"
          />
          <motion.polygon
            points={`0,100 ${points} 100,100`}
            fill={color}
            fillOpacity="0.1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: animationDelay / 1000 + 0.5, duration: 0.5 }}
          />
        </motion.svg>
      );
    };
    
    const content = (
      <motion.div
        ref={ref}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          'relative group perspective-1000',
          onClick && 'cursor-pointer'
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        <motion.div
          role={href ? "link" : "article"}
          tabIndex={href ? 0 : undefined}
          aria-label={`${label}: ${value}`}
          className={cn(
            'relative overflow-hidden rounded-2xl p-6 transition-all duration-300',
            'bg-white/50 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg',
            'hover:-translate-y-1 hover:shadow-2xl',
            'transform-gpu',
            className
          )}
          style={{
            animationDelay: `${animationDelay}ms`,
            animationFillMode: 'both'
          }}
          whileHover={{ 
            y: -8,
            scale: 1.02,
            boxShadow: `0 20px 40px ${color}20, 0 0 0 1px ${color}30`
          }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.25, 0.1, 0.25, 1],
            delay: animationDelay / 1000
          }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-10">
              <motion.div
                className="w-8 h-8 border-3 border-tech-cyan/30 border-t-tech-cyan rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          )}

          <motion.div 
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
            style={{ 
              background: `radial-gradient(circle at center, ${color}40 0%, transparent 70%)` 
            }}
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <motion.p 
                  className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: animationDelay / 1000 + 0.1 }}
                >
                  {label}
                </motion.p>
                <motion.p 
                  className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: animationDelay / 1000 + 0.2 }}
                >
                  {value}
                </motion.p>
              </div>
              
              <motion.div
                className="p-3 rounded-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${color}40 0%, ${color}30 100%)` 
                }}
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ 
                  delay: animationDelay / 1000 + 0.3,
                  type: 'spring',
                  stiffness: 200
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Icon className="w-6 h-6 text-foreground" />
              </motion.div>
            </div>

            {sparkline && (
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelay / 1000 + 0.4 }}
              >
                {renderSparkline()}
              </motion.div>
            )}
            
            {trend && (
              <motion.div 
                className={cn(
                  "flex items-center gap-2 mt-4 pt-3 border-t",
                  trend.isPositive ? "border-green-200/50 dark:border-green-800/50" : "border-red-200/50 dark:border-red-800/50"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelay / 1000 + 0.5 }}
              >
                <motion.div 
                  className={cn(
                    "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                    trend.isPositive 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                      : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  )}
                  whileHover={{ scale: 1.05 }}
                >
                  <TrendIcon className="w-3 h-3" />
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </motion.div>
                <span className="text-xs text-foreground/50">较上月</span>
              </motion.div>
            )}
          </div>

          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 pointer-events-none"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    );
    
    return href ? (
      <Link href={href as any} className="block focus:outline-none focus:ring-2 focus:ring-tech-cyan focus:ring-offset-2 rounded-2xl">
        {content}
      </Link>
    ) : (
      <div className="focus:outline-none focus:ring-2 focus:ring-tech-cyan focus:ring-offset-2 rounded-2xl">
        {content}
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';

export default StatCard;