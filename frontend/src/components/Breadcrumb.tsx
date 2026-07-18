'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ChevronRightIcon } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex mb-6 ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 lg:space-x-3">
        {items.map((item, index) => (
          <li key={item.label} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="mx-1 md:mx-2 text-muted-foreground h-4 w-4 flex-shrink-0" />
            )}
            {item.href && !item.active ? (
              <Link
                href={item.href as Route}
                className="text-sm font-medium text-tech-cyan hover:text-tech-lightcyan transition-colors truncate max-w-[200px]"
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={`text-sm font-medium truncate max-w-[200px] ${
                  item.active 
                    ? 'text-foreground font-semibold' 
                    : 'text-muted-foreground'
                }`}
                aria-current={item.active ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}