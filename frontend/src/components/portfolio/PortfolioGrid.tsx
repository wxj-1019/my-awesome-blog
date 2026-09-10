import PortfolioCard from '@/components/portfolio/PortfolioCard';
import EmptyState from '@/components/ui/EmptyState';
import type { PortfolioItem } from '@/lib/api/portfolio';

/** 精选优先 → sort_order 升序 → created_at 降序（返回新数组，不改原数组） */
export function sortPortfolioItems(items: PortfolioItem[]): PortfolioItem[] {
  return [...items].sort((a, b) => {
    const featuredDiff = Number(b.is_featured ?? false) - Number(a.is_featured ?? false);
    if (featuredDiff !== 0) {return featuredDiff;}
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (orderDiff !== 0) {return orderDiff;}
    return b.created_at.localeCompare(a.created_at);
  });
}

/** 作品网格（Server Component）：响应式三列，空数据走 EmptyState。 */
export default function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="暂无作品"
        description="作品正在整理中，敬请期待"
        size="md"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sortPortfolioItems(items).map((item) => (
        <PortfolioCard key={item.id} item={item} />
      ))}
    </div>
  );
}
