'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { ChevronRight, Home, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemedClasses } from '@/hooks/useThemedClasses';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  items?: BreadcrumbItem[];
}

interface BreadcrumbDropdownProps {
  items: BreadcrumbItem[];
  maxItems?: number;
  separator?: React.ReactNode;
  className?: string;
}

export default function BreadcrumbDropdown({
  items,
  maxItems = 5,
  separator,
  className
}: BreadcrumbDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { getThemeClass } = useThemedClasses();

  const visibleItems = items.slice(0, maxItems);
  const hiddenItems = items.slice(maxItems);

  const renderSeparator = () => {
    if (separator) {return separator;}
    return <ChevronRight className="w-4 h-4 text-foreground/40" />;
  };

  const renderDropdown = () => {
    return (
      <AnimatePresence>
        {showDropdown && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDropdown(false)}
              className="fixed inset-0 z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'absolute top-full left-0 mt-2 min-w-64 rounded-lg shadow-2xl z-50',
                getThemeClass('bg-[#1a1a2e] border-glass-border', 'bg-white border-gray-200'),
                'border overflow-hidden'
              )}
            >
              <div className="p-2">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-xs font-medium text-foreground/60">
                    路径
                  </span>
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="p-1 rounded hover:bg-glass/20 text-foreground/60 hover:text-foreground transition-colors"
                    aria-label="关闭"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-0.5">
                  {items.map((item, index) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.href) {
                          window.location.href = item.href;
                        }
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                        'text-left text-sm',
                        getThemeClass('hover:bg-glass/20 text-foreground', 'hover:bg-gray-100 text-gray-700')
                      )}
                    >
                      {item.icon || <Home className="w-4 h-4" />}
                      <span className="flex-1">{item.label}</span>
                      {index < items.length - 1 && (
                        <ChevronRight className="w-3 h-3 text-foreground/40" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className={cn('flex items-center flex-wrap gap-2', className)}>
      {items.slice(0, 1).map((item, index) => (
        <div key={item.label} className="flex items-center">
          {index > 0 && <span className="mx-2">{renderSeparator()}</span>}
          {item.href ? (
            <a
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors',
                index === items.length - 1
                  ? 'font-medium text-tech-cyan'
                  : 'text-foreground/70 hover:text-tech-cyan'
              )}
            >
              {item.icon || <Home className="w-4 h-4" />}
              {item.label}
            </a>
          ) : (
            <span className={cn('flex items-center gap-1.5 text-sm', index === items.length - 1 ? 'font-medium text-tech-cyan' : 'text-foreground/70')}>
              {item.icon || <Home className="w-4 h-4" />}
              {item.label}
            </span>
          )}
        </div>
      ))}

      {items.length > maxItems && (
        <>
          <span className="mx-2">{renderSeparator()}</span>
          <div className="relative">
            <motion.button
              onClick={() => setShowDropdown(!showDropdown)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                getThemeClass(
                  'bg-glass/20 text-foreground hover:bg-glass/40',
                  'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>+{hiddenItems.length}</span>
            </motion.button>

            {renderDropdown()}
          </div>
        </>
      )}

      {visibleItems.length > 1 && visibleItems.map((item, index) => {
        const actualIndex = index + (items.length > maxItems ? 1 : 0);
        return (
          <div key={actualIndex} className="flex items-center">
            <span className="mx-2">{renderSeparator()}</span>
            {item.href ? (
              <a
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 text-sm transition-colors',
                  actualIndex === items.length - 1
                    ? 'font-medium text-tech-cyan'
                    : 'text-foreground/70 hover:text-tech-cyan'
                )}
              >
                {item.icon}
                {item.label}
              </a>
            ) : (
              <span className={cn('flex items-center gap-1.5 text-sm', actualIndex === items.length - 1 ? 'font-medium text-tech-cyan' : 'text-foreground/70')}>
                {item.icon}
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
