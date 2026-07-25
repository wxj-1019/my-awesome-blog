'use client';

import Link from 'next/link';
import type { Route } from 'next';
import {
  BookOpen,
  MessageSquare,
  User,
  ArrowUp,
  Anchor,
  ArrowRight,
} from 'lucide-react';
import { FadeIn } from '@/components/motion';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { HOME_DURATION } from './homeMotion';

const routes: {
  href: Route;
  title: string;
  description: string;
  icon: typeof BookOpen;
}[] = [
  {
    href: '/articles',
    title: '文章',
    description: '回到展厅深处的篇章',
    icon: BookOpen,
  },
  {
    href: '/messages',
    title: '留言',
    description: '在岸边留下你的回声',
    icon: MessageSquare,
  },
  {
    href: '/about',
    title: '关于',
    description: '认识掌舵的人',
    icon: User,
  },
];

/**
 * 第四幕 · 靠岸：港口航标收束（无邮件订阅功能）。
 * 结语 + 主路径入口 + 回到顶部。
 */
export default function ShoreBeacon({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <section
      className={cn('relative py-10 sm:py-14', className)}
      aria-label="港口航标"
      data-testid="shore-beacon"
    >
      {/* 外层 Act 已提供 container 时，此处仅限宽，避免双重水平 gutter 过窄感 */}
      <div className="mx-auto max-w-4xl px-4 sm:px-0">
        <FadeIn direction="up" duration={HOME_DURATION.content}>
          <GlassCard
            padding="lg"
            className="relative overflow-hidden rounded-2xl text-center"
          >
            <div
              data-testid="shore-beacon-layer"
              className="pointer-events-none absolute inset-0"
              aria-hidden
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
              {/* 底部弱提亮条，不用圆形光斑 */}
              <div className="absolute inset-x-[18%] bottom-8 h-10 rounded-full bg-primary/8 blur-2xl" />
            </div>

            <div className="relative z-10">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Anchor className="h-7 w-7" aria-hidden />
              </div>
              <p className="text-[11px] sm:text-xs font-medium tracking-[0.28em] text-primary/90 mb-2">
                航标已亮
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                靠岸，下一段航程任选
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-8">
                潮水至此稍歇。只留下几处灯塔，方便你再次启航。
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left mb-8">
                {routes.map(({ href, title, description, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'group flex h-full flex-col rounded-xl border border-border/80',
                        'bg-background/40 p-4 transition-colors',
                        'hover:border-primary/40 hover:bg-primary/5',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                      )}
                    >
                      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <span className="font-semibold text-foreground mb-1 inline-flex items-center gap-1">
                        {title}
                        <ArrowRight
                          className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-transform group-hover:opacity-100 group-hover:translate-x-0 text-primary"
                          aria-hidden
                        />
                      </span>
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={scrollToTop}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border border-border',
                  'bg-glass/40 px-4 py-2 text-sm text-muted-foreground',
                  'hover:border-primary/40 hover:text-primary transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
              >
                <ArrowUp className="h-4 w-4" aria-hidden />
                回到海面（顶部）
              </button>
            </div>
          </GlassCard>
        </FadeIn>
      </div>
    </section>
  );
}
