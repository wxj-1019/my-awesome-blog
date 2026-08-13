'use client';

import {
  Code2,
  Layout,
  Zap,
  TrendingUp,
  MessageSquare,
  Loader2,
  User,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { friendLinkService, FriendLink } from '@/services/friendLinkService';
import GlassCard from '@/components/ui/GlassCard';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import ScrollNarrative, { ScrollRevealLine } from '@/components/gsap/ScrollNarrative';

export default function AboutPageContent() {
  const [friendLinks, setFriendLinks] = useState<FriendLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);

  useEffect(() => {
    const loadFriendLinks = async () => {
      try {
        const links = await friendLinkService.getFriendLinks({ is_active: true });
        setFriendLinks(links);
      } catch (error) {
        console.error('Failed to load friend links:', error);
      } finally {
        setLoadingLinks(false);
      }
    };

    loadFriendLinks();
  }, []);

  const features = [
    {
      icon: Code2,
      title: '技术教程和指南',
      description: '深入学习各种编程技术和工具',
    },
    {
      icon: Layout,
      title: '现代Web开发最佳实践',
      description: '掌握最新的前端开发技巧和模式',
    },
    {
      icon: Zap,
      title: '设计系统和UI/UX见解',
      description: '提升用户体验和界面设计能力',
    },
    {
      icon: TrendingUp,
      title: '最新工具和框架评测',
      description: '了解行业趋势和技术发展',
    },
    {
      icon: MessageSquare,
      title: '行业趋势和观点',
      description: '获取行业洞察和专业见解',
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="关于我"
        description="欢迎来到我的个人博客！我热衷于技术、设计，并喜欢与社区分享知识。"
        icon={User}
        align="left"
        size="lg"
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* 分区层滚动叙事：容器视差 + 标题揭示线（GSAP 单一写入，reduced/移动端静态） */}
        <ScrollNarrative>
          <FadeIn>
            <GlassCard padding="lg">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                凭借多年的软件开发经验，我专注于为复杂问题创建优雅的解决方案。
                我的专业知识涵盖前后端技术，特别关注现代 JavaScript 框架和云架构。
              </p>
            </GlassCard>
          </FadeIn>
        </ScrollNarrative>

        <ScrollNarrative>
          <FadeIn delay={0.1}>
            <GlassCard padding="lg">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-4">
                在这里你会发现
              </h2>
              <ScrollRevealLine className="mb-4" />
              <p className="text-muted-foreground mb-6">这个博客涵盖广泛的主题，包括：</p>

            <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <StaggerItem
                    key={feature.title}
                    className="flex gap-4 p-4 rounded-lg bg-muted/40 border border-border/60 hover:bg-muted/60 hover:border-primary/30 transition-[colors,transform] duration-200 group"
                  >
                    <IconComponent className="w-6 h-6 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                    <div>
                      <h3 className="font-serif font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </GlassCard>
          </FadeIn>
        </ScrollNarrative>

        <ScrollNarrative>
          <FadeIn delay={0.15}>
            <GlassCard padding="lg">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-3">联系方式</h2>
              <ScrollRevealLine className="mb-3" />
              <p className="text-muted-foreground leading-relaxed">
                有问题或想要联系？欢迎通过
                <Link
                  href="/contact"
                  className="mx-1 text-primary underline-offset-2 hover:underline"
                >
                  联系页面
                </Link>
                与我取得联系，或在社交媒体上关注我。
              </p>
            </GlassCard>
          </FadeIn>
        </ScrollNarrative>

        {(loadingLinks || friendLinks.length > 0) && (
          <ScrollNarrative>
            <FadeIn delay={0.2}>
              <GlassCard padding="lg">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-6">友情链接</h2>
                <ScrollRevealLine className="mb-6 -mt-4" />
              {loadingLinks ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" aria-label="加载中" />
                </div>
              ) : (
                <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-4" itemCount={friendLinks.length}>
                  {friendLinks.map((link) => (
                    <StaggerItem key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-lg bg-muted/40 border border-border/60 hover:bg-muted/60 hover:border-primary/30 hover:scale-[1.01] transition-[colors,transform] duration-200 group"
                      >
                        {link.favicon ? (
                          <>
                            {/* 友链 favicon 来自外部任意域名，不可控，保留 <img> */}
                            <img
                              src={link.favicon}
                              alt=""
                              className="w-10 h-10 rounded-md group-hover:scale-110 transition-transform duration-200"
                            />
                          </>
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                            {link.name}
                          </h3>
                          {link.description ? (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {link.description}
                            </p>
                          ) : null}
                        </div>
                      </a>
                    </StaggerItem>
                  ))}
                </Stagger>
              )}
            </GlassCard>
            </FadeIn>
          </ScrollNarrative>
        )}
      </div>
    </PageShell>
  );
}
