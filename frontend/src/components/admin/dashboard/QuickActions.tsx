'use client';

import { motion } from '@/lib/framer-motion';
import Link from 'next/link';
import { FileText, Folder, Tag, Users, BarChart2 } from 'lucide-react';
import GlassCardAdmin from '@/components/ui/GlassCardAdmin';
import { cn } from '@/lib/utils';

interface QuickAction {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const actions: QuickAction[] = [
  { href: '/admin/articles/new', icon: FileText, title: '写文章', description: '创建新文章' },
  { href: '/admin/categories', icon: Folder, title: '管理分类', description: '组织文章结构' },
  { href: '/admin/tags', icon: Tag, title: '管理标签', description: '添加关键词' },
  { href: '/admin/users', icon: Users, title: '管理用户', description: '用户权限控制' },
];

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
    >
      <GlassCardAdmin className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-tech-purple/30 to-tech-pink/30">
            <BarChart2 className="w-5 h-5 text-cat-2" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">快速操作</h2>
            <p className="text-sm text-foreground/60">常用的管理功能</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <QuickActionCard key={action.href} {...action} delay={0.8 + index * 0.1} />
          ))}
        </div>
      </GlassCardAdmin>
    </motion.div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  delay,
}: QuickAction & { delay: number }) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/50 hover:border-tech-cyan/60 hover:shadow-md p-4',
        'transition-colors duration-300 group bg-glass/10 hover:bg-glass/20 backdrop-blur-lg cursor-pointer'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -2 }}
    >
      <Link href={href as React.ComponentProps<typeof Link>['href']}>
        <div className="flex flex-col items-center text-center">
          <div className="p-2 rounded-lg bg-gradient-to-br from-foreground/10 to-foreground/5 transition-colors duration-300 group-hover:from-tech-cyan/20 group-hover:to-tech-sky/20">
            <Icon className="w-6 h-6 text-foreground/50 group-hover:text-tech-cyan transition-colors" />
          </div>
          <h3 className="text-sm font-medium text-foreground mt-2 group-hover:text-tech-cyan transition-colors">
            {title}
          </h3>
          <p className="text-xs text-foreground/50 mt-1 group-hover:text-foreground/70 transition-colors">
            {description}
          </p>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 -translate-x-full group-hover:translate-x-full" />
      </Link>
    </motion.div>
  );
}
