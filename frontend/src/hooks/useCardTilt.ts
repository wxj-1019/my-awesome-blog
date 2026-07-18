'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface TiltValues {
  rotateX: number
  rotateY: number
  glarePosition: { x: number; y: number }
  glareOpacity: number
}

interface UseCardTiltOptions {
  maxTilt?: number
  glareMaxOpacity?: number
  scale?: number
  transitionDuration?: number
}

export function useCardTilt(options: UseCardTiltOptions = {}) {
  const {
    maxTilt = 15,
    glareMaxOpacity = 0.3,
    scale = 1.02
  } = options

  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState<TiltValues>({
    rotateX: 0,
    rotateY: 0,
    glarePosition: { x: 50, y: 50 },
    glareOpacity: 0
  })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) {return}

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY

    const rotateY = (mouseX / (rect.width / 2)) * maxTilt
    const rotateX = -(mouseY / (rect.height / 2)) * maxTilt

    const glareX = ((e.clientX - rect.left) / rect.width) * 100
    const glareY = ((e.clientY - rect.top) / rect.height) * 100

    setTilt({
      rotateX,
      rotateY,
      glarePosition: { x: glareX, y: glareY },
      glareOpacity: glareMaxOpacity
    })
  }, [maxTilt, glareMaxOpacity])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setTilt({
      rotateX: 0,
      rotateY: 0,
      glarePosition: { x: 50, y: 50 },
      glareOpacity: 0
    })
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) {return}

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave])

  return {
    ref,
    tilt,
    isHovered,
    transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${isHovered ? scale : 1})`,
    glareStyle: {
      background: `radial-gradient(circle at ${tilt.glarePosition.x}% ${tilt.glarePosition.y}%, rgba(255,255,255,${tilt.glareOpacity}), transparent 60%)`,
      opacity: isHovered ? 1 : 0
    }
  }
}

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}
