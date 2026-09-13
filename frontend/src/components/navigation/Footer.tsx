'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Github, Loader2, Mail, Rss, Send } from 'lucide-react';
import { useState } from 'react';
import { FadeIn } from '@/components/motion';
import { createSubscription } from '@/lib/api/subscriptions';

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

/** 简单邮箱格式校验（与后端校验互补，拦截明显非法输入） */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 订阅状态反馈：成功 / 错误文案，null 为待输入 */
interface SubscribeStatus {
  type: 'success' | 'error';
  message: string;
}

/**
 * 站点页脚：渐变引线 + 单行紧凑布局（品牌 / 横排导航 / 社媒订阅）+ 细版权行。
 * 移动端垂直堆叠居中，整体高度约为原三栏布局的一半。
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [status, setStatus] = useState<SubscribeStatus | null>(null);

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setStatus({ type: 'error', message: '请输入有效的邮箱地址' });
      return;
    }
    setSubscribing(true);
    setStatus(null);
    try {
      // 后端对已订阅邮箱静默返回成功（防邮件枚举），前端统一按成功提示
      await createSubscription({ email: trimmed });
      setStatus({ type: 'success', message: '订阅成功，请查收验证邮件' });
      setEmail('');
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : '订阅失败，请稍后重试',
      });
    } finally {
      setSubscribing(false);
    }
  };

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

            {/* 社媒/订阅区：邮件订阅表单 + 图标组，纵向堆叠 */}
            <div className="flex flex-col items-center gap-2 md:items-end">
              <form
                onSubmit={handleSubscribe}
                className="flex w-full max-w-xs items-center gap-2"
                noValidate
              >
                <label htmlFor="footer-subscribe-email" className="sr-only">
                  订阅邮箱
                </label>
                <input
                  id="footer-subscribe-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入邮箱，订阅新文章"
                  aria-describedby="footer-subscribe-status"
                  disabled={subscribing}
                  className="h-8 min-w-0 flex-1 rounded-lg bg-muted/40 border border-border/60 px-2.5 text-xs text-foreground placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/40 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  aria-label="订阅"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40 border border-border/60 text-muted-foreground transition-colors hover:text-primary hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {subscribing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-3.5 w-3.5" aria-hidden />
                  )}
                </button>
              </form>

              {/* 状态反馈行：固定占位高度，避免文案出现时布局跳动 */}
              <p
                id="footer-subscribe-status"
                role="status"
                aria-live="polite"
                className={`min-h-4 text-xs ${
                  status?.type === 'success' ? 'text-success' : 'text-error'
                }`}
              >
                {status?.message ?? ''}
              </p>

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
