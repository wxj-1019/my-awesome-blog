'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Home, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  items: AdminNavItem[];
}

interface AdminSidebarProps {
  menuGroups: AdminNavGroup[];
  sidebarOpen: boolean;
  mobileOpen: boolean;
  onMobileToggle: (open: boolean) => void;
  onSidebarToggle: (open: boolean) => void;
}

const AdminSidebar = React.forwardRef<HTMLDivElement, AdminSidebarProps>(
  ({ menuGroups, sidebarOpen, mobileOpen, onMobileToggle, onSidebarToggle }, ref) => {
    const pathname = usePathname();
    
    const itemVariants = {
      open: { opacity: 1, x: 0 },
      closed: { opacity: 0, x: -20 }
    };
    
    const groupVariants = {
      open: { height: 'auto', opacity: 1 },
      closed: { height: 0, opacity: 0 }
    };

    return (
      <motion.aside
        ref={ref}
        initial={false}
        className={cn(
          "fixed top-0 left-0 z-50 h-full",
          "bg-gradient-to-b from-white/80 via-white/70 to-white/60",
          "dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-900/50",
          "backdrop-blur-md",
          "border-r border-slate-200/50 dark:border-slate-700/50",
          "text-slate-800 dark:text-slate-200",
          "transition-transform duration-500 ease-out",
          "shadow-2xl shadow-slate-900/5 dark:shadow-slate-950/20",
          sidebarOpen ? "w-64" : "w-20",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        animate={{
          width: sidebarOpen ? 256 : 80,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <motion.div 
          className="h-16 flex items-center justify-between px-4 border-b border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden"
          animate={{ 
            justifyContent: sidebarOpen ? "space-between" : "center",
            paddingLeft: sidebarOpen ? 16 : 0,
            paddingRight: sidebarOpen ? 16 : 0
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-tech-cyan/5 via-transparent to-tech-sky/5"
            animate={{ opacity: sidebarOpen ? 1 : 0 }}
          />
          
          <motion.div
            className="flex items-center gap-3 overflow-hidden relative z-10"
            animate={{ 
              opacity: sidebarOpen ? 1 : 0,
              width: sidebarOpen ? "auto" : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-tech-cyan via-tech-sky to-blue-500 flex items-center justify-center shadow-lg shadow-tech-cyan/30"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <motion.span 
              className="text-lg font-bold bg-gradient-to-r from-tech-cyan via-tech-sky to-blue-500 bg-clip-text text-transparent"
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
            >
              Admin
            </motion.span>
          </motion.div>
          
          <motion.button
            whileHover={{ scale: 1.1, rotate: sidebarOpen ? 0 : 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSidebarToggle(!sidebarOpen)}
            className="p-2.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200 relative z-10 hidden lg:flex items-center justify-center group"
            aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5 text-foreground/50 group-hover:text-tech-cyan transition-colors" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-5 h-5 text-foreground/50 group-hover:text-tech-cyan transition-colors" aria-hidden="true" />
              )}
            </motion.div>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onMobileToggle(false)}
            className="p-2.5 rounded-xl hover:bg-glass/50 transition-colors duration-200 lg:hidden relative z-10"
            animate={{ opacity: mobileOpen ? 1 : 0 }}
            aria-label="关闭"
          >
            <svg 
              className="w-5 h-5 text-foreground/70" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </motion.div>

        <motion.nav 
          className="p-3 overflow-y-auto h-[calc(100vh-8rem)] scrollbar-thin scrollbar-thumb-slate-300/50 dark:scrollbar-thumb-slate-600/50 scrollbar-track-transparent"
          variants={{
            open: { opacity: 1 },
            closed: { opacity: 1 }
          }}
        >
          <motion.div
            variants={groupVariants}
            animate={sidebarOpen ? "open" : "closed"}
            className="space-y-6"
          >
            {menuGroups.map((group, groupIndex) => (
              <motion.div 
                key={group.id}
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
              >
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.h3 
                      className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2"
                      role="heading"
                      aria-level={2}
                      variants={itemVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      <span className="w-8 h-px bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600" />
                      {group.label}
                      <span className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
                    </motion.h3>
                  )}
                </AnimatePresence>
                
                <div className="space-y-1">
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || 
                      (item.href !== '/admin' && pathname.startsWith(item.href));
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          transition: { 
                            delay: groupIndex * 0.1 + itemIndex * 0.05,
                            duration: 0.4
                          }
                        }}
                        whileHover={{ x: sidebarOpen ? 4 : 0 }}
                      >
                        <Link
                          href={item.href as React.ComponentProps<typeof Link>['href']}
                          onClick={() => onMobileToggle(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-300 ease-out",
                            "relative overflow-hidden group",
                            isActive 
                              ? "bg-gradient-to-r from-tech-cyan/15 via-tech-sky/10 to-transparent text-slate-800 dark:text-slate-100 shadow-lg shadow-tech-cyan/10 border border-tech-cyan/20 dark:border-tech-cyan/30" 
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-700/30"
                          )}
                        >
                          {isActive && (
                            <motion.div 
                              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-tech-cyan via-tech-sky to-blue-500 rounded-r-full"
                              layoutId="activeIndicator"
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                          
                          <motion.div
                            className={cn(
                              "relative p-2 rounded-lg transition-colors duration-300",
                              isActive 
                                ? "bg-gradient-to-br from-tech-cyan/25 to-tech-sky/25 shadow-md shadow-tech-cyan/20" 
                                : "group-hover:bg-foreground/5"
                            )}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            animate={{ scale: isActive ? 1.05 : 1 }}
                          >
                            <Icon className={cn(
                              "w-5 h-5 transition-colors duration-300",
                              isActive ? "text-tech-cyan" : "group-hover:text-tech-cyan/70"
                            )} />
                            
                            {isActive && (
                              <motion.div 
                                className="absolute inset-0 rounded-lg bg-tech-cyan/20 blur-lg -z-10"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                          </motion.div>
                          
                          <motion.span
                            className="text-sm font-medium whitespace-nowrap"
                            animate={{ 
                              opacity: sidebarOpen ? 1 : 0,
                              width: sidebarOpen ? "auto" : 0,
                              display: sidebarOpen ? "inline" : "none"
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            {item.label}
                          </motion.span>
                          
                          {isActive && sidebarOpen && (
                            <motion.div 
                              className="absolute right-3 w-2 h-2 rounded-full bg-tech-cyan"
                              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 -translate-x-full group-hover:translate-x-full" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.nav>

        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-t from-white/50 to-transparent dark:from-slate-800/50"
          animate={{ 
            paddingLeft: sidebarOpen ? 12 : 8,
            paddingRight: sidebarOpen ? 12 : 8
          }}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400",
              "hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-700/30",
              "transition-colors duration-300 group relative overflow-hidden"
            )}
          >
            <motion.div
              className="p-2 rounded-lg group-hover:bg-foreground/5 transition-colors"
              whileHover={{ scale: 1.1, rotate: -10 }}
            >
              <Home className="w-5 h-5" />
            </motion.div>
            
            <motion.span
              className="text-sm font-medium whitespace-nowrap"
              animate={{ 
                opacity: sidebarOpen ? 1 : 0,
                width: sidebarOpen ? "auto" : 0,
                display: sidebarOpen ? "inline" : "none"
              }}
              transition={{ duration: 0.2 }}
            >
              返回前台
            </motion.span>
            
            <motion.div
              className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              animate={{ x: sidebarOpen ? 0 : 10 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </Link>
        </motion.div>
      </motion.aside>
    );
  }
);

AdminSidebar.displayName = 'AdminSidebar';

export default AdminSidebar;