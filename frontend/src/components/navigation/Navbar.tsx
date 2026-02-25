'use client';

import Link from 'next/link';
import AnimatedLogo from './AnimatedLogo';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Home, BookOpen, Briefcase, Mail, Camera, Wrench, Search, X, Menu, Music, Image, Film, Gamepad2, ChevronDown, MessageSquare, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RopeThemeToggler } from '@/components/ui/rope-theme-toggler';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import UserProfileMenu from './UserProfileMenu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface NavLinkChild {
  href: `/${string}`;
  label: string;
  icon: LucideIcon;
}

interface NavLink {
  href: `/${string}`;
  label: string;
  icon: LucideIcon;
  children?: NavLinkChild[];
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const homeDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollY = window.scrollY;
        const navbarHeight = scrolled ? 64 : 80;
        setScrolled(scrollY > 10);
      }, 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
          setSearchFocused(true);
        }
      }
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const navLinks: NavLink[] = [
    { href: '/', label: '首页', icon: Home },
    {
      href: '/home',
      label: '家',
      icon: Home,
      children: [
        { href: '/music', label: '音乐馆', icon: Music },
        { href: '/gallery', label: '画廊', icon: Image },
        { href: '/videos', label: '视频', icon: Film },
        { href: '/games', label: '游戏', icon: Gamepad2 },
      ]
    },
    { href: '/articles', label: '文章', icon: BookOpen },
    { href: '/albums', label: '相册', icon: Camera },
    {
      href: '/tools',
      label: '百宝箱',
      icon: Wrench,
      children: [
        { href: '/chat', label: '模型对话', icon: MessageSquare },
        { href: '/online-tools', label: '在线工具', icon: Cpu },
      ]
    },
    { href: '/messages', label: '留言', icon: Mail },
    { href: '/contact', label: '联系我', icon: Mail },
  ];

  const navItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  };

  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      x: '100%',
      transition: {
        duration: 0.3
      }
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <>
      <header
        ref={navbarRef}
        role="banner"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-300',
          reducedMotion ? 'transition-none' : '',
          scrolled || isHovered || mobileMenuOpen
            ? 'bg-glass backdrop-blur-3xl shadow-2xl'
            : 'bg-transparent backdrop-blur-0',
          mobileMenuOpen ? 'h-64' : 'h-16'
        )}
      >
        <div className="w-full h-16 flex items-center justify-between px-4 md:px-6 lg:px-8">
          <div className={cn(
            "flex items-center flex-shrink-0 transition-all duration-300",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
          )}>
            <div className="flex items-center group">
              <AnimatedLogo isNavbarHovered={isHovered || scrolled} />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 text-sm font-medium">
            <nav role="navigation" aria-label="主导航">
              <div className="flex items-center space-x-4 lg:space-x-6 text-sm font-medium">
                {navLinks.map((link, index) => {
                  const IconComponent = link.icon;
                  const hasChildren = link.children && link.children.length > 0;
                  const isHomeDropdown = link.href === '/home';
                  const isToolsDropdown = link.href === '/tools';

                  if (isHomeDropdown && hasChildren) {
                    return (
                      <motion.div
                        key={link.href}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                        variants={navItemVariants}
                        className="relative"
                        ref={homeDropdownRef}
                        onMouseEnter={() => setHomeDropdownOpen(true)}
                        onMouseLeave={() => setHomeDropdownOpen(false)}
                      >
                        <button
                          className={cn(
                            'nav-link relative text-sm font-medium transition-colors flex items-center py-2 px-3 space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-cyan rounded-lg overflow-hidden group',
                            pathname === link.href
                              ? "text-tech-cyan"
                              : "text-foreground/80 hover:text-tech-cyan"
                          )}
                          aria-expanded={homeDropdownOpen}
                          aria-haspopup="true"
                        >
                          <IconComponent className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                          <span className="relative">
                            {link.label}
                            <span className={cn(
                              "absolute bottom-0 left-0 h-0.5 bg-tech-cyan transform scale-x-0 transition-transform duration-300 origin-left",
                              "group-hover:scale-x-100"
                            )} />
                          </span>
                          <ChevronDown className={cn(
                            "h-3 w-3 ml-1 transition-transform duration-200",
                            homeDropdownOpen && "rotate-180"
                          )} />
                        </button>
                        
                        {/* 下拉菜单 */}
                        <AnimatePresence>
                          {homeDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="absolute top-full left-0 mt-2 w-48 py-2 bg-glass backdrop-blur-3xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                            >
                              <div className="px-3 py-2 border-b border-white/10 mb-1">
                                <span className="text-xs font-medium text-white/50 uppercase tracking-wider">探索</span>
                              </div>
                              {link.children?.map((child) => {
                                const ChildIcon = child.icon;
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href as any}
                                    className={cn(
                                      'flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5',
                                      pathname === child.href
                                        ? "text-tech-cyan bg-tech-cyan/10"
                                        : "text-foreground/80 hover:text-tech-cyan"
                                    )}
                                    onClick={() => setHomeDropdownOpen(false)}
                                  >
                                    <ChildIcon className="h-4 w-4" />
                                    <span>{child.label}</span>
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  if (isToolsDropdown && hasChildren) {
                    return (
                      <motion.div
                        key={link.href}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                        variants={navItemVariants}
                        className="relative"
                        ref={toolsDropdownRef}
                        onMouseEnter={() => setToolsDropdownOpen(true)}
                        onMouseLeave={() => setToolsDropdownOpen(false)}
                      >
                        <button
                          className={cn(
                            'nav-link relative text-sm font-medium transition-colors flex items-center py-2 px-3 space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-cyan rounded-lg overflow-hidden group',
                            pathname === link.href
                              ? "text-tech-cyan"
                              : "text-foreground/80 hover:text-tech-cyan"
                          )}
                          aria-expanded={toolsDropdownOpen}
                          aria-haspopup="true"
                        >
                          <IconComponent className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                          <span className="relative">
                            {link.label}
                            <span className={cn(
                              "absolute bottom-0 left-0 h-0.5 bg-tech-cyan transform scale-x-0 transition-transform duration-300 origin-left",
                              "group-hover:scale-x-100"
                            )} />
                          </span>
                          <ChevronDown className={cn(
                            "h-3 w-3 ml-1 transition-transform duration-200",
                            toolsDropdownOpen && "rotate-180"
                          )} />
                        </button>

                        {/* 下拉菜单 */}
                        <AnimatePresence>
                          {toolsDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="absolute top-full left-0 mt-2 w-48 py-2 bg-glass backdrop-blur-3xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                            >
                              <div className="px-3 py-2 border-b border-white/10 mb-1">
                                <span className="text-xs font-medium text-white/50 uppercase tracking-wider">工具</span>
                              </div>
                              {link.children?.map((child) => {
                                const ChildIcon = child.icon;
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href as any}
                                    className={cn(
                                      'flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5',
                                      pathname === child.href
                                        ? "text-tech-cyan bg-tech-cyan/10"
                                        : "text-foreground/80 hover:text-tech-cyan"
                                    )}
                                    onClick={() => setToolsDropdownOpen(false)}
                                  >
                                    <ChildIcon className="h-4 w-4" />
                                    <span>{child.label}</span>
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={link.href}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                      variants={navItemVariants}
                    >
                      <Link
                        key={link.href}
                        href={link.href as any}
                        className={cn(
                          'nav-link relative text-sm font-medium transition-colors flex items-center py-2 px-3 space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-cyan rounded-lg overflow-hidden group',
                          pathname === link.href
                            ? "text-tech-cyan"
                            : "text-foreground/80 hover:text-tech-cyan"
                        )}
                        aria-current={pathname === link.href ? "page" : undefined}
                      >
                        <IconComponent className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                        <span className="relative">
                          {link.label}
                          <span className={cn(
                            "absolute bottom-0 left-0 h-0.5 bg-tech-cyan transform scale-x-0 transition-transform duration-300 origin-left",
                            "group-hover:scale-x-100"
                          )} />
                        </span>
                        </Link>
                      </motion.div>
                    );
                })}
              </div>
            </nav>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 text-foreground">
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-tech-cyan hover:bg-tech-cyan/10 transition-all duration-300"
                onClick={() => {
                  const searchInput = document.getElementById('global-search-input');
                  if (searchInput) {
                    searchInput.focus();
                    setSearchFocused(true);
                  }
                }}
                aria-label="搜索 (Cmd/Ctrl + K)"
              >
                <Search className="h-4 w-4" />
                <kbd className="hidden lg:inline-block ml-2 px-2 py-0.5 text-xs font-mono bg-black/20 rounded border border-white/10">
                  ⌘K
                </kbd>
              </Button>
            </div>

            <div className="flex items-center space-x-2 text-foreground">
              <RopeThemeToggler ropeLength={120} className="hidden md:flex" />
              <RopeThemeToggler ropeLength={80} className="flex md:hidden" />
            </div>

            <div className="flex items-center space-x-2 text-foreground">
              <UserProfileMenu mounted={mounted} />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden flex items-center justify-center p-2 hover:bg-tech-cyan/10 transition-all duration-300"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileMenuOpen}
            >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden absolute top-16 left-0 right-0 bg-glass backdrop-blur-3xl border-b border-white/10 overflow-y-auto"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={mobileMenuVariants}
            >
              <nav role="navigation" aria-label="移动端导航" className="py-4 px-4 space-y-2">
                {navLinks.map((link, index) => {
                  const IconComponent = link.icon;
                  const hasChildren = link.children && link.children.length > 0;
                  
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Link
                        href={link.href as any}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-cyan',
                          pathname === link.href
                            ? "bg-tech-cyan/20 text-tech-cyan"
                            : "text-foreground/80 hover:bg-white/5 hover:text-tech-cyan"
                        )}
                        aria-current={pathname === link.href ? "page" : undefined}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="text-base font-medium">{link.label}</span>
                      </Link>
                      
                      {/* 移动端子菜单 */}
                      {hasChildren && (
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-white/10 pl-4">
                          {link.children?.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.href}
                                href={child.href as any}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                  'flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors text-sm',
                                  pathname === child.href
                                    ? "text-tech-cyan bg-tech-cyan/10"
                                    : "text-foreground/60 hover:text-tech-cyan hover:bg-white/5"
                                )}
                              >
                                <ChildIcon className="h-4 w-4" />
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
