import type { Metadata } from 'next';
import ArticlesPageClient from './articles-content';

export const metadata: Metadata = {
  title: '文章列表 - My Awesome Blog',
  description: '浏览博客全部文章，按分类、标签筛选，发现关于 Web 开发、设计与技术的优质内容。',
};

export default function ArticlesPage() {
  return <ArticlesPageClient />;
}
