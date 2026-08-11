import { render, screen } from '@testing-library/react';
import RelatedArticleRail from '@/components/articles/RelatedArticleRail';
import type { RelatedArticle } from '@/types';

const articles: RelatedArticle[] = Array.from({ length: 6 }, (_, index) => ({
  id: `article-${index + 1}`,
  title: `相关文章 ${index + 1}`,
  excerpt: `摘要 ${index + 1}`,
  published_at: `2026-08-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
  category: { name: `分类 ${index + 1}` },
  view_count: (index + 1) * 100,
}));

describe('RelatedArticleRail', () => {
  it('没有相关文章时不渲染内容', () => {
    const { container } = render(<RelatedArticleRail articles={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('最多展示五篇文章并提供全部文章入口', () => {
    render(<RelatedArticleRail articles={articles} />);

    const articleLinks = articles
      .slice(0, 5)
      .map(article =>
        screen.getByRole('link', { name: new RegExp(article.title) })
      );

    expect(articleLinks).toHaveLength(5);
    articleLinks.forEach((link, index) => {
      expect(link).toHaveAttribute('href', `/articles/${articles[index].id}`);
    });
    expect(
      screen.queryByRole('link', { name: /相关文章 6/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看全部文章' })).toHaveAttribute(
      'href',
      '/articles'
    );
  });

  it('保留标题、分类和阅读数语义', () => {
    render(<RelatedArticleRail articles={[articles[0]]} />);

    expect(
      screen.getByRole('link', { name: /相关文章 1/ })
    ).toBeInTheDocument();
    expect(screen.getByText('分类 1')).toBeInTheDocument();
    expect(screen.getByText('100 阅读')).toBeInTheDocument();
  });
});
