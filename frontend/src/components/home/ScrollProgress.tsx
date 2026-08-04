'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    let ticking = false

    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100)

      setProgress(scrollPercent)

      const currentScrollY = window.scrollY
      const scrollingDown = currentScrollY > lastScrollY
      setIsScrollingDown(scrollingDown)
      setLastScrollY(currentScrollY)

      if (scrollTop > 50) {
        setIsVisible(true)
      } else if (scrollTop < 10) {
        setIsVisible(false)
      }

      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastScrollY])

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[60] h-1 transition-opacity duration-300 ease-out',
        !isVisible && 'opacity-0',
        isScrollingDown && 'opacity-50'
      )}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="页面滚动进度"
    >
      <div
        className={cn(
          'h-full w-0 bg-gradient-to-r from-tech-cyan via-tech-sky to-tech-lightcyan',
          'shadow-[0_0_8px_rgba(6,182,212,0.3)]',
          'transition-[width] duration-150 ease-out'
        )}
        style={{ width: `${progress}%` }}
      >
        <div className="absolute inset-0 bg-white/20 animate-pulse" />
      </div>
    </div>
  )
}
