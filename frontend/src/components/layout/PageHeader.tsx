import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  align?: 'center' | 'left';
  /** default = hub 级；lg = about 等更重标题 */
  size?: 'default' | 'lg';
  className?: string;
}

/**
 * 公开页标题区：对齐 /tools、/home hub 的图标+标题+描述。
 */
export default function PageHeader({
  title,
  description,
  icon: Icon,
  align = 'center',
  size = 'default',
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-10',
        align === 'center' && 'max-w-2xl mx-auto text-center',
        align === 'left' && 'max-w-4xl mx-auto',
        className
      )}
    >
      {Icon ? (
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 text-primary mb-4">
          <Icon className="w-7 h-7" aria-hidden />
        </div>
      ) : null}
      <h1
        className={cn(
          'font-bold text-foreground mb-3',
          size === 'default' && 'text-2xl md:text-3xl',
          size === 'lg' && 'text-3xl md:text-5xl'
        )}
      >
        {title}
      </h1>
      {description ? (
        <p
          className={cn(
            'text-muted-foreground',
            size === 'default' && 'text-sm md:text-base',
            size === 'lg' && 'text-base md:text-xl leading-relaxed'
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
