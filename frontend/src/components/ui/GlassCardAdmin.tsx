'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from '@/lib/framer-motion'
import { cn } from '@/lib/utils'

export interface GlassCardAdminProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'selectable'
  hover?: boolean
  /**
   * 是否套用默认入场动画（淡入 + 上移 20px）。默认 true。
   *
   * 命名为 entrance 而非 animate，是为了不遮蔽 framer-motion 的 `animate`——
   * 调用点需要自定义动画时（如 AnimatePresence 列表项的 initial/animate/exit/
   * layout 与按 index 错开的 stagger），传 entrance={false} 后即可自由使用
   * 全部 motion props，它们会覆盖本组件的默认值。
   */
  entrance?: boolean
}

/**
 * 变体样式：只消费语义 token。
 * tech-cyan / primary 本身是随主题切换的 CSS 变量，故无需再写 dark: 分支。
 */
const variantStyles = {
  default: cn(
    'bg-glass',
    'border border-glass-border',
    'shadow-[var(--glass-shadow)]',
    'backdrop-blur-xl'
  ),
  primary: cn(
    'bg-gradient-to-br from-primary/10 to-tech-sky/10',
    'border border-primary/25',
    'shadow-tech-cyan',
    'backdrop-blur-xl'
  ),
  secondary: cn(
    'bg-glass/60',
    'border border-glass-border/60',
    'shadow-[var(--glass-shadow)]',
    'backdrop-blur-lg'
  ),
  ghost: cn(
    'bg-transparent',
    'border-transparent',
    'shadow-none'
  ),
  /* 可选中条目卡（列表项/网格项）：2px 描边 + hover 主色描边，不浮起 */
  selectable: cn(
    'relative overflow-hidden cursor-pointer',
    'border-2 border-glass-border/30 hover:border-primary/50',
    'bg-glass/10 hover:bg-glass/20',
    'backdrop-blur-lg'
  ),
}

const GlassCardAdmin = React.forwardRef<HTMLDivElement, GlassCardAdminProps>(
  ({ children, className, variant = 'default', hover = false, entrance = true, ...props }, ref) => {
    const baseClasses = cn(
      'rounded-2xl transition-[colors,transform] duration-300',
      variantStyles[variant],
      /* hover 浮起幅度与全站统一（规范 §6.4）：-4px + 阴影提升 + 主色描边 */
      hover && 'hover:-translate-y-1 hover:shadow-[var(--glass-shadow)] hover:border-primary/40 cursor-pointer'
    )

    /* 默认入场动画写在 props 展开之前，调用点传同名 motion props 即可覆盖 */
    const entranceProps: HTMLMotionProps<'div'> = entrance
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, ease: 'easeOut' },
        }
      : {}

    return (
      <motion.div
        ref={ref}
        className={cn(baseClasses, className)}
        {...entranceProps}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCardAdmin.displayName = 'GlassCardAdmin'

export default GlassCardAdmin
