'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionProps {
  title: string;
  titleClassName?: string;
  children: React.ReactNode;
  moreLink?: string;
  moreText?: string;
}

export default function Section({ title, titleClassName, children, moreLink, moreText = '查看全部' }: SectionProps) {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn(
          'text-xl font-bold text-foreground tracking-tight',
          titleClassName
        )}>
          {title}
        </h2>
        {moreLink && (
          <Link
            href={moreLink as never}
            className={cn(
              'group inline-flex items-center gap-1',
              'text-sm font-medium text-primary',
              'transition-colors duration-300',
              'hover:text-accent hover:gap-2'
            )}
          >
            {moreText}
            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
