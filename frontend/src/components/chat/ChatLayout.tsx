import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  isSidebarOpen: boolean;
}

/**
 * 对话页布局：透明壳，让全站 AmbientBackground 透出（与其他公开页一致）。
 * 不再自带 aurora 渐变斑，避免与全局背景割裂。
 */
export function ChatLayout({ children, sidebar, isSidebarOpen }: ChatLayoutProps) {
  return (
    <div className="fixed inset-0 top-16 flex overflow-hidden bg-transparent text-foreground selection:bg-primary/30">
      {/* Sidebar */}
      {sidebar}

      {/* Main Content */}
      <main
        className={cn(
          'relative z-10 flex flex-1 flex-col overflow-hidden transition-[margin] duration-300',
          isSidebarOpen ? 'md:ml-72' : 'md:ml-0'
        )}
      >
        {children}
      </main>
    </div>
  );
}
