'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { Github, Mail, Rss } from 'lucide-react';
import { FadeIn } from '@/components/motion';

/** 中间导航区链接：与全站主导航对齐 */
const NAV_LINKS: { href: Route; label: string }[] = [
  { href: '/articles', label: '文章' },
  { href: '/albums', label: '相册' },
  { href: '/videos', label: '视频' },
  { href: '/music', label: '音乐' },
  { href: '/about', label: '关于' },
];

/** 右侧社媒/订阅区：href 站内用 Link 语义外的纯 a（feed.xml 为路由处理器，避免预取） */
const SOCIAL_LINKS: {
  href: string;
  label: string;
  icon: typeof Github;
  external?: boolean;
}[] = [
  {
    href: 'https://github.com/wxj-1019',
    label: 'GitHub',
    icon: Github,
    external: true,
  },
  { href: 'mailto:contact@example.com', label: '邮箱', icon: Mail },
  { href: '/feed.xml', label: 'RSS 订阅', icon: Rss },
];

/**
 * 站点页脚：渐变引线 + 单行紧凑布局（品牌 / 横排导航 / 社媒订阅）+ 细版权行。
 * 移动端垂直堆叠居中，整体高度约为原三栏布局的一半。
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  /** 对话页是应用式全屏布局，不渲染 Footer（占地过大且无意义） */
  if (pathname?.startsWith('/chat') || pathname?.startsWith('/ai/chat')) {
    return null;
  }

  return (
    <footer className="relative z-10 bg-glass/30 backdrop-blur-xl border-t border-glass-border">
      {/* 顶部渐变引线：呼应分幕「幕标」引线 */}
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden
      />

      <FadeIn>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            {/* 品牌区：名称 + 一句话，同行排列 */}
            <div className="flex items-baseline gap-3">
              <p className="text-sm font-bold text-foreground">我的优秀博客</p>
              <p className="hidden sm:block text-xs text-muted-foreground">
                深海 × 电影 —— 记录技术与生活
              </p>
            </div>

            {/* 导航区：横排链接 */}
            <nav aria-label="页脚导航">
              <ul className="flex items-center gap-5">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* 社媒/订阅区 */}
            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon, external }) => (
                <a
                  key={href}
                  href={href}
                  aria-label={label}
                  {...(external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 border border-border/60 text-muted-foreground transition-colors hover:text-primary hover:border-primary/40"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* 底部版权行：单行紧凑 */}
          <div className="mt-4 border-t border-border/40 pt-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 text-center">
            <p className="text-xs text-muted-foreground">
              © {currentYear} 我的优秀博客. 保留所有权利。
            </p>
            <p className="text-xs text-muted-foreground/70">
              Powered by Next.js &amp; FastAPI
            </p>
          </div>
        </div>
      </FadeIn>
    </footer>
  );
}
