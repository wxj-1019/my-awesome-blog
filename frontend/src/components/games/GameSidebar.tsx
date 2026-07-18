'use client';

import { cn } from '@/lib/utils';
import { Gamepad2, Heart, Clock, Trophy, Star, Monitor, Smartphone, Box } from 'lucide-react';

interface GameSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function GameSidebar({ activeSection, onSectionChange }: GameSidebarProps) {
  const menuItems = [
    { id: 'all', label: '所有游戏', icon: Gamepad2 },
    { id: 'recent', label: '最近游玩', icon: Clock },
    { id: 'favorites', label: '收藏', icon: Heart },
    { id: 'wishlist', label: '愿望单', icon: Star },
    { id: 'completed', label: '已通关', icon: Trophy },
  ];

  const platforms = [
    { id: 'pc', label: 'PC', icon: Monitor },
    { id: 'console', label: '主机', icon: Box },
    { id: 'mobile', label: '移动端', icon: Smartphone },
  ];

  return (
    <aside className="w-64 h-full hidden md:flex flex-col bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-2xl border-r border-black/5 dark:border-white/5 pt-6 pb-4 px-4 flex-shrink-0">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="mb-8">
          <h2 className="px-3 text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider mb-2">
            库
          </h2>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                  activeSection === item.id
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10'
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-transform duration-200 group-active:scale-95",
                  activeSection === item.id ? "text-white" : "text-black/50 dark:text-white/50 group-hover:text-black dark:group-hover:text-white"
                )} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="px-3 text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider mb-2">
            平台
          </h2>
          <nav className="space-y-1">
            {platforms.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                  activeSection === item.id
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10'
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-transform duration-200 group-active:scale-95",
                  activeSection === item.id ? "text-white" : "text-black/50 dark:text-white/50 group-hover:text-black dark:group-hover:text-white"
                )} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}
