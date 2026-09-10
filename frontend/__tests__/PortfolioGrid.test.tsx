import { render, screen } from '@testing-library/react';
import PortfolioGrid, { sortPortfolioItems } from '@/components/portfolio/PortfolioGrid';
import type { PortfolioItem } from '@/lib/api/portfolio';

const item = (overrides: Partial<PortfolioItem>): PortfolioItem => ({
  id: Math.random().toString(36).slice(2),
  title: '作品',
  slug: 'work',
  description: null,
  cover_image: null,
  demo_url: null,
  github_url: null,
  technologies: null,
  start_date: null,
  end_date: null,
  status: 'completed',
  is_featured: false,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('sortPortfolioItems · 排序', () => {
  it('精选优先，其次 sort_order 升序，再按 created_at 降序', () => {
    const a = item({ title: 'A', is_featured: false, sort_order: 1, created_at: '2026-01-02T00:00:00Z' });
    const b = item({ title: 'B', is_featured: true, sort_order: 5, created_at: '2026-01-01T00:00:00Z' });
    const c = item({ title: 'C', is_featured: false, sort_order: 1, created_at: '2026-01-03T00:00:00Z' });

    const sorted = sortPortfolioItems([a, b, c]);

    expect(sorted.map((i) => i.title)).toEqual(['B', 'C', 'A']);
  });
});

describe('PortfolioGrid · 网格', () => {
  it('空数组渲染空态', () => {
    render(<PortfolioGrid items={[]} />);

    expect(screen.getByText('暂无作品')).toBeInTheDocument();
  });

  it('渲染作品卡片', () => {
    render(<PortfolioGrid items={[item({ title: '我的博客' })]} />);

    expect(screen.getByText('我的博客')).toBeInTheDocument();
  });
});
