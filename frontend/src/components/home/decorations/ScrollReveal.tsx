'use client'

import { ReactNode } from 'react'
import { motion, Variants, useReducedMotion } from 'framer-motion'
import {
  fadeIn,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  bounceIn,
  PRESETS,
  VIEWPORT,
} from '@/lib/animation-utils'

type AnimationType = 
  | 'fadeIn' 
  | 'slideUp' 
  | 'slideDown' 
  | 'slideLeft' 
  | 'slideRight' 
  | 'scaleIn' 
  | 'bounceIn'
  | 'card'
  | 'title'
  | 'sidebar'
  | 'content'

interface ScrollRevealProps {
  children: ReactNode
  animation?: AnimationType
  className?: string
  delay?: number
  duration?: number
  once?: boolean
  amount?: number
  customVariants?: Variants
  as?: keyof JSX.IntrinsicElements
}

const animationMap: Record<AnimationType, Variants> = {
  fadeIn,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  bounceIn,
  card: PRESETS.CARD,
  title: PRESETS.TITLE,
  sidebar: PRESETS.SIDEBAR,
  content: PRESETS.CONTENT,
}

export default function ScrollReveal({
  children,
  animation = 'slideUp',
  className = '',
  delay = 0,
  duration,
  once = true,
  amount = 0.3,
  customVariants,
  as: Component = 'div',
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion()
  
  // 如果用户偏好减少动画，直接显示内容
  if (shouldReduceMotion) {
    return <Component className={className}>{children}</Component>
  }

  const baseVariants = customVariants || animationMap[animation]
  
  // 应用延迟和自定义时长
  const variants: Variants = {
    hidden: baseVariants.hidden,
    visible: {
      ...(baseVariants.visible as Record<string, unknown>),
      transition: {
        ...((baseVariants.visible as Record<string, unknown>)?.transition as Record<string, unknown>),
        delay,
        ...(duration && { duration }),
      },
    },
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}

// 交错动画容器
interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  delayChildren?: number
  once?: boolean
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
  delayChildren = 0,
  once = true,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion()
  
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2 }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay as number,
            delayChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// 交错子元素
interface StaggerItemProps {
  children: ReactNode
  className?: string
  animation?: AnimationType
}

export function StaggerItem({
  children,
  className = '',
  animation = 'slideUp',
}: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion()
  
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  const variants = animationMap[animation]

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}

// 视差浮动效果
interface ParallaxFloatProps {
  children: ReactNode
  className?: string
  offset?: number
  duration?: number
}

export function ParallaxFloat({
  children,
  className = '',
  offset = 20,
  duration = 3,
}: ParallaxFloatProps) {
  const shouldReduceMotion = useReducedMotion()
  
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [-offset, offset, -offset],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

// 发光脉冲效果
interface GlowPulseProps {
  children: ReactNode
  className?: string
  color?: string
}

export function GlowPulse({
  children,
  className = '',
  color = 'rgba(6, 182, 212, 0.3)',
}: GlowPulseProps) {
  const shouldReduceMotion = useReducedMotion()
  
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      animate={{
        boxShadow: [
          `0 0 20px ${color}`,
          `0 0 40px ${color}`,
          `0 0 20px ${color}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}
