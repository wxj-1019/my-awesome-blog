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
    <aside className="w-64 h-full hidden md:flex flex-col bg-card/50 backdrop-blur-2xl border-r border-glass-border pt-6 pb-4 px-4 flex-shrink-0">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="mb-8">
          <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-transform duration-200 group-active:scale-95",
                  activeSection === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-transform duration-200 group-active:scale-95",
                  activeSection === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
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
