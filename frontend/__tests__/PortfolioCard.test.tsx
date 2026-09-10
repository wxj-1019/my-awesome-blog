import { render, screen } from '@testing-library/react';
import PortfolioCard from '@/components/portfolio/PortfolioCard';
import type { PortfolioItem } from '@/lib/api/portfolio';

const base: PortfolioItem = {
  id: 'p1',
  title: '个人博客',
  slug: 'blog',
  description: '全栈博客平台',
  cover_image: 'https://example.com/cover.jpg',
  demo_url: 'https://demo.example.com',
  github_url: 'https://github.com/x/blog',
  technologies: ['Next.js', 'FastAPI', 'PostgreSQL'],
  start_date: '2025-01-01',
  end_date: null,
  status: 'in_progress',
  is_featured: true,
  sort_order: 1,
  created_at: '2026-01-01T00:00:00Z',
};

describe('PortfolioCard · 作品卡片', () => {
  it('渲染完整字段：标题/描述/技术栈/徽章/链接/日期', () => {
    render(<PortfolioCard item={base} />);

    expect(screen.getByText('个人博客')).toBeInTheDocument();
    expect(screen.getByText('全栈博客平台')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('精选')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /在线预览/ })).toHaveAttribute('href', 'https://demo.example.com');
    expect(screen.getByRole('link', { name: /源码/ })).toHaveAttribute('href', 'https://github.com/x/blog');
    expect(screen.getByText(/2025-01-01/)).toBeInTheDocument();
    expect(screen.getByText(/至今/)).toBeInTheDocument();
  });

  it('无封面时渲染占位，无链接时不渲染链接区', () => {
    render(
      <PortfolioCard
        item={{ ...base, cover_image: null, demo_url: null, github_url: null, is_featured: false, status: 'completed' }}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /在线预览/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /源码/ })).not.toBeInTheDocument();
    expect(screen.queryByText('精选')).not.toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('技术栈超过 5 个时显示 +N', () => {
    render(
      <PortfolioCard
        item={{ ...base, technologies: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }}
      />
    );

    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
