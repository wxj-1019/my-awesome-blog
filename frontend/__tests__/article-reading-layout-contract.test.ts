import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(
  join(process.cwd(), 'src/app/articles/[id]/article-detail-content.tsx'),
  'utf8'
);

describe('文章阅读三轨响应式契约', () => {
  it('移动和桌面相关文章副本在 xl 断点互斥', () => {
    expect(source).toMatch(
      /<RelatedArticleRail(?=[\s\S]*?heading="继续阅读")(?=[\s\S]*?className=\{cn\('mb-8 xl:hidden', cardBgClass\)\})[\s\S]*?\/>/
    );
    expect(source).toMatch(
      /<aside(?=[^>]*className="hidden xl:block xl:sticky xl:top-24 xl:self-start")(?=[^>]*aria-label="相关文章")[^>]*>[\s\S]*?<RelatedArticleRail[\s\S]*?<\/aside>/
    );
  });

  it('桌面目录和相关文章轨道都有可访问名称', () => {
    expect(source).toContain('aria-label="文章目录"');
    expect(source).toContain('aria-label="相关文章"');
  });
});
