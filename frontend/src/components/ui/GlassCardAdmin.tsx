'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface GlassCardAdminProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'secondary' | 'ghost'
}

const GlassCardAdmin = React.forwardRef<HTMLDivElement, GlassCardAdminProps>(
  ({ children, className, variant = 'default', ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl border p-6',
          'backdrop-blur-xl',
          'shadow-lg',
          variant === 'default' && 'bg-white/80 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-700/60',
          variant === 'secondary' && 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-300/50 dark:border-slate-600/60',
          variant === 'ghost' && 'bg-transparent border-transparent shadow-none',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCardAdmin.displayName = 'GlassCardAdmin'

export default GlassCardAdmin
