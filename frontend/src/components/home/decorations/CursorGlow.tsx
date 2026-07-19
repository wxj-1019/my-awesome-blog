'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from '@/lib/framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface CursorGlowProps {
  className?: string
  size?: number
  color?: string
}

/**
 * 桌面旁白光晕。触屏 / prefers-reduced-motion 不渲染（L0/L1 预算）。
 */
export default function CursorGlow({
  className = '',
  size = 300,
  color = 'rgba(6, 182, 212, 0.15)',
}: CursorGlowProps) {
  const reducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springConfig = { damping: 30, stiffness: 200 }
  const glowX = useSpring(cursorX, springConfig)
  const glowY = useSpring(cursorY, springConfig)

  useEffect(() => {
    if (reducedMotion) {
      return
    }

    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    checkTouch()

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX - size / 2)
      cursorY.set(e.clientY - size / 2)
      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.body.addEventListener('mouseleave', handleMouseLeave)
    document.body.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
      document.body.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [cursorX, cursorY, size, reducedMotion])

  if (reducedMotion || isTouchDevice) {
    return null
  }

  return (
    <motion.div
      className={`fixed pointer-events-none z-50 ${className}`}
      style={{
        x: glowX,
        y: glowY,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
        filter: 'blur(20px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      aria-hidden="true"
    />
  )
}
