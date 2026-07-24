import { render, screen } from '@testing-library/react';
import HotArticles from '@/app/articles/components/HotArticles';

jest.mock('@/hooks/useThemedClasses', () => ({
  useThemedClasses: () => ({
    themedClasses: {
      textClass: 'text-foreground',
      mutedTextClass: 'text-muted-foreground',
    },
  }),
}));

const makeArticle = (overrides: Partial<{
  id: string;
  title: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
}> = {}) => ({
  id: 'a-1',
  title: '示例文章',
  view_count: 10,
  likes_count: 1,
  comments_count: 0,
  created_at: '2026-01-01',
  ...overrides,
});

describe('HotArticles · 文章页热门列表', () => {
  it('按浏览量降序展示并最多 6 篇', () => {
    const articles = [
      makeArticle({ id: '1', title: '低浏览', view_count: 5 }),
      makeArticle({ id: '2', title: '高浏览', view_count: 999 }),
      makeArticle({ id: '3', title: '中浏览', view_count: 50 }),
    ];

    render(<HotArticles articles={articles} />);

    const titles = screen.getAllByText(/浏览/);
    // 顺序应为：高浏览 -> 中浏览 -> 低浏览
    expect(titles[0]).toHaveTextContent('高浏览');
    expect(titles[1]).toHaveTextContent('中浏览');
    expect(titles[2]).toHaveTextContent('低浏览');
  });

  it('排名前 3 使用高亮徽章样式', () => {
    const articles = Array.from({ length: 5 }, (_, i) =>
      makeArticle({ id: String(i), title: `文章${i}`, view_count: 100 - i }),
    );

    const { container } = render(<HotArticles articles={articles} />);

    // 徽章为圆形排名序号，前 3 名带 tech-cyan 高亮背景
    const badges = container.querySelectorAll('.rounded-full.flex.items-center.justify-center');
    expect(badges).toHaveLength(5);
    expect(badges[0]).toHaveClass('bg-tech-cyan');
    expect(badges[2]).toHaveClass('bg-tech-cyan');
    // 第 4 名及以后为普通背景
    expect(badges[3]).not.toHaveClass('bg-tech-cyan');
  });

  it('列表超过 6 篇时仅渲染前 6 名', () => {
    const articles = Array.from({ length: 10 }, (_, i) =>
      makeArticle({ id: String(i), title: `文章${i}`, view_count: 100 - i }),
    );

    render(<HotArticles articles={articles} />);

    // 每篇文章标题都带“文章”前缀，应恰好渲染 6 条链接
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6);
  });

  it('空列表不渲染任何内容', () => {
    const { container } = render(<HotArticles articles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('每条链接指向对应文章详情页', () => {
    const articles = [
      makeArticle({ id: 'abc', title: '链接测试', view_count: 1 }),
    ];

    render(<HotArticles articles={articles} />);

    const link = screen.getByRole('link', { name: /链接测试/ });
    expect(link).toHaveAttribute('href', '/articles/abc');
  });

  it('不会原地修改传入的 props 数组（防止 Array.sort 变异回退）', () => {
    const articles = [
      makeArticle({ id: '1', title: '低', view_count: 5 }),
      makeArticle({ id: '2', title: '高', view_count: 999 }),
      makeArticle({ id: '3', title: '中', view_count: 50 }),
    ];
    const snapshot = articles.map((a) => a.id);

    render(<HotArticles articles={articles} />);

    // 排序在组件内部进行，不应改变外部数组的元素顺序
    expect(articles.map((a) => a.id)).toEqual(snapshot);
  });
});
