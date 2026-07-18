'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from '@/lib/framer-motion'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
}

interface FloatingParticlesProps {
  count?: number
  className?: string
  color?: string
}

export default function FloatingParticles({
  count = 20,
  className = '',
  color = 'rgba(6, 182, 212, 0.3)', // tech-cyan with opacity
}: FloatingParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isVisible, setIsVisible] = useState(true)

  // 生成随机粒子
  const generateParticles = useCallback(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.2,
    }))
  }, [count])

  useEffect(() => {
    setParticles(generateParticles())

    // 监听可见性变化，页面不可见时暂停动画
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [generateParticles])

  // 如果页面不可见，不渲染动画
  if (!isVisible) {return null}

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* 大光晕装饰 */}
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
        initial={{ x: '10%', y: '20%', opacity: 0.3 }}
        animate={{
          x: ['10%', '15%', '10%'],
          y: ['20%', '25%', '20%'],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)`,
          filter: 'blur(50px)',
        }}
        initial={{ x: '70%', y: '60%', opacity: 0.2 }}
        animate={{
          x: ['70%', '65%', '70%'],
          y: ['60%', '55%', '60%'],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
