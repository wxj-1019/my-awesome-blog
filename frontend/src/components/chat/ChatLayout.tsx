import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  isSidebarOpen: boolean;
}

export function ChatLayout({ children, sidebar, isSidebarOpen }: ChatLayoutProps) {
  return (
    <div className="fixed inset-0 top-16 flex overflow-hidden bg-transparent text-white selection:bg-cyan-500/30">
      {/* Aurora 背景：静态低透明渐变斑，无脉冲动画 */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[60%] w-[60%] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] h-[60%] w-[60%] rounded-full bg-purple-600/5 blur-[120px]" />
      </div>

      {/* Sidebar */}
      {sidebar}

      {/* Main Content */}
      <main
        className={cn(
          "relative z-10 flex flex-1 flex-col overflow-hidden transition-all duration-300",
          isSidebarOpen ? "md:ml-72" : "md:ml-0"
        )}
      >
        {children}
      </main>
    </div>
  );
}
