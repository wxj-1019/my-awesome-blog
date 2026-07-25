'use client';
import { Globe, Twitter, Github, Linkedin, Link as LinkIcon } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import EmptyState from '@/components/ui/EmptyState';
interface SocialLink {
  type: 'website' | 'twitter' | 'github' | 'linkedin';
  value: string;
}
interface SocialLinksCardProps {
  socialLinks: SocialLink[];
  isEditing?: boolean;
}
const socialConfig = {
  website: { icon: Globe, label: '个人网站', color: 'text-info' },
  twitter: { icon: Twitter, label: 'Twitter', color: 'text-tech-sky' },
  github: { icon: Github, label: 'GitHub', color: 'text-foreground' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-info' },
};
export default function SocialLinksCard({ socialLinks, isEditing = false }: SocialLinksCardProps) {
  const validLinks = socialLinks.filter(link => link.value);
  return (
    <GlassCard padding="lg" className="border-tech-cyan/20 hover:shadow-[0_0_30px_var(--shadow-tech-cyan)] transition-[colors,transform] duration-300 hover:-translate-y-1 animate-fade-in-up">
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
        <LinkIcon className="w-5 h-5 text-tech-cyan" />
        <span className="text-gradient-primary">社交链接</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {validLinks.map((link, index) => {
          const config = socialConfig[link.type];
          const Icon = config.icon;
          return (
            <a
              key={link.type}
              href={getLinkUrl(link.type, link.value)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-tech-cyan/10 to-tech-sky/10 hover:from-tech-cyan/20 hover:to-tech-sky/20 border border-tech-cyan/20 hover:border-tech-cyan/40 p-4 transition-[colors,transform] duration-300 hover:scale-105 hover:shadow-lg"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* 背景动画 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-tech-cyan/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <div className="relative flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-tech-cyan/10 ${config.color} transition-[colors,transform] duration-300 group-hover:scale-110 group-hover:bg-tech-cyan/20`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">{config.label}</div>
                  <div className="text-sm font-medium text-foreground truncate group-hover:text-tech-cyan transition-colors">
                    {formatLinkValue(link.type, link.value)}
                  </div>
                </div>
                {/* 悬浮箭头 */}
                <div className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-transform duration-300">
                  <LinkIcon className="w-4 h-4 text-tech-cyan" />
                </div>
              </div>
            </a>
          );
        })}
        {validLinks.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              size="sm"
              compact
              title={isEditing ? '添加社交链接' : '暂无社交链接'}
              description={
                isEditing
                  ? '添加社交链接以展示您的社交网络'
                  : '还没有公开的社交链接'
              }
            />
          </div>
        )}
      </div>
      {/* 底部装饰线 */}
      <div className="mt-6 pt-4 border-t border-tech-cyan/20">
        <div className="h-1 bg-gradient-to-r from-tech-cyan via-tech-sky to-transparent rounded-full animate-pulse" />
      </div>
    </GlassCard>
  );
}
function getLinkUrl(type: string, value: string): string {
  switch (type) {
    case 'twitter':
      return `https://twitter.com/${value.replace('@', '')}`;
    case 'github':
      return `https://github.com/${value}`;
    case 'linkedin':
      return `https://linkedin.com/in/${value}`;
    case 'website':
    default:
      return value.startsWith('http') ? value : `https://${value}`;
  }
}
function formatLinkValue(type: string, value: string): string {
  switch (type) {
    case 'twitter':
      return value.startsWith('@') ? value : `@${value}`;
    case 'website':
      return value.replace(/^https?:\/\//, '').replace(/\/$/, '');
    default:
      return value;
  }
}