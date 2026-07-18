import React from 'react';
import ArticleCard, { ArticleCardSkeleton } from '@/components/ui/ArticleCard';
import { expectNoA11yViolations } from '@/test-utils/a11y';

jest.mock('next/link', () => {
  return function MockedLink({ children, href, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
    return <a href={href} {...rest}>{children}</a>;
  };
});

describe('ArticleCard 无障碍', () => {
  it('完整卡片应无严重可访问性违规', async () => {
    await expectNoA11yViolations(
      <ArticleCard
        id="test-1"
        title="测试文章"
        excerpt="这是一篇测试文章的摘要。"
        date="2026-07-12"
        readTime="5 分钟"
        category="测试"
        likes={10}
        comments={2}
      />
    );
  });

  it('骨架屏应无严重可访问性违规', async () => {
    await expectNoA11yViolations(<ArticleCardSkeleton />);
  });
});
