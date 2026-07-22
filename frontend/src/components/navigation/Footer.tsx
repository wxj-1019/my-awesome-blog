'use client';

import Link from 'next/link';
import type { Route } from 'next';
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
 * 站点页脚：渐变引线 + 三栏（品牌 / 导航 / 社媒订阅）+ 版权行。
 * 「深海 × 电影」叙事收尾：引线与幕标引线同源，玻璃拟态承托内容。
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-glass/30 backdrop-blur-xl border-t border-glass-border">
      {/* 顶部渐变引线：呼应分幕「幕标」引线 */}
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden
      />

      <FadeIn>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* 左：品牌区 */}
            <div>
              <p className="text-lg font-bold text-foreground">我的优秀博客</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                深海 × 电影 —— 在光影与深流之间，记录技术与生活。
              </p>
            </div>

            {/* 中：导航区 */}
            <nav aria-label="页脚导航" className="md:justify-self-center">
              <p className="text-sm font-semibold text-foreground mb-3">导航</p>
              <ul className="space-y-2">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* 右：社媒/订阅区 */}
            <div className="md:justify-self-end">
              <p className="text-sm font-semibold text-foreground mb-3">关注与订阅</p>
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map(({ href, label, icon: Icon, external }) => (
                  <a
                    key={href}
                    href={href}
                    aria-label={label}
                    {...(external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40 border border-border/60 text-muted-foreground transition-colors hover:text-primary hover:border-primary/40"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* 底部版权行 */}
          <div className="mt-8 border-t border-border/40 pt-6 flex flex-col items-center gap-1 text-center">
            <p className="text-sm text-muted-foreground">
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
