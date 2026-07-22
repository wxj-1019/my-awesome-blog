'use client';

import { cn } from '@/lib/utils';
import { Mail, MessageSquare, Github, Twitter, Linkedin, HelpCircle, Clock, Globe } from 'lucide-react';

interface ContactSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function ContactSidebar({ activeSection, onSectionChange }: ContactSidebarProps) {
  const contactSections = [
    { id: 'all', label: '全部', icon: Globe },
    { id: 'contact', label: '联系方式', icon: Mail },
    { id: 'social', label: '社交媒体', icon: MessageSquare },
    { id: 'faq', label: '常见问题', icon: HelpCircle },
  ];

  const socialLinks = [
    { id: 'github', label: 'GitHub', icon: Github },
    { id: 'twitter', label: 'Twitter', icon: Twitter },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  ];

  return (
    <aside className="w-64 h-full hidden md:flex flex-col bg-card/50 backdrop-blur-2xl border-r border-glass-border pt-6 pb-4 px-4 flex-shrink-0">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="mb-8">
          <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            导航
          </h2>
          <nav className="space-y-1">
            {contactSections.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                  activeSection === item.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-foreground/70 hover:bg-foreground/5'
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-transform duration-200 group-active:scale-95",
                  activeSection === item.id ? "text-primary-foreground" : "text-foreground/50 group-hover:text-foreground"
                )} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            快速链接
          </h2>
          <nav className="space-y-1">
            {socialLinks.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                  activeSection === item.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-foreground/70 hover:bg-foreground/5 cursor-pointer'
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-transform duration-200 group-active:scale-95",
                  activeSection === item.id ? "text-primary-foreground" : "text-foreground/50 group-hover:text-foreground"
                )} />
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-glass-border">
        <div className="bg-gradient-to-br from-primary/10 to-tech-purple/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground/60">
              响应时间
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            24小时内
          </p>
          <p className="text-xs text-foreground/50 mt-1">
            工作日通常更快
          </p>
        </div>
      </div>
    </aside>
  );
}
