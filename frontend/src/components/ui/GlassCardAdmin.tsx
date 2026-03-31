'use client'

import * as React from 'react'
import { motion, MotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface GlassCardAdminProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'ghost'
  hover?: boolean
  animate?: boolean
}

const variantStyles = {
  default: cn(
    'bg-white/80 dark:bg-slate-900/60',
    'border border-slate-200/50 dark:border-white/10',
    'shadow-lg shadow-slate-200/20 dark:shadow-black/20',
    'backdrop-blur-xl'
  ),
  primary: cn(
    'bg-gradient-to-br from-tech-cyan/5 to-tech-sky/5',
    'dark:from-tech-cyan/10 dark:to-tech-sky/10',
    'border border-tech-cyan/20 dark:border-tech-cyan/30',
    'shadow-lg shadow-tech-cyan/5 dark:shadow-tech-cyan/10',
    'backdrop-blur-xl'
  ),
  secondary: cn(
    'bg-white/60 dark:bg-slate-800/50',
    'border border-slate-200/30 dark:border-white/5',
    'shadow-md shadow-slate-200/10 dark:shadow-black/10',
    'backdrop-blur-lg'
  ),
  ghost: cn(
    'bg-transparent',
    'border-transparent',
    'shadow-none'
  ),
}

const GlassCardAdmin = React.forwardRef<HTMLDivElement, GlassCardAdminProps>(
  ({ children, className, variant = 'default', hover = false, animate = true, ...props }, ref) => {
    const baseClasses = cn(
      'rounded-2xl transition-all duration-300',
      variantStyles[variant],
      hover && 'hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/30 dark:hover:shadow-black/30 cursor-pointer'
    )

    if (!animate) {
      return (
        <div ref={ref} className={cn(baseClasses, className)} {...props}>
          {children}
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={cn(baseClasses, className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...(props as MotionProps)}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCardAdmin.displayName = 'GlassCardAdmin'

export default GlassCardAdmin
