'use client';
import { Tag } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { memo } from 'react';
interface Tag {
  id: string;
  name: string;
  slug: string;
  article_count: number;
}
interface SidebarTagCloudProps {
  tags: Tag[];
  selectedTag: string | null;
  onTagSelect: (tagId: string | null) => void;
}
// 根据标签数量计算大小
function getSizeClass(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio > 0.7) {return 'text-sm px-3 py-1.5';}
  if (ratio > 0.4) {return 'text-sm px-2.5 py-1';}
  return 'text-xs px-2 py-1';
}
// 根据标签数量计算颜色
function getColorClass(count: number, maxCount: number, selected: boolean): string {
  if (selected) {return 'bg-tech-cyan text-white border-tech-cyan';}
  const ratio = count / maxCount;
  if (ratio > 0.7) {return 'bg-tech-cyan/10 text-tech-cyan border-tech-cyan/30';}
  if (ratio > 0.4) {return 'bg-glass/20 text-foreground/80 border-glass-border';}
  return 'bg-glass/10 text-foreground/60 border-glass-border/50';
}
function SidebarTagCloud({
  tags,
  selectedTag,
  onTagSelect,
}: SidebarTagCloudProps) {
  const { themedClasses } = useThemedClasses();
  if (!tags || tags.length === 0) {
    return null;
  }
  // 找到最大数量以计算相对大小
  const maxCount = Math.max(...tags.map(tag => tag.article_count));
  // 取前12个标签显示在侧边栏
  const displayedTags = tags.slice(0, 12);
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <Tag className="h-5 w-5 text-tech-cyan" />
        <h3 className="text-lg font-serif font-bold">热门标签</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* 显示全部标签按钮 */}
        <button
          onClick={() => onTagSelect(null)}
          className={`rounded-full border transition-transform duration-200 hover:scale-105 ${
            !selectedTag
              ? 'bg-tech-cyan text-white border-tech-cyan'
              : getColorClass(maxCount, maxCount, false)
          }`}
        >
          全部
        </button>
        {displayedTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => onTagSelect(tag.id)}
            className={`rounded-full border transition-transform duration-200 hover:scale-105 ${
              selectedTag === tag.id
                ? 'bg-tech-cyan text-white border-tech-cyan'
                : getColorClass(tag.article_count, maxCount, false)
            } ${getSizeClass(tag.article_count, maxCount)}`}
          >
            {tag.name}
            <span className="ml-1 text-xs opacity-60">
              ({tag.article_count})
            </span>
          </button>
        ))}
      </div>
      {tags.length > 12 && (
        <div className="mt-3 text-center">
          <span className={`text-xs ${themedClasses.mutedTextClass}/60`}>
            还有 {tags.length - 12} 个标签...
          </span>
        </div>
      )}
    </GlassCard>
  );
}
export default memo(SidebarTagCloud);