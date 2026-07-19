'use client';

import type { ReactNode } from 'react';
import { motion } from '@/lib/framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { HOME_TRANSITION, HOME_VIEWPORT } from './homeMotion';

export interface HomeActSectionProps {
  /** 中文幕标，如「第一幕 · 展厅」 */
  actLabel: string;
  /** 可选副标题（补充说明，不替代子组件 h2） */
  description?: string;
  id?: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
  /**
   * 是否包 container；默认 true。
   * 子组件自带 container/section 时设 false，仅渲染幕标条。
   */
  contained?: boolean;
}

/**
 * 首页分幕外壳：电影字幕式幕标 + 内容区。
 * 使用普通 div（无 role=region），避免与子组件 <section> 嵌套 landmark。
 * 幕标以可见文案 + data-act 暴露，供样式与测试定位。
 */
export default function HomeActSection({
  actLabel,
  description,
  id,
  className,
  containerClassName,
  children,
  contained = true,
}: HomeActSectionProps) {
  const reduced = useReducedMotion();

  const headerInner = (
    <>
      <p
        data-act-label
        className={cn(
          'text-[11px] sm:text-xs font-medium tracking-[0.28em]',
          'text-primary/90'
        )}
      >
        {actLabel}
      </p>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">{description}</p>
      ) : null}
      <div
        className="mt-3 h-px w-12 bg-gradient-to-r from-primary/70 to-transparent"
        aria-hidden
      />
    </>
  );

  const header = reduced ? (
    <div className="mb-6 sm:mb-8">{headerInner}</div>
  ) : (
    <motion.div
      className="mb-6 sm:mb-8"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{
        once: HOME_VIEWPORT.once,
        amount: HOME_VIEWPORT.amount,
        margin: HOME_VIEWPORT.margin,
      }}
      transition={HOME_TRANSITION.act}
    >
      {headerInner}
    </motion.div>
  );

  return (
    <div
      id={id}
      data-act={actLabel}
      className={cn('relative scroll-mt-20', className)}
    >
      {contained ? (
        <div
          className={cn(
            'container mx-auto px-4 sm:px-6 lg:px-8',
            containerClassName
          )}
        >
          {header}
          {children}
        </div>
      ) : (
        <>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">{header}</div>
          {children}
        </>
      )}
    </div>
  );
}
