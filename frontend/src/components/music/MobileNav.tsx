'use client';

import { cn } from '@/lib/utils';
import { Music, Heart, Search, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300',
        'hover:bg-foreground/5',
        active && 'bg-primary/10'
      )}
      onClick={onClick}
    >
      <Icon
        className={cn(
          'w-6 h-6 transition-all duration-300',
          active
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground/70'
        )}
        strokeWidth={active ? 2.5 : 2}
      />
      <span
        className={cn(
          'text-[10px] font-medium transition-colors duration-300',
          active
            ? 'text-primary'
            : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </button>
  );
}

interface MobileNavProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export default function MobileNav({ activeSection, onSectionChange }: MobileNavProps) {
  const navItems = [
    { id: 'discover', icon: Music, label: '发现' },
    { id: 'liked', icon: Heart, label: '喜欢' },
    { id: 'search', icon: Search, label: '搜索' },
    { id: 'profile', icon: User, label: '我的' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-2xl border-t border-white/5">
      <div className="flex items-center justify-around h-full px-4 pb-safe">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeSection === item.id}
            onClick={() => onSectionChange?.(item.id)}
          />
        ))}
      </div>
    </nav>
  );
}
