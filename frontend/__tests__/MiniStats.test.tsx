import { render, screen } from '@testing-library/react';
import MiniStats from '@/app/articles/components/MiniStats';

// useThemedClasses 依赖主题上下文与 matchMedia，单测中固定返回语义类名
jest.mock('@/hooks/useThemedClasses', () => ({
  useThemedClasses: () => ({
    themedClasses: {
      textClass: 'text-foreground',
      mutedTextClass: 'text-muted-foreground',
    },
  }),
}));

describe('MiniStats · 文章页侧栏统计卡', () => {
  it('渲染四项统计及其数值', () => {
    render(
      <MiniStats
        articleCount={12}
        totalViews={3456}
        totalLikes={78}
        totalComments={9}
      />,
    );

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('文章')).toBeInTheDocument();
    expect(screen.getByText('阅读')).toBeInTheDocument();
    expect(screen.getByText('点赞')).toBeInTheDocument();
    expect(screen.getByText('评论')).toBeInTheDocument();
  });

  it('数值按千分位格式化展示', () => {
    render(
      <MiniStats
        articleCount={1}
        totalViews={1234567}
        totalLikes={0}
        totalComments={0}
      />,
    );

    // 1234567 -> "1,234,567"
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('零值也能正常渲染', () => {
    render(
      <MiniStats
        articleCount={0}
        totalViews={0}
        totalLikes={0}
        totalComments={0}
      />,
    );

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(4);
  });
});
