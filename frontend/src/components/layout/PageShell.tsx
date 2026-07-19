import * as React from 'react';
import { cn } from '@/lib/utils';

export type PageShellDensity = 'default' | 'narrow' | 'flush';

export interface PageShellProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** 是否包 container；false 时仅外层（如 login 全屏居中） */
  contained?: boolean;
  density?: PageShellDensity;
  containerClassName?: string;
  /**
   * 默认 div：根 layout 已有 `<main id="main-content">`，避免嵌套 landmark。
   * 仅在未包根 main 的独立布局中使用 as="main"。
   */
  as?: 'main' | 'div';
}

const densityContainer: Record<PageShellDensity, string> = {
  default: 'container mx-auto px-4 sm:px-6 pt-24 pb-12 md:pb-16',
  /* 顶距避开固定 Navbar；底/md 保留 hub 呼吸感 */
  narrow: 'container mx-auto px-4 sm:px-6 pt-20 pb-16 md:pt-24 md:pb-24',
  flush: 'container mx-auto px-4 sm:px-6 py-8',
};

/**
 * 公开内容页外层：统一背景、顶距、container。
 * 不塞动效；页内自行组合 PageHeader / GlassCard。
 */
export default function PageShell({
  children,
  className,
  contained = true,
  density = 'default',
  containerClassName,
  as: Comp = 'div',
  ...props
}: PageShellProps) {
  return (
    <Comp
      className={cn(
        contained ? 'min-h-[70vh]' : 'min-h-screen',
        'bg-background text-foreground',
        className
      )}
      {...props}
    >
      {contained ? (
        <div className={cn(densityContainer[density], containerClassName)}>
          {children}
        </div>
      ) : (
        children
      )}
    </Comp>
  );
}
