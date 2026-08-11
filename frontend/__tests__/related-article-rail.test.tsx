import { render, screen, within } from '@testing-library/react';
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

  it('最多展示五篇文章并提供唯一的全部文章入口', () => {
    render(<RelatedArticleRail articles={articles} />);

    const links = screen.getAllByRole('link');
    const articleLinks = links.filter(link =>
      link.getAttribute('href')?.startsWith('/articles/article-')
    );

    expect(links).toHaveLength(6);
    expect(articleLinks).toHaveLength(5);
    articles.slice(0, 5).forEach(article => {
      expect(
        screen.getByRole('link', { name: new RegExp(article.title) })
      ).toHaveAttribute('href', `/articles/${article.id}`);
    });
    expect(
      screen.queryByRole('link', { name: /相关文章 6/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看全部文章' })).toHaveAttribute(
      'href',
      '/articles'
    );
  });

  it('用带标签的导航和列表组织相关文章', () => {
    render(<RelatedArticleRail articles={articles} />);

    const navigation = screen.getByRole('navigation', { name: '相关文章' });
    const list = within(navigation).getByRole('list');

    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(
      within(navigation).getByRole('link', { name: '查看全部文章' })
    ).toBeInTheDocument();
  });

  it('保留标题、分类和阅读数语义', () => {
    render(<RelatedArticleRail articles={[articles[0]]} />);

    expect(
      screen.getByRole('link', { name: /相关文章 1/ })
    ).toBeInTheDocument();
    expect(screen.getByText('分类 1')).toBeInTheDocument();
    expect(screen.getByText('100 阅读')).toBeInTheDocument();
  });

  it('分类为空时仍渲染文章链接和阅读数', () => {
    const articleWithoutCategory: RelatedArticle = {
      ...articles[0],
      category: null,
    };

    render(<RelatedArticleRail articles={[articleWithoutCategory]} />);

    expect(screen.getByRole('link', { name: /相关文章 1/ })).toHaveAttribute(
      'href',
      '/articles/article-1'
    );
    expect(screen.getByText('100 阅读')).toBeInTheDocument();
  });

  it('使用无阴影的低层级玻璃表面', () => {
    const { container } = render(
      <RelatedArticleRail articles={[articles[0]]} />
    );

    expect(container.firstElementChild).toHaveClass('shadow-none');
  });
});
