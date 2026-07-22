'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useSpring, useTransform, useInView, SpringOptions } from '@/lib/framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  delay?: number
  formatFn?: (value: number) => string
  className?: string
  springOptions?: SpringOptions
}

export default function AnimatedNumber({
  value,
  duration: _duration = 2000,
  delay = 0,
  formatFn = (v) => v.toLocaleString(),
  className = '',
  springOptions = { stiffness: 100, damping: 30, mass: 1 }
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [hasAnimated, setHasAnimated] = useState(false)
  const reducedMotion = useReducedMotion()

  const spring = useSpring(0, springOptions)
  const display = useTransform(spring, (latest) => formatFn(Math.round(latest)))

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(value)
        setHasAnimated(true)
      }, delay)
      return () => clearTimeout(timeout)
    }
  }, [isInView, hasAnimated, spring, value, delay])

  // 动画完成后 value 再变化时，平滑过渡到新值（如实时统计更新）
  useEffect(() => {
    if (hasAnimated) {
      spring.set(value)
    }
  }, [value, hasAnimated, spring])

  // reduced-motion：不跑 spring，直接渲染终值
  if (reducedMotion) {
    return <span className={className}>{formatFn(value)}</span>
  }

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  )
}

interface AnimatedCounterProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  delay?: number
  className?: string
  label?: string
  labelClassName?: string
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  delay = 0,
  className = '',
  label,
  labelClassName = ''
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [displayValue, setDisplayValue] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  const animateValue = useCallback((start: number, end: number, duration: number) => {
    const startTime = performance.now()
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = Math.round(start + (end - start) * easeOutQuart)
      
      setDisplayValue(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    if (isInView && !hasStarted) {
      const timeout = setTimeout(() => {
        animateValue(0, value, duration)
        setHasStarted(true)
      }, delay)
      return () => clearTimeout(timeout)
    }
  }, [isInView, hasStarted, value, duration, delay, animateValue])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toLocaleString()
  }

  return (
    <div ref={ref} className="text-center">
      <motion.span 
        className={className}
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: delay / 1000 }}
      >
        {prefix}{formatNumber(displayValue)}{suffix}
      </motion.span>
      {label && (
        <motion.span
          className={labelClassName}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: delay / 1000 + 0.2 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  )
}

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  trackClassName?: string
  progressClassName?: string
  duration?: number
  delay?: number
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  className = '',
  trackClassName = '',
  progressClassName = '',
  duration = 1500,
  delay = 0
}: ProgressRingProps) {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [animatedProgress, setAnimatedProgress] = useState(0)
  
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        setAnimatedProgress(progress)
      }, delay)
      return () => clearTimeout(timeout)
    }
  }, [isInView, progress, delay])

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      className={className}
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        className={trackClassName}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity={0.2}
      />
      <motion.circle
        className={progressClassName}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: duration / 1000, ease: [0.25, 0.1, 0.25, 1] }}
        strokeLinecap="round"
      />
    </svg>
  )
}
