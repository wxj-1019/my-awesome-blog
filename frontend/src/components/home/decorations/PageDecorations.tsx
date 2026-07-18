'use client'

import { motion } from '@/lib/framer-motion'

interface PageDecorationsProps {
  className?: string
}

// 左上角装饰光晕
export function TopLeftGlow({ className = '' }: PageDecorationsProps) {
  return (
    <div
      className={`fixed top-0 left-0 w-[500px] h-[500px] pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 0% 0%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

// 右下角装饰光晕
export function BottomRightGlow({ className = '' }: PageDecorationsProps) {
  return (
    <div
      className={`fixed bottom-0 right-0 w-[600px] h-[600px] pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)',
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

// 网格背景
export function GridBackground({ className = '' }: PageDecorationsProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 opacity-[0.02] ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }}
      aria-hidden="true"
    />
  )
}

// 噪点纹理
export function NoiseTexture({ className = '' }: PageDecorationsProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[1] opacity-[0.015] ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
      aria-hidden="true"
    />
  )
}

// 连接线装饰（用于技术栈区域）
export function ConnectionLines({ className = '' }: PageDecorationsProps) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
          <stop offset="50%" stopColor="rgba(6, 182, 212, 0.3)" />
          <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// 浮动几何形状
export function FloatingShapes({ className = '' }: PageDecorationsProps) {
  const shapes = [
    { type: 'circle', x: '10%', y: '30%', size: 100, delay: 0 },
    { type: 'square', x: '85%', y: '50%', size: 80, delay: 2 },
    { type: 'circle', x: '70%', y: '80%', size: 60, delay: 4 },
    { type: 'square', x: '20%', y: '70%', size: 120, delay: 1 },
  ]

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`} aria-hidden="true">
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute border border-tech-cyan/10"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
            borderRadius: shape.type === 'circle' ? '50%' : '4px',
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, shape.type === 'square' ? 90 : 0, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 10 + index * 2,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// 组合所有装饰
export default function PageDecorations() {
  return (
    <>
      <TopLeftGlow />
      <BottomRightGlow />
      <GridBackground />
      <NoiseTexture />
      <FloatingShapes />
    </>
  )
}
