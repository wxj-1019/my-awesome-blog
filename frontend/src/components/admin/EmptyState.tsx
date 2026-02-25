'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  FolderOpen, 
  Inbox, 
  Search,
  Plus,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

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
  className?: string;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    title, 
    description, 
    icon: Icon, 
    action,
    variant = 'default',
    className 
  }, ref) => {
    const defaultConfig: Record<string, {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      description: string;
      action?: {
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: React.ComponentType<{ className?: string }>;
      };
    }> = {
      default: {
        icon: Icon || Inbox,
        title: title || '暂无数据',
        description: description || '这里暂时没有任何内容',
      },
      search: {
        icon: Icon || Search,
        title: title || '未找到结果',
        description: description || '请尝试其他搜索关键词',
        action: action || {
          label: '清除搜索',
          onClick: () => window.location.reload(),
          icon: RefreshCw,
        },
      },
      error: {
        icon: Icon || RefreshCw,
        title: title || '加载失败',
        description: description || '请稍后重试',
        action: action || {
          label: '重新加载',
          onClick: () => window.location.reload(),
          icon: RefreshCw,
        },
      },
      create: {
        icon: Icon || FileText,
        title: title || '开始创建',
        description: description || '创建您的第一个内容',
        action: action || {
          label: '立即创建',
          icon: Plus,
        },
      },
    };

    const config = defaultConfig[variant];
    const DefaultIcon = config.icon as React.ComponentType<{ className?: string }>;
    const ActionIcon = config.action?.icon || ArrowRight;

    return (
      <motion.div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center py-16 px-4',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="relative mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="w-20 h-20 rounded-full bg-glass/20 backdrop-blur-lg border border-glass-border/30 flex items-center justify-center">
            <DefaultIcon className="w-10 h-10 text-foreground/40" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-full bg-tech-cyan/10 blur-xl"
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
        </motion.div>

        <motion.h3
          className="text-lg font-semibold text-foreground mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {config.title}
        </motion.h3>

        <motion.p
          className="text-sm text-foreground/60 mb-6 max-w-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {config.description}
        </motion.p>

        {config.action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {config.action.href ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Link
                href={config.action.href as any}
                className="inline-flex items-center gap-2 px-6 py-3 bg-tech-cyan text-white rounded-lg hover:bg-tech-cyan/90 transition-all duration-200 hover:scale-105 shadow-lg shadow-tech-cyan/20"
              >
                <ActionIcon className="w-5 h-5" />
                {config.action.label}
              </Link>
            ) : (
              <button
                onClick={config.action.onClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-tech-cyan text-white rounded-lg hover:bg-tech-cyan/90 transition-all duration-200 hover:scale-105 shadow-lg shadow-tech-cyan/20"
              >
                <ActionIcon className="w-5 h-5" />
                {config.action.label}
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
