import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ArticleReadingMetaBar from '@/components/articles/ArticleReadingMetaBar';
import ArticleAuthorPanel from '@/components/articles/ArticleAuthorPanel';
import type { Article } from '@/types';

/** 文章阅读数据 fixture（Pick 类型子集） */
const articleFixture: Pick<
  Article,
  'tags' | 'likes_count' | 'comments_count' | 'shares_count' | 'view_count'
> = {
  tags: [
    { id: 't1', name: 'AI', slug: 'ai' },
    { id: 't2', name: '前端', slug: 'frontend' },
  ],
  likes_count: 12,
  comments_count: 3,
  shares_count: 5,
  view_count: 420,
};

/** 作者 fixture */
const authorFixture: Article['author'] = {
  id: 'a1',
  username: '作者甲',
  email: 'a@b.com',
  bio: '专注长文',
  reputation: 88,
  followers_count: 27,
};

/* ------------------------------------------------------------------ */
/*  ArticleReadingMetaBar                                              */
/* ------------------------------------------------------------------ */

describe('ArticleReadingMetaBar', () => {
  it('渲染标签 "AI" 和 "前端"', () => {
    render(<ArticleReadingMetaBar article={articleFixture} />);

    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('前端')).toBeInTheDocument();
  });

  it('用 aria-label 展示点赞数 12', () => {
    render(<ArticleReadingMetaBar article={articleFixture} />);

    expect(screen.getByLabelText('点赞数：12')).toBeInTheDocument();
  });

  it('用 aria-label 展示评论数 3', () => {
    render(<ArticleReadingMetaBar article={articleFixture} />);

    expect(screen.getByLabelText('评论数：3')).toBeInTheDocument();
  });

  it('用 aria-label 展示分享数 5', () => {
    render(<ArticleReadingMetaBar article={articleFixture} />);

    expect(screen.getByLabelText('分享数：5')).toBeInTheDocument();
  });

  it('用 aria-label 展示阅读量 420', () => {
    render(<ArticleReadingMetaBar article={articleFixture} />);

    expect(screen.getByLabelText('阅读量：420')).toBeInTheDocument();
  });

  it('根元素为 section 且仅有一个', () => {
    const { container } = render(
      <ArticleReadingMetaBar article={articleFixture} />
    );

    const sections = container.querySelectorAll('section');
    expect(sections).toHaveLength(1);
  });

  it('section 内恰好包含一个 dl 元素', () => {
    const { container } = render(
      <ArticleReadingMetaBar article={articleFixture} />
    );

    const section = container.querySelector('section')!;
    const dls = section.querySelectorAll('dl');
    expect(dls).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/*  ArticleAuthorPanel                                                 */
/* ------------------------------------------------------------------ */

describe('ArticleAuthorPanel', () => {
  it('渲染按钮名称 "关注作者甲" 且点击触发 onFollow', () => {
    const onFollow = jest.fn();
    render(
      <ArticleAuthorPanel
        author={authorFixture}
        isFollowing={false}
        onFollow={onFollow}
      />
    );

    const button = screen.getByRole('button', { name: '关注作者甲' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onFollow).toHaveBeenCalledTimes(1);
  });

  it('展示 "88 声誉"', () => {
    render(
      <ArticleAuthorPanel
        author={authorFixture}
        isFollowing={false}
        onFollow={() => {}}
      />
    );

    expect(screen.getByText('88 声誉')).toBeInTheDocument();
  });

  it('展示 "27 关注者"', () => {
    render(
      <ArticleAuthorPanel
        author={authorFixture}
        isFollowing={false}
        onFollow={() => {}}
      />
    );

    expect(screen.getByText('27 关注者')).toBeInTheDocument();
  });

  it('展示作者 bio', () => {
    render(
      <ArticleAuthorPanel
        author={authorFixture}
        isFollowing={false}
        onFollow={() => {}}
      />
    );

    expect(screen.getByText('专注长文')).toBeInTheDocument();
  });

  it('isFollowing=true 时按钮名称为 "取消关注作者甲"', () => {
    render(
      <ArticleAuthorPanel
        author={authorFixture}
        isFollowing={true}
        onFollow={() => {}}
      />
    );

    expect(
      screen.getByRole('button', { name: '取消关注作者甲' })
    ).toBeInTheDocument();
  });

  it('reputation 和 followers_count 为 undefined 时回退显示 0', () => {
    const authorNoStats: Article['author'] = {
      id: 'a2',
      username: '作者乙',
      email: 'b@b.com',
    };
    render(
      <ArticleAuthorPanel
        author={authorNoStats}
        isFollowing={false}
        onFollow={() => {}}
      />
    );

    expect(screen.getByText('0 声誉')).toBeInTheDocument();
    expect(screen.getByText('0 关注者')).toBeInTheDocument();
  });
});
