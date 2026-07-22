'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Inbox,
  Search,
  Plus,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import LottieAnimation from '@/components/ui/LottieAnimation';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  variant?: 'default' | 'search' | 'error' | 'create';
  /** 图标与文字尺寸：sm 用于列表/侧栏等紧凑场景 */
  size?: 'sm' | 'md';
  /** 减少垂直内边距 */
  compact?: boolean;
  className?: string;
  /**
   * 可选本地/远程 Lottie JSON（如 `/lottie/empty-inbox.json`）。
   * reduced-motion 或加载失败时回退到 lucide 图标。
   */
  lottieSrc?: string | object;
}

type VariantDefaults = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
};

const VARIANT_DEFAULTS: Record<
  NonNullable<EmptyStateProps['variant']>,
  VariantDefaults
> = {
  default: {
    icon: Inbox,
    title: '暂无数据',
    description: '这里暂时没有任何内容',
  },
  search: {
    icon: Search,
    title: '未找到结果',
    description: '请尝试其他搜索关键词',
    action: {
      label: '清除搜索',
      onClick: () => window.location.reload(),
      icon: RefreshCw,
    },
  },
  error: {
    icon: RefreshCw,
    title: '加载失败',
    description: '请稍后重试',
    action: {
      label: '重新加载',
      onClick: () => window.location.reload(),
      icon: RefreshCw,
    },
  },
  create: {
    icon: FileText,
    title: '开始创建',
    description: '创建您的第一个内容',
    // 无 href/onClick：调用方未提供 action 时不渲染死按钮
    action: {
      label: '立即创建',
      icon: Plus,
    },
  },
};

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title,
      description,
      icon: Icon,
      action,
      variant = 'default',
      size = 'md',
      compact = false,
      className,
      lottieSrc,
    },
    ref
  ) => {
    const reducedMotion = useReducedMotion();
    const defaults = VARIANT_DEFAULTS[variant];

    // 调用方显式传入优先于 variant 默认值
    const resolvedTitle = title ?? defaults.title;
    const resolvedDescription = description ?? defaults.description;
    const ResolvedIcon = Icon ?? defaults.icon;
    const resolvedAction = action ?? defaults.action;
    const ActionIcon = resolvedAction?.icon || ArrowRight;

    // 仅在有可交互目标时渲染操作按钮（避免 create 变体无 handler 的死按钮）
    const showAction = Boolean(
      resolvedAction && (resolvedAction.href || resolvedAction.onClick)
    );

    const isSm = size === 'sm';
    const iconWrapClass = isSm ? 'w-14 h-14' : 'w-20 h-20';
    const iconClass = isSm ? 'w-7 h-7' : 'w-10 h-10';
    const lottieBoxClass = isSm ? 'w-24 h-24' : 'w-32 h-32';
    const titleClass = isSm
      ? 'text-base font-semibold text-foreground mb-1.5'
      : 'text-lg font-semibold text-foreground mb-2';
    const descClass = isSm
      ? 'text-xs text-muted-foreground mb-4 max-w-md'
      : 'text-sm text-muted-foreground mb-6 max-w-md';
    const paddingClass = isSm
      ? compact
        ? 'py-6 px-3'
        : 'py-10 px-4'
      : compact
        ? 'py-8 px-4'
        : 'py-16 px-4';

    // CTA 复用 ui/Button（default 变体即 bg-primary），仅补充尺寸与悬停上浮
    const ctaClass =
      'gap-2 px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-primary/20';

    const iconFallback = (
      <div
        className={cn(
          iconWrapClass,
          'rounded-full bg-muted/40 backdrop-blur-lg border border-border/40 flex items-center justify-center'
        )}
      >
        <ResolvedIcon className={cn(iconClass, 'text-muted-foreground')} />
      </div>
    );

    return (
      <motion.div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          paddingClass,
          className
        )}
        {...(reducedMotion
          ? {}
          : {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5 },
            })}
      >
        <motion.div
          className="relative mb-6"
          {...(reducedMotion
            ? {}
            : {
                initial: { opacity: 0, scale: 0.8 },
                animate: { opacity: 1, scale: 1 },
                transition: { delay: 0.1, duration: 0.5 },
              })}
        >
          {lottieSrc ? (
            <LottieAnimation
              src={lottieSrc}
              loop
              autoplay
              className={cn(lottieBoxClass, 'mx-auto')}
              fallback={iconFallback}
            />
          ) : (
            <>
              {iconFallback}
              {/* reduced-motion 时跳过循环光晕 */}
              {!reducedMotion && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/10 blur-xl pointer-events-none"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </>
          )}
        </motion.div>

        <motion.h3
          className={titleClass}
          {...(reducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.2, duration: 0.4 },
              })}
        >
          {resolvedTitle}
        </motion.h3>

        <motion.p
          className={descClass}
          {...(reducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.3, duration: 0.4 },
              })}
        >
          {resolvedDescription}
        </motion.p>

        {showAction && resolvedAction && (
          <motion.div
            {...(reducedMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: 0.4, duration: 0.4 },
                })}
          >
            {resolvedAction.href ? (
              <Button asChild className={ctaClass}>
                <Link
                  href={
                    resolvedAction.href as React.ComponentProps<typeof Link>['href']
                  }
                >
                  <ActionIcon className="w-5 h-5" />
                  {resolvedAction.label}
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={resolvedAction.onClick}
                className={ctaClass}
              >
                <ActionIcon className="w-5 h-5" />
                {resolvedAction.label}
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
