'use client';
import CategoryNav from './CategoryNav';
import HotArticles from './HotArticles';
import MiniStats from './MiniStats';
import SidebarTagCloud from './SidebarTagCloud';
import FriendLinks from '@/components/home/FriendLinks';
import { memo, useMemo } from 'react';
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  article_count: number;
}
interface Tag {
  id: string;
  name: string;
  slug: string;
  article_count: number;
}
interface Article {
  id: string;
  title: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
}
interface FriendLink {
  id: string;
  name: string;
  url: string;
  favicon: string;
  description?: string;
}
interface ArticleSidebarProps {
  categories: Category[];
  tags: Tag[];
  articles: Article[];
  friendLinks?: FriendLink[];
  selectedCategory: string | null;
  selectedTag: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onTagSelect: (tagId: string | null) => void;
}
function ArticleSidebar({
  categories,
  tags,
  articles,
  friendLinks = [],
  selectedCategory,
  selectedTag,
  onCategorySelect,
  onTagSelect,
}: ArticleSidebarProps) {
  // 使用 useMemo 缓存统计数据
  const stats = useMemo(() => {
    const articleCount = articles.length;
    const totalViews = articles.reduce((sum, article) => sum + article.view_count, 0);
    const totalLikes = articles.reduce((sum, article) => sum + article.likes_count, 0);
    const totalComments = articles.reduce((sum, article) => sum + article.comments_count, 0);
    return {
      articleCount,
      totalViews,
      totalLikes,
      totalComments,
    };
  }, [articles]);
  return (
    <aside className="space-y-6">
      {/* 迷你统计 */}
      <MiniStats
        articleCount={stats.articleCount}
        totalViews={stats.totalViews}
        totalLikes={stats.totalLikes}
        totalComments={stats.totalComments}
      />
      {/* 分类导航 */}
      <CategoryNav
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={onCategorySelect}
      />
      {/* 热门标签 */}
      <SidebarTagCloud
        tags={tags}
        selectedTag={selectedTag}
        onTagSelect={onTagSelect}
      />
      {/* 热门文章 */}
      <HotArticles articles={articles} />
      {/* 友情链接 */}
      {friendLinks && friendLinks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-serif font-bold text-foreground">友情链接</h3>
          </div>
          <FriendLinks links={friendLinks} />
        </div>
      )}
    </aside>
  );
}
export default memo(ArticleSidebar);