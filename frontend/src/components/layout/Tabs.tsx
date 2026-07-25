'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  content: ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  variant?: 'default' | 'pills' | 'underline' | 'card';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  animated?: boolean;
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
}

export default function Tabs({
  tabs,
  defaultTab,
  variant = 'default',
  size = 'md',
  orientation = 'horizontal',
  animated = true,
  className,
  tabClassName: _tabClassName,
  contentClassName
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const isVertical = orientation === 'vertical';

  const renderTabs = () => {
    switch (variant) {
      case 'pills':
        return (
          <div
            className={cn(
              'flex gap-2 p-1 rounded-lg bg-glass/20',
              isVertical ? 'flex-col' : 'flex-row'
            )}
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  'relative flex items-center gap-2 font-medium rounded-md transition-colors',
                  sizeClasses[size],
                  activeTab === tab.id
                    ? 'bg-tech-cyan text-black shadow-lg'
                    : 'text-foreground/70 hover:text-foreground hover:bg-glass/30',
                  tab.disabled && 'opacity-50 cursor-not-allowed'
                )}
                whileHover={!tab.disabled ? { scale: 1.02 } : undefined}
                whileTap={!tab.disabled ? { scale: 0.98 } : undefined}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </div>
        );

      case 'underline':
        return (
          <div className={cn(
            'flex border-b border-glass-border',
            isVertical ? 'flex-col border-b-0 border-r' : 'flex-row'
          )}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  'relative flex items-center gap-2 font-medium transition-colors',
                  sizeClasses[size],
                  activeTab === tab.id
                    ? 'text-tech-cyan'
                    : 'text-foreground/70 hover:text-foreground',
                  tab.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && animated && (
                  <motion.div
                    layoutId="tabIndicator"
                    className={cn(
                      'absolute bg-tech-cyan',
                      isVertical ? 'left-0 top-0 bottom-0 w-0.5 rounded-r-full' : 'bottom-0 left-0 right-0 h-0.5 rounded-full'
                    )}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  />
                )}
              </button>
            ))}
          </div>
        );

      case 'card':
        return (
          <div className={cn(
            'flex flex-col gap-2 p-1 rounded-lg bg-glass/20',
            isVertical ? 'w-48' : 'flex-row'
          )}>
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                initial={{ opacity: 0, y: isVertical ? 10 : 0, x: isVertical ? 0 : 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'relative flex items-center gap-3 font-medium rounded-md transition-colors overflow-hidden',
                  sizeClasses[size],
                  activeTab === tab.id
                    ? 'bg-tech-cyan text-black'
                    : 'text-foreground/70 hover:text-foreground hover:bg-glass/30',
                  tab.disabled && 'opacity-50 cursor-not-allowed'
                )}
                whileHover={!tab.disabled ? { scale: 1.02 } : undefined}
                whileTap={!tab.disabled ? { scale: 0.98 } : undefined}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-tech-cyan"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </motion.button>
            ))}
          </div>
        );

      default:
        return (
          <div className={cn(
            'flex gap-1',
            isVertical ? 'flex-col' : 'flex-row'
          )}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  'flex items-center gap-2 font-medium transition-all',
                  sizeClasses[size],
                  'rounded-lg',
                  activeTab === tab.id
                    ? 'bg-tech-cyan/20 text-tech-cyan'
                    : 'text-foreground/70 hover:text-foreground hover:bg-glass/20',
                  tab.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        );
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={cn('space-y-4', className)}>
      {renderTabs()}

      <AnimatePresence mode="wait">
        {animated ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: isVertical ? -10 : 0, y: isVertical ? 0 : 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: isVertical ? 10 : 0, y: isVertical ? 0 : -10 }}
            transition={{ duration: 0.2 }}
            className={contentClassName}
          >
            {activeTabData?.content}
          </motion.div>
        ) : (
          <div key={activeTab} className={contentClassName}>
            {activeTabData?.content}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
