import type { Metadata } from 'next';
import PageActHeader from '@/components/layout/PageActHeader';
import PortfolioGrid from '@/components/portfolio/PortfolioGrid';
import { getPortfolioItems } from '@/lib/api/portfolio';
import type { PortfolioItem } from '@/lib/api/portfolio';

export const metadata: Metadata = {
  title: '作品集 - My Awesome Blog',
  description: '精选项目与作品展示：全栈应用、开源工具与技术实践。',
};

/** 作品数据量小且更新低频，服务端每次请求拉取（与公开接口契约一致） */
async function loadItems(): Promise<PortfolioItem[]> {
  try {
    return await getPortfolioItems({ limit: 100 });
  } catch {
    // 后端不可达时渲染空态而非整页 500（空态由 PortfolioGrid 内置 EmptyState 承接）
    return [];
  }
}

export default async function PortfolioPage() {
  const items = await loadItems();

  return (
    // pt-24：为 fixed Navbar 预留顶部间距，与 albums 页保持一致
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
      <PageActHeader
        kicker="作品集 · PORTFOLIO"
        // kickerFont 选 font-creative：语义贴合「作品集/创意实践」（font-gallery 已由相册页占用）
        kickerFont="font-creative"
        title="精选作品"
        description="项目与实践 · 从想法到上线"
        className="mb-10"
      />
      <PortfolioGrid items={items} />
    </main>
  );
}
