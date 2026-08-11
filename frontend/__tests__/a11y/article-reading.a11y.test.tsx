import { expectNoA11yViolations } from '@/test-utils/a11y';
import ArticleReadingMetaBar from '@/components/articles/ArticleReadingMetaBar';
import ArticleAuthorPanel from '@/components/articles/ArticleAuthorPanel';
import RelatedArticleRail from '@/components/articles/RelatedArticleRail';
import type { RelatedArticle } from '@/types';

const metaArticle = {
  tags: [
    { id: 'tag-1', name: 'AI', slug: 'ai' },
    { id: 'tag-2', name: '前端', slug: 'frontend' },
  ],
  likes_count: 12,
  comments_count: 3,
  shares_count: 5,
  view_count: 420,
};

const authorArticle = {
  author: {
    id: 'author-1',
    username: '作者甲',
    email: 'author@example.com',
    bio: '专注长文与技术写作',
    reputation: 88,
    followers_count: 27,
  },
};

const related: RelatedArticle[] = [
  {
    id: 'related-1',
    title: '相关文章 1',
    excerpt: '摘要',
    published_at: '2026-08-11T00:00:00Z',
    category: { name: '技术' },
    view_count: 100,
  },
  {
    id: 'related-2',
    title: '相关文章 2',
    excerpt: '摘要',
    published_at: '2026-08-10T00:00:00Z',
    category: null,
    view_count: 200,
  },
];

describe('文章阅读辅助组件无障碍', () => {
  it('阅读数据栏无严重无障碍违规', async () => {
    await expectNoA11yViolations(
      <ArticleReadingMetaBar article={metaArticle} />
    );
  }, 15000);

  it('作者面板无严重无障碍违规', async () => {
    await expectNoA11yViolations(
      <ArticleAuthorPanel
        author={authorArticle.author}
        isFollowing={false}
        onFollow={() => {}}
      />
    );
  }, 15000);

  it('相关文章轨无严重无障碍违规', async () => {
    await expectNoA11yViolations(
      <RelatedArticleRail articles={related} />
    );
  }, 15000);

  it('空相关文章不产生违规', async () => {
    const { container } = await import('@testing-library/react').then(r =>
      r.render(<RelatedArticleRail articles={[]} />)
    );
    // 空组件返回 null，axe 扫描无违规
    expect(container).toBeEmptyDOMElement();
  });
});
