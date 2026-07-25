'use client';
import Link from 'next/link';
import { Folder, FolderOpen } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { memo } from 'react';
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  article_count: number;
}
interface CategoryNavProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}
function CategoryNav({ categories, selectedCategory, onCategorySelect }: CategoryNavProps) {
  const { themedClasses } = useThemedClasses();
  const mutedTextClass = themedClasses.mutedTextClass;
  if (!categories || categories.length === 0) {
    return null;
  }
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Folder className="h-5 w-5 text-tech-cyan" />
        <h3 className="text-lg font-bold">分类导航</h3>
      </div>
      <div className="space-y-1">
        <button
          onClick={() => onCategorySelect(null)}
          className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors duration-200 ${
            !selectedCategory
              ? 'bg-tech-cyan/20 text-tech-cyan font-medium'
              : 'hover:bg-muted/40 text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            全部分类
          </span>
          <span className={`text-xs ${mutedTextClass}`}>
            {categories.reduce((sum, cat) => sum + cat.article_count, 0)}
          </span>
        </button>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={{
              pathname: '/articles',
              query: { category: category.id }
            }}
            className={`block w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors duration-200 ${
              selectedCategory === category.id
                ? 'bg-tech-cyan/20 text-tech-cyan font-medium'
                : 'hover:bg-muted/40 text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              {category.name}
            </span>
            <span className={`text-xs ${mutedTextClass}`}>
              {category.article_count}
            </span>
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}
export default memo(CategoryNav);
