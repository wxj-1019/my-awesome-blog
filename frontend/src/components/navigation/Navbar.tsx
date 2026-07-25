'use client';
import Link from 'next/link';
import type { Route } from 'next';
import BrandLogo from './BrandLogo';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Home, BookOpen, Mail, Camera, Wrench, Search, X, Menu, Music, Film, Gamepad2, ChevronDown, MessageSquare, Cpu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RopeThemeToggler } from '@/components/ui/rope-theme-toggler';
import UserProfileMenu from './UserProfileMenu';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavLinkChild {
  href: string;
  label: string;
  icon: LucideIcon;
}
interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavLinkChild[];
}

const navLinks: NavLink[] = [
  { href: '/', label: '首页', icon: Home },
  {
    href: '/home',
    label: '家',
    icon: Home,
    children: [
      { href: '/music', label: '音乐馆', icon: Music },
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
      { href: '/tools/skills', label: 'Skill 收藏馆', icon: Sparkles },
    ]
  },
  { href: '/messages', label: '留言', icon: Mail },
  { href: '/contact', label: '联系我', icon: Mail },
];

/**
 * 桌面端下拉菜单（纯 CSS 过渡）。
 * 注意：触发器与面板之间禁止用 margin 留空——空隙不属于任何子节点，
 * 鼠标移入时会先触发父级 mouseleave，菜单瞬间收起。用 pt-* 作可命中桥接。
 */
function DropdownMenu({
  isOpen,
  id,
  label,
  children,
}: {
  isOpen: boolean;
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={cn(
        'absolute top-full left-0 z-50 w-48 pt-2',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      <div
        role="menu"
        aria-label={label}
        className={cn(
          'w-full py-2 bg-glass backdrop-blur-xl rounded-xl border border-glass-border shadow-2xl overflow-hidden',
          'transition-transform duration-200 ease-out origin-top',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-1 scale-95'
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** hover 打开 / 延迟关闭，避免移入菜单途中闪关 */
function useHoverDropdown(closeDelayMs = 120) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, closeDelayMs);
  }, [clearCloseTimer, closeDelayMs]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  return { open, openMenu, scheduleClose, setOpen };
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const homeDropdown = useHoverDropdown();
  const toolsDropdown = useHoverDropdown();
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
    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10);
        rafId = 0;
      });
    };
    // passive: 不阻塞滚动；rAF 节流：每帧最多更新一次
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
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

  /** 聚焦搜索框 */
  const focusSearch = useCallback(() => {
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  return (
    <>
      <header
        ref={navbarRef}
        role="banner"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          // overflow-visible：桌面下拉与移动端面板从 h-16 顶栏向下展开，不可裁剪
          // header 高度固定 h-16，移动端面板为独立绝对定位层，不做高度补间推挤整页
          'fixed top-0 left-0 right-0 z-[100] w-full h-16 overflow-visible transition-all duration-300',
          reducedMotion ? 'transition-none' : '',
          scrolled || isHovered || mobileMenuOpen
            ? 'bg-glass backdrop-blur-xl shadow-2xl'
            : 'bg-transparent backdrop-blur-0'
        )}
      >
        <div className="relative z-[101] w-full h-16 flex items-center justify-between px-4 md:px-6 lg:px-8 overflow-visible">
          {/* Logo：固定槽位，强调态不挤压导航 */}
          <div className="flex items-center flex-shrink-0">
            <BrandLogo emphasized={isHovered || scrolled} />
          </div>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 text-sm font-medium">
            <nav role="navigation" aria-label="主导航">
              <div className="flex items-center space-x-4 lg:space-x-6 text-sm font-medium">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  const hasChildren = link.children && link.children.length > 0;
                  const isHomeDropdown = link.href === '/home';
                  const isToolsDropdown = link.href === '/tools';

                  if (isHomeDropdown && hasChildren) {
                    return (
                      <div
                        key={link.href}
                        className="relative"
                        ref={homeDropdownRef}
                        onMouseEnter={homeDropdown.openMenu}
                        onMouseLeave={homeDropdown.scheduleClose}
                      >
                        <button
                          type="button"
                          className={cn(
                            'nav-link relative text-sm font-medium transition-colors flex items-center py-2 px-3 space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg overflow-hidden group',
                            pathname === link.href
                              ? "text-tech-cyan"
                              : "text-foreground/80 hover:text-tech-cyan"
                          )}
                          aria-expanded={homeDropdown.open}
                          aria-haspopup="true"
                          aria-controls="home-dropdown"
                        >
                          <IconComponent className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                          <span className="relative">
                            {link.label}
                            <span className="absolute bottom-0 left-0 h-0.5 bg-tech-cyan transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
                          </span>
                          <ChevronDown className={cn(
                            "h-3 w-3 ml-1 transition-transform duration-200",
                            homeDropdown.open && "rotate-180"
                          )} />
                        </button>

                        <DropdownMenu
                          isOpen={homeDropdown.open}
                          id="home-dropdown"
                          label="探索菜单"
                        >
                          <div className="px-3 py-2 border-b border-glass-border mb-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">探索</span>
                          </div>
                          {link.children?.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.href}
                                href={child.href as Route}
                                role="menuitem"
                                className={cn(
                                  'flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors hover:bg-glass',
                                  pathname === child.href
                                    ? "text-tech-cyan bg-tech-cyan/10"
                                    : "text-foreground/80 hover:text-tech-cyan"
                                )}
                                onClick={() => homeDropdown.setOpen(false)}
                              >
                                <ChildIcon className="h-4 w-4" />
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </DropdownMenu>
                      </div>
                    );
                  }

                  if (isToolsDropdown && hasChildren) {
                    return (
                      <div
                        key={link.href}
                        className="relative"
                        ref={toolsDropdownRef}
                        onMouseEnter={toolsDropdown.openMenu}
                        onMouseLeave={toolsDropdown.scheduleClose}
                      >
                        <button
                          type="button"
                          className={cn(
                            'nav-link relative text-sm font-medium transition-colors flex items-center py-2 px-3 space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg overflow-hidden group',
                            pathname === link.href
                              ? "text-tech-cyan"
                              : "text-foreground/80 hover:text-tech-cyan"
                          )}
                          aria-expanded={toolsDropdown.open}
                          aria-haspopup="true"
                          aria-controls="tools-dropdown"
                        >
                          <IconComponent className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                          <span className="relative">
                            {link.label}
                            <span className="absolute bottom-0 left-0 h-0.5 bg-tech-cyan transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
                          </span>
                          <ChevronDown className={cn(
                            "h-3 w-3 ml-1 transition-transform duration-200",
                            toolsDropdown.open && "rotate-180"
                          )} />
                        </button>

                        <DropdownMenu
                          isOpen={toolsDropdown.open}
                          id="tools-dropdown"
                          label="工具菜单"
                        >
                          <div className="px-3 py-2 border-b border-glass-border mb-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">工具</span>
                          </div>
                          {link.children?.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.href}
                                href={child.href as Route}
                                role="menuitem"
                                className={cn(
                                  'flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors hover:bg-glass',
                                  pathname === child.href
                                    ? "text-tech-cyan bg-tech-cyan/10"
                                    : "text-foreground/80 hover:text-tech-cyan"
                                )}
                                onClick={() => toolsDropdown.setOpen(false)}
                              >
                                <ChildIcon className="h-4 w-4" />
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </DropdownMenu>
                      </div>
                    );
                  }

                  /* 普通链接 */
                  return (
                    <div key={link.href}>
                      <Link
                        href={link.href as Route}
                        className={cn(
                          'nav-link relative text-sm font-medium transition-colors flex items-center py-2 px-3 space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg overflow-hidden group',
                          pathname === link.href
                            ? "text-tech-cyan"
                            : "text-foreground/80 hover:text-tech-cyan"
                        )}
                        aria-current={pathname === link.href ? "page" : undefined}
                      >
                        <IconComponent className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                        <span className="relative">
                          {link.label}
                          <span className="absolute bottom-0 left-0 h-0.5 bg-tech-cyan transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
                        </span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center space-x-2 md:space-x-4 text-foreground">
            {/* 搜索按钮 */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-tech-cyan hover:bg-tech-cyan/10 transition-colors duration-300"
                onClick={focusSearch}
                aria-label="搜索 (Cmd/Ctrl + K)"
              >
                <Search className="h-4 w-4" />
                <kbd className="hidden lg:inline-block ml-2 px-2 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded border border-border">
                  ⌘K
                </kbd>
              </Button>
            </div>

            {/* 主题切换 */}
            <div className="flex items-center space-x-2 text-foreground">
              <RopeThemeToggler ropeLength={120} className="hidden md:flex" />
              <RopeThemeToggler ropeLength={80} className="flex md:hidden" />
            </div>

            {/* 用户菜单 */}
            <div className="flex items-center space-x-2 text-foreground">
              <UserProfileMenu mounted={mounted} />
            </div>

            {/* 移动端菜单按钮（纯 CSS 过渡） */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden flex items-center justify-center p-2 hover:bg-tech-cyan/10 transition-colors duration-300"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileMenuOpen}
            >
              <div className="relative w-5 h-5">
                <X className={cn(
                  "h-5 w-5 absolute inset-0 transition-transform duration-200",
                  mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                )} />
                <Menu className={cn(
                  "h-5 w-5 absolute inset-0 transition-transform duration-200",
                  mobileMenuOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
                )} />
              </div>
            </Button>
          </div>
        </div>

        {/* 移动端菜单：独立绝对定位层，只动 transform/opacity（面板下沉淡入） */}
        <div
          className={cn(
            "md:hidden absolute top-16 left-0 right-0 bg-glass backdrop-blur-xl border-b border-glass-border overflow-y-auto",
            "transition-transform duration-300 ease-out origin-top",
            reducedMotion ? 'transition-none' : '',
            mobileMenuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-2 pointer-events-none"
          )}
        >
          <nav role="navigation" aria-label="移动端导航" className="py-4 px-4 space-y-2">
            {navLinks.map((link, index) => {
              const IconComponent = link.icon;
              const hasChildren = link.children && link.children.length > 0;

              return (
                /* 菜单项入场 stagger：每项 y:8→0 + opacity，间隔 40ms（纯 transform/opacity） */
                <div
                  key={link.href}
                  className={cn(
                    'transition-transform duration-300 ease-out',
                    reducedMotion ? 'transition-none' : '',
                    mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  )}
                  style={{
                    transitionDelay: mobileMenuOpen && !reducedMotion ? `${index * 40}ms` : '0ms'
                  }}
                >
                  <Link
                    href={link.href as Route}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      pathname === link.href
                        ? "bg-tech-cyan/20 text-tech-cyan"
                        : "text-foreground/80 hover:bg-glass hover:text-tech-cyan"
                    )}
                    aria-current={pathname === link.href ? "page" : undefined}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-base font-medium">{link.label}</span>
                  </Link>

                  {hasChildren && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-glass-border pl-4">
                      {link.children?.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            href={child.href as Route}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors text-sm',
                              pathname === child.href
                                ? "text-tech-cyan bg-tech-cyan/10"
                                : "text-foreground/60 hover:text-tech-cyan hover:bg-glass"
                            )}
                          >
                            <ChildIcon className="h-4 w-4" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
}
