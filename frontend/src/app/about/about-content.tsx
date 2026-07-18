'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Code2, Layout, Zap, TrendingUp, MessageSquare, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { friendLinkService, FriendLink } from '@/services/friendLinkService';

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
      description: '深入学习各种编程技术和工具'
    },
    {
      icon: Layout,
      title: '现代Web开发最佳实践',
      description: '掌握最新的前端开发技巧和模式'
    },
    {
      icon: Zap,
      title: '设计系统和UI/UX见解',
      description: '提升用户体验和界面设计能力'
    },
    {
      icon: TrendingUp,
      title: '最新工具和框架评测',
      description: '了解行业趋势和技术发展'
    },
    {
      icon: MessageSquare,
      title: '行业趋势和观点',
      description: '获取行业洞察和专业见解'
    }
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 pt-24 pb-12 md:pb-16 lg:pb-20">
        <Card className="max-w-4xl mx-auto mb-12 overflow-hidden border-border shadow-lg transition-all duration-300 hover:shadow-xl">
          <CardContent className="p-8 md:p-12">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              关于我
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              欢迎来到我的个人博客！我热衷于技术、设计，并喜欢与社区分享知识。
            </p>
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="border-border shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-8 md:p-12">
              <p className="text-lg text-muted-foreground leading-relaxed">
                凭借多年的软件开发经验，我专注于为复杂问题创建优雅的解决方案。
                我的专业知识涵盖前后端技术，特别关注现代JavaScript框架和云架构。
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                在这里你会发现
              </h2>
              <p className="text-muted-foreground mb-8">这个博客涵盖广泛的主题，包括：</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature) => {
                  const IconComponent = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
                    >
                      <IconComponent className="w-6 h-6 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">联系方式</h2>
              <p className="text-muted-foreground leading-relaxed">
                有问题或想要联系？欢迎通过联系页面与我取得联系，或在社交媒体上关注我。
              </p>
            </CardContent>
          </Card>

          {friendLinks.length > 0 && (
            <Card className="border-border shadow-lg transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-8 md:p-12">
                <h2 className="text-2xl font-bold text-foreground mb-6">友情链接</h2>
                {loadingLinks ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 text-tech-cyan animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {friendLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted hover:scale-[1.02] transition-all duration-200 cursor-pointer group border border-border"
                      >
                        {link.favicon && (
                          <>
                            {/* 友链 favicon 来自外部任意域名，不可控，保留 <img> */}
                            <img
                              src={link.favicon}
                              alt={link.name}
                              className="w-10 h-10 rounded-md group-hover:scale-110 transition-transform duration-200"
                            />
                          </>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1 truncate group-hover:text-tech-cyan transition-colors">
                            {link.name}
                          </h3>
                          {link.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {link.description}
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
