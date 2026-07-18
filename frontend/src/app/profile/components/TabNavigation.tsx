'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Activity, Lock, Bell, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  orientation?: 'horizontal' | 'vertical';
}
export default function TabNavigation({
  activeTab,
  setActiveTab,
  orientation = 'horizontal'
}: TabNavigationProps) {
  const tabs = [
    { id: 'profile', label: '个人信息', icon: User, description: '管理您的个人资料' },
    { id: 'security', label: '账号安全', icon: Lock, description: '密码与登录设置' },
    { id: 'notifications', label: '通知设置', icon: Bell, description: '管理通知偏好' },
    { id: 'activity', label: '活动记录', icon: Activity, description: '查看您的活动历史' },
    { id: 'settings', label: '系统设置', icon: Settings, description: '应用配置选项' },
    { id: 'privacy', label: '隐私设置', icon: Shield, description: '隐私与权限管理' },
  ];
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  const isVertical = orientation === 'vertical';
  return (
    <div
      className={cn(
        'relative',
        isVertical ? 'w-64 flex flex-col' : 'flex border-b border-glass-border'
      )}
    >
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'relative overflow-hidden transition-all duration-300',
              isVertical
                ? cn(
                    'flex items-start gap-3 p-4 rounded-lg mb-2 text-left',
                    isActive
                      ? 'bg-tech-cyan/20 text-tech-cyan'
                      : 'text-foreground/70 hover:bg-glass/20'
                  )
                : cn(
                    'flex flex-col md:flex-row items-center gap-2 py-3 px-4 text-sm font-medium',
                    isActive
                      ? 'text-tech-cyan'
                      : 'text-foreground/70 hover:text-foreground'
                  )
            )}
            initial={{ opacity: 0, y: isVertical ? 10 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isActive && !isVertical && (
              <motion.div
                className="absolute bottom-0 left-0 w-full h-0.5 bg-tech-cyan"
                layoutId="tabIndicator"
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              />
            )}
            {isActive && isVertical && (
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-1 bg-tech-cyan rounded-r-full"
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              />
            )}
            <Icon className={cn(
              'transition-all duration-300',
              isActive ? 'scale-110' : 'scale-100',
              isVertical ? 'w-5 h-5 mt-0.5' : 'w-4 h-4'
            )} />
            <div className="flex-1">
              <span className={cn(
                'block font-medium',
                isVertical ? 'text-sm' : 'text-xs md:text-sm'
              )}>
                {tab.label}
              </span>
              {isVertical && tab.description && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    height: isActive ? 'auto' : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-xs text-foreground/50 mt-1"
                >
                  {tab.description}
                </motion.p>
              )}
            </div>
            {isActive && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className={cn(
                    'w-2 h-2 rounded-full bg-tech-cyan',
                    isVertical ? 'ml-auto' : 'ml-2'
                  )}
                />
              </AnimatePresence>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}