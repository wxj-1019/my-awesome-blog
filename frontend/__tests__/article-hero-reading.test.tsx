import React from 'react';
import { render } from '@testing-library/react';
import ArticleHeroStage from '@/components/articles/ArticleHeroStage';

const article = {
  id: 'a1',
  title: '测试文章标题',
  content: '',
  excerpt: '',
  is_published: true,
  view_count: 100,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  published_at: '2026-01-01T00:00:00Z',
  author_id: 'u1',
  read_time: 5,
  likes_count: 10,
  comments_count: 2,
  shares_count: 1,
  author: { id: 'u1', username: '作者', email: 'a@b.com' },
  tags: [],
};

// mock framer-motion
jest.mock('@/lib/framer-motion', () => ({
  motion: {
    h1: ({ children, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 {...p}>{children}</h1>
    ),
  },
  useReducedMotion: () => true,
}));

jest.mock('@/hooks/useScrollProgress', () => ({
  useScrollProgress: () => 0,
}));

jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

describe('ArticleHeroStage · 阅读对齐', () => {
  it('contentClassName 应用于标题元信息容器', () => {
    const { container } = render(
      <ArticleHeroStage
        article={article}
        isLiked={false}
        isBookmarked={false}
        onLike={() => {}}
        onBookmark={() => {}}
        formatDate={() => '2026年1月1日'}
        textClass="text-foreground"
        contentClassName="max-w-[50rem] px-4 md:px-6"
      />
    );
    const wrapper = container.querySelector('.max-w-\\[50rem\\]');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('px-4', 'md:px-6');
  });
});
