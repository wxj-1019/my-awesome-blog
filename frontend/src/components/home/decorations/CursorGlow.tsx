'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from '@/lib/framer-motion'

interface CursorGlowProps {
  className?: string
  size?: number
  color?: string
}

export default function CursorGlow({
  className = '',
  size = 300,
  color = 'rgba(6, 182, 212, 0.15)',
}: CursorGlowProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  
  // 使用弹簧动画让光晕跟随更自然
  const springConfig = { damping: 30, stiffness: 200 }
  const glowX = useSpring(cursorX, springConfig)
  const glowY = useSpring(cursorY, springConfig)

  useEffect(() => {
    // 检测是否为触摸设备
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    checkTouch()

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX - size / 2)
      cursorY.set(e.clientY - size / 2)
      if (!isVisible) {setIsVisible(true)}
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
  }, [cursorX, cursorY, isVisible, size])

  // 触摸设备不显示
  if (isTouchDevice) {return null}

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
