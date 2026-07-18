'use client';

import { motion } from '@/lib/framer-motion';
import Link from 'next/link';
import { Clock, FileText, Eye, ArrowUpRight } from 'lucide-react';
import GlassCardAdmin from '@/components/ui/GlassCardAdmin';

interface RecentArticle {
  id: string;
  title: string;
  created_at: string;
  view_count: number;
  is_published: boolean;
}

interface RecentArticlesProps {
  articles: RecentArticle[];
}

export default function RecentArticles({ articles }: RecentArticlesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
    >
      <GlassCardAdmin className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30">
              <Clock className="w-5 h-5 text-tech-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">最近文章</h2>
              <p className="text-sm text-foreground/60">最新发布的文章内容</p>
            </div>
          </div>
          <Link
            href="/admin/articles"
            className="text-sm text-tech-cyan hover:text-tech-cyan/80 flex items-center gap-1 transition-colors"
          >
            查看全部
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {articles.length > 0 ? (
            articles.map((article, index) => (
              <motion.div
                key={article.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-glass/20 transition-all duration-300 group cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                whileHover={{ x: 4 }}
              >
                <div className={`p-2 rounded-lg ${article.is_published ? 'bg-green-500/20' : 'bg-foreground/10'}`}>
                  <FileText className={`w-4 h-4 ${article.is_published ? 'text-green-500' : 'text-foreground/50'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-tech-cyan transition-colors text-foreground">
                    {article.title}
                  </p>
                  <p className="text-xs text-foreground/50 mt-1">
                    {new Date(article.created_at).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-foreground/50">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">{article.view_count || 0}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-tech-cyan/20 to-tech-sky/20 flex items-center justify-center"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FileText className="w-8 h-8 text-tech-cyan/50" />
              </motion.div>
              <p className="text-foreground/70 font-medium mb-2">暂无文章</p>
              <p className="text-foreground/50 text-sm mb-4">开始创建您的第一篇博客文章</p>
              <motion.a
                href="/admin/articles/new"
                className="inline-flex items-center gap-2 text-sm text-tech-cyan hover:text-tech-cyan/80 transition-colors group"
                whileHover={{ x: 4 }}
              >
                创建第一篇文章
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </motion.a>
            </motion.div>
          )}
        </div>
      </GlassCardAdmin>
    </motion.div>
  );
}
