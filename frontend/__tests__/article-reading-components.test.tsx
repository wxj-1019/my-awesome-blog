import { fireEvent, render, screen } from '@testing-library/react';
import ArticleAuthorPanel from '@/components/articles/ArticleAuthorPanel';
import ArticleReadingMetaBar from '@/components/articles/ArticleReadingMetaBar';
import RelatedArticleRail from '@/components/articles/RelatedArticleRail';
import type { Article, RelatedArticle } from '@/types';

type ReadingMetaArticle = Pick<
  Article,
  'tags' | 'likes_count' | 'comments_count' | 'shares_count' | 'view_count'
>;

const article: ReadingMetaArticle & { author: Article['author'] } = {
  tags: [
    { id: 'tag-1', name: 'AI', slug: 'ai' },
    { id: 'tag-2', name: '前端', slug: 'frontend' },
  ],
  likes_count: 12,
  comments_count: 3,
  shares_count: 5,
  view_count: 420,
  author: {
    id: 'author-1',
    username: '作者甲',
    email: 'author@example.com',
    bio: '专注长文与技术写作',
    reputation: 88,
    followers_count: 27,
  },
};

const related: RelatedArticle[] = Array.from({ length: 6 }, (_, index) => ({
  id: `related-${index}`,
  title: `相关文章 ${index + 1}`,
  excerpt: '摘要',
  published_at: '2026-08-11T00:00:00Z',
  category: { name: '技术' },
  view_count: 100 + index,
}));

describe('文章阅读结束区组件', () => {
  it('数据带集中展示标签与四项阅读数据', () => {
    render(<ArticleReadingMetaBar article={article} />);

    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByLabelText('点赞数：12')).toBeInTheDocument();
    expect(screen.getByLabelText('评论数：3')).toBeInTheDocument();
    expect(screen.getByLabelText('分享数：5')).toBeInTheDocument();
    expect(screen.getByLabelText('阅读量：420')).toBeInTheDocument();
  });

  it('作者面板展示作者信息并触发关注', () => {
    const onFollow = jest.fn();
    render(
      <ArticleAuthorPanel
        author={article.author}
        isFollowing={false}
        onFollow={onFollow}
      />
    );

    expect(screen.getByText('专注长文与技术写作')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '关注作者甲' }));
    expect(onFollow).toHaveBeenCalledTimes(1);
  });

  it('相关文章最多展示五条并提供查看全部入口', () => {
    render(<RelatedArticleRail articles={related} />);

    expect(screen.getAllByRole('link', { name: /相关文章/ })).toHaveLength(5);
    expect(screen.getByRole('link', { name: '查看全部文章' })).toHaveAttribute(
      'href',
      '/articles'
    );
    expect(screen.queryByText('相关文章 6')).not.toBeInTheDocument();
  });
});
