# 文章详情页「安静三轨」沉浸阅读 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将文章详情页改造成正文主导、左右辅助栏安静跟随、明暗主题一致的长文阅读界面。

**Architecture:** 详情页用 `xl+` CSS Grid 编排左目录、正文、右相关文章；sticky 只由 aside 父级负责。正文排版收敛到文章专用 class，Markdown 内容全部使用语义 token。把相关文章、数据带、作者面板从 500 行页面文件拆出为聚焦组件，桌面和移动复用同一份数据。

**Tech Stack:** Next.js 16 App Router、React、TypeScript strict、Tailwind CSS 3、`next/image`、Jest + Testing Library + jest-axe。

---

## 文件地图

### 新建

- `frontend/src/components/articles/RelatedArticleRail.tsx`：桌面右轨与移动端相关文章列表。
- `frontend/src/components/articles/ArticleReadingMetaBar.tsx`：标签与阅读数据的连续信息带。
- `frontend/src/components/articles/ArticleAuthorPanel.tsx`：作者信息与关注操作。
- `frontend/__tests__/article-reading-components.test.tsx`：上述三个组件行为与语义测试。
- `frontend/__tests__/article-toc-rail.test.tsx`：目录 rail/drawer 行为测试。
- `frontend/__tests__/markdown-renderer-reading.test.tsx`：正文块、锚点与主题语义测试。
- `frontend/__tests__/a11y/article-reading.a11y.test.tsx`：文章阅读组件 axe 扫描。

### 修改

- `frontend/src/app/articles/[id]/article-detail-content.tsx`：三轨 Grid 编排、结束区重排、移动相关文章位置。
- `frontend/src/components/articles/ArticleHeroStage.tsx`：封面后标题/元信息与正文中心列对齐。
- `frontend/src/components/articles/ArticleTocRail.tsx`：移除内部 sticky，调整断点与当前章节视觉。
- `frontend/src/components/ui/MarkdownRenderer.tsx`：语义色、代码/引用/表格/图片样式、Markdown h1 降级。
- `frontend/src/styles/globals.css`：文章专用阅读令牌与首字下沉范围。

## 约束

- 不修改文章、评论 API 或数据库。
- 不扩大文章列表页改造范围。
- 不新增依赖。
- 不改变用户现有未跟踪视频海报资源。
- 注释使用中文；禁止 `any`；新增列表使用稳定 key。
- 动效尊重 reduced-motion，不新增持续循环动画。

---

### Task 1: 建立阅读组件测试基线

**Files:**
- Create: `frontend/__tests__/article-reading-components.test.tsx`
- Create: `frontend/__tests__/article-toc-rail.test.tsx`
- Create: `frontend/__tests__/markdown-renderer-reading.test.tsx`

- [ ] **Step 1: 为新文章结束区组件写失败测试**

创建 `article-reading-components.test.tsx`，先按计划中的接口 import 尚不存在的组件：

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import ArticleReadingMetaBar from '@/components/articles/ArticleReadingMetaBar';
import ArticleAuthorPanel from '@/components/articles/ArticleAuthorPanel';
import RelatedArticleRail from '@/components/articles/RelatedArticleRail';

const article = {
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

const related = Array.from({ length: 6 }, (_, index) => ({
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
    fireEvent.click(screen.getByRole('button', { name: '关注作者甲' }));
    expect(onFollow).toHaveBeenCalledTimes(1);
  });

  it('相关文章最多展示五条并提供查看全部入口', () => {
    render(<RelatedArticleRail articles={related} />);
    expect(screen.getAllByRole('link', { name: /相关文章/ })).toHaveLength(5);
    expect(screen.getByRole('link', { name: '查看全部文章' })).toHaveAttribute('href', '/articles');
    expect(screen.queryByText('相关文章 6')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 为目录 rail/drawer 写失败测试**

创建 `article-toc-rail.test.tsx`：

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import ArticleTocRail from '@/components/articles/ArticleTocRail';

Element.prototype.scrollIntoView = jest.fn();

const props = {
  headings: [
    { id: 'first', text: '第一章', level: 2 },
    { id: 'second', text: '第二章', level: 3 },
  ],
  activeId: 'first',
  progress: 37,
  cardBgClass: 'bg-card',
  textClass: 'text-foreground',
  mutedTextClass: 'text-muted-foreground',
  accentActiveClass: 'text-primary',
  idleLinkClass: 'text-muted-foreground',
};

describe('ArticleTocRail', () => {
  it('rail 展示当前章节和阅读进度，不自行携带 sticky class', () => {
    const { container } = render(<ArticleTocRail {...props} variant="rail" />);
    expect(screen.getByText('37%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '第一章' })).toHaveAttribute('aria-current', 'location');
    expect(container.firstElementChild).not.toHaveClass('sticky');
  });

  it('drawer 打开后可跳转章节并关闭', () => {
    document.body.innerHTML = '<h2 id="first">第一章</h2>';
    render(<ArticleTocRail {...props} variant="drawer" />);
    fireEvent.click(screen.getByRole('button', { name: '打开文章目录' }));
    fireEvent.click(screen.getByRole('button', { name: '第一章' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '关闭目录' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 为 Markdown 阅读语义写失败测试**

创建 `markdown-renderer-reading.test.tsx`：

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

const markdown = `
# 文内一级标题

第一段正文。

## 第二章

> 一段中文引用。

\`\`\`ts
const answer = 42;
\`\`\`

| 列一 | 列二 |
| --- | --- |
| A | B |
`;

describe('MarkdownRenderer · 文章阅读语义', () => {
  it('把 Markdown h1 降级为 h2，保持页面唯一 h1', () => {
    render(<MarkdownRenderer content={markdown} context="article" />);
    expect(screen.queryByRole('heading', { level: 1, name: '文内一级标题' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '文内一级标题' })).toBeInTheDocument();
  });

  it('代码复制按钮有可访问名称并调用 clipboard', () => {
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
    render(<MarkdownRenderer content={markdown} context="article" />);
    fireEvent.click(screen.getByRole('button', { name: '复制 TypeScript 代码' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const answer = 42;');
  });

  it('引用与表格使用文章阅读语义 class', () => {
    const { container } = render(<MarkdownRenderer content={markdown} context="article" />);
    expect(container.querySelector('blockquote')).toHaveClass('article-reading-quote');
    expect(container.querySelector('table')).toHaveClass('article-reading-table');
  });
});
```

`MarkdownRenderer` 新接口在后续 Task 3 实现：

```tsx
context?: 'default' | 'article';
```

- [ ] **Step 4: 运行测试确认失败**

Run:

```bash
cd frontend
npx jest __tests__/article-reading-components.test.tsx __tests__/article-toc-rail.test.tsx __tests__/markdown-renderer-reading.test.tsx --runInBand
```

Expected: FAIL，原因包含三个新组件不存在、`context` prop 不存在或 aria/current 断言未满足。

- [ ] **Step 5: 提交测试基线**

```bash
git add frontend/__tests__/article-reading-components.test.tsx frontend/__tests__/article-toc-rail.test.tsx frontend/__tests__/markdown-renderer-reading.test.tsx
git commit -m "test(article): add quiet-rails reading UX baselines"
```

---

### Task 2: 实现相关文章轨与目录 sticky 所有权

**Files:**
- Create: `frontend/src/components/articles/RelatedArticleRail.tsx`
- Modify: `frontend/src/components/articles/ArticleTocRail.tsx`
- Modify: `frontend/src/app/articles/[id]/article-detail-content.tsx`
- Test: `frontend/__tests__/article-reading-components.test.tsx`
- Test: `frontend/__tests__/article-toc-rail.test.tsx`

- [ ] **Step 1: 创建轻量相关文章轨**

实现接口：

```tsx
interface RelatedArticleRailProps {
  articles: RelatedArticle[];
  className?: string;
  heading?: string;
}
```

实现要求：

- `articles.slice(0, 5)`。
- 外层为一个低层级 `GlassCard`，不是嵌套卡片。
- 每条使用单个 `Link`，标题 `line-clamp-2`，分类与阅读量为辅助文字。
- 不使用 `HoverLift`；仅 `hover:bg-muted/40` 和文字色过渡。
- 底部 `Link href="/articles"`，名称“查看全部文章”。
- 无数据时返回 `null`。

核心结构：

```tsx
<GlassCard padding="sm" className={cn('shadow-none', className)}>
  <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
  <div className="mt-3 divide-y divide-border/60">
    {articles.slice(0, 5).map((article) => (
      <Link key={article.id} href={`/articles/${article.id}`} className="block py-3 ...">
        <span className="line-clamp-2 text-sm font-medium">{article.title}</span>
        <span className="mt-1 flex gap-2 text-xs text-muted-foreground">...</span>
      </Link>
    ))}
  </div>
  <Link href="/articles" className="mt-3 inline-flex min-h-11 items-center ...">查看全部文章</Link>
</GlassCard>
```

- [ ] **Step 2: 调整 ArticleTocRail**

修改要求：

- `drawer` 外层断点从 `lg:hidden` 改为 `xl:hidden`。
- 抽屉按钮 aria-label 改为“打开文章目录”，可见文案仍为“目录”。
- drawer bottom 使用 safe area：`bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]`。
- rail `GlassCard` 移除 `xl:sticky xl:top-24`，只保留尺寸/滚动职责。
- 当前目录按钮添加 `aria-current={activeId === item.id ? 'location' : undefined}`。
- 当前章节视觉由 `accentActiveClass` 调用方传入 `border-l-2 border-primary text-primary bg-primary/5`，不使用大面积背景。

- [ ] **Step 3: 把详情页改为三轨 Grid**

在 `article-detail-content.tsx`：

- 外层保持 `max-w-[1440px]`。
- Hero 后内容容器改为：

```tsx
<div className="relative grid grid-cols-1 gap-6 px-4 md:px-6 xl:grid-cols-[13rem_minmax(0,1fr)_14rem] 2xl:grid-cols-[14rem_minmax(0,50rem)_16rem] 2xl:gap-8 xl:items-start xl:justify-center">
```

- 左 aside：

```tsx
<aside className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
```

- 正文列：

```tsx
<div className="min-w-0 w-full max-w-[50rem] justify-self-center">
```

- 右 aside：

```tsx
<aside className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
  <RelatedArticleRail articles={relatedArticles} />
</aside>
```

- 删除原右侧 `HoverLift` 相关文章 markup。
- 移动相关文章暂在正文评论前插入：

```tsx
<div className="xl:hidden mb-8">
  <RelatedArticleRail articles={relatedArticles} heading="继续阅读" />
</div>
```

- 修正目录调用的 active class：

```tsx
accentActiveClass="border-l-2 border-primary bg-primary/5 text-primary font-medium"
```

- [ ] **Step 4: 运行相关测试**

Run:

```bash
cd frontend
npx jest __tests__/article-reading-components.test.tsx __tests__/article-toc-rail.test.tsx --runInBand
npx tsc --noEmit
```

Expected: RelatedArticleRail 与目录测试 PASS，type-check 0 错误。

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/articles/RelatedArticleRail.tsx frontend/src/components/articles/ArticleTocRail.tsx frontend/src/app/articles/[id]/article-detail-content.tsx frontend/__tests__/article-reading-components.test.tsx frontend/__tests__/article-toc-rail.test.tsx
git commit -m "refactor(article): implement quiet three-rail reading layout"
```

---

### Task 3: 正文排版令牌与 Markdown 双主题语义化

**Files:**
- Modify: `frontend/src/components/ui/MarkdownRenderer.tsx`
- Modify: `frontend/src/styles/globals.css`
- Modify: `frontend/src/app/articles/[id]/article-detail-content.tsx`
- Test: `frontend/__tests__/markdown-renderer-reading.test.tsx`

- [ ] **Step 1: 给 MarkdownRenderer 增加 article context**

接口新增：

```tsx
interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxHeight?: string | number;
  showFull?: boolean;
  allowedElements?: string[];
  context?: 'default' | 'article';
}
```

默认：

```tsx
context = 'default'
```

`article` context 要求：

- 根节点增加 `article-markdown`。
- Markdown `h1` 渲染为 `h2`，避免页面出现第二个 h1；后续标题等级保持 h2/h3/h4，上限 h6。
- heading id 继续使用 `extractMarkdownHeadings` 的结果，目录契约不变。
- 代码按钮名称：

```tsx
aria-label={`复制 ${languageLabel} 代码`}
type="button"
```

语言映射至少包含 `ts → TypeScript`、`js → JavaScript`、`py → Python`，未知语言使用原字符串。

- 引用增加 class `article-reading-quote`。
- 表格增加 class `article-reading-table`。
- 图片增加 class `article-reading-image`。

- [ ] **Step 2: 清理 MarkdownRenderer 深色硬编码**

替换原则：

- `text-white/90` → `text-foreground`。
- `text-white/70` / `text-white/60` → `text-muted-foreground`。
- `bg-slate-800/50` → `bg-muted/60`。
- `bg-slate-900/50` → `bg-muted/40` 或 `bg-card/80`。
- `border-white/10` → `border-border`。
- `text-tech-cyan` → `text-primary`（功能性链接/复制操作）。

根 prose class 改为语义化：

```tsx
cn(
  'markdown-content max-w-none text-foreground',
  'prose prose-slate dark:prose-invert',
  'prose-headings:text-foreground prose-headings:font-serif',
  'prose-p:text-foreground/90',
  'prose-strong:text-foreground',
  'prose-blockquote:text-muted-foreground',
  'prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80',
  context === 'article' && 'article-markdown',
  className
)
```

- [ ] **Step 3: 在 globals.css 创建文章专用阅读令牌**

删除全局 `.prose > p:first-of-type::first-letter`，改为文章限定：

```css
.article-reading-surface {
  max-width: 72ch;
  margin-inline: auto;
  font-size: 1rem;
  line-height: 1.82;
  letter-spacing: 0.012em;
}

@media (min-width: 768px) {
  .article-reading-surface {
    font-size: 1.075rem;
  }

  .article-markdown > p:first-of-type::first-letter {
    float: left;
    margin: 0.05em 0.08em 0 0;
    color: var(--primary);
    font-size: 3.05em;
    font-weight: 700;
    line-height: 0.88;
  }
}

.article-markdown :where(p) {
  margin-block: 0.95em;
}

.article-markdown :where(h2) {
  margin-top: 2.2em;
  margin-bottom: 0.7em;
  padding-bottom: 0.35em;
  border-bottom: 1px solid var(--border);
  line-height: 1.35;
}

.article-markdown :where(h3) {
  margin-top: 1.7em;
  margin-bottom: 0.55em;
  line-height: 1.4;
}

.article-reading-quote {
  margin-block: 1.4em;
  border-left: 2px solid var(--primary);
  background: color-mix(in srgb, var(--primary) 6%, transparent);
  color: var(--muted-foreground);
  font-style: normal;
}

.article-reading-table {
  border-color: var(--border);
}

.article-reading-image {
  margin-block: 1.5em;
  border-color: var(--border);
}
```

不要加入裸 hex。

- [ ] **Step 4: 详情页正文应用 article context**

把正文容器改为：

```tsx
<GlassCard
  padding="none"
  className={cn('mb-8 p-5 md:p-8 lg:p-10 shadow-none', cardBgClass)}
>
  <div ref={contentRef} className="article-reading-surface">
    <ArticleBodyReveal enabled>
      <MarkdownRenderer content={article.content} context="article" />
    </ArticleBodyReveal>
  </div>
</GlassCard>
```

导入并使用 `cn`，移除外层重复 `prose prose-lg`，避免 MarkdownRenderer 双重 prose。

- [ ] **Step 5: 运行 Markdown 测试与 type-check**

Run:

```bash
cd frontend
npx jest __tests__/markdown-renderer-reading.test.tsx --runInBand
npx tsc --noEmit
```

Expected: 3 个 Markdown 测试 PASS，type-check 0 错误。

- [ ] **Step 6: 提交**

```bash
git add frontend/src/components/ui/MarkdownRenderer.tsx frontend/src/styles/globals.css frontend/src/app/articles/[id]/article-detail-content.tsx frontend/__tests__/markdown-renderer-reading.test.tsx
git commit -m "refactor(article): add semantic long-form reading typography"
```

---

### Task 4: 收敛文章结束区为数据带与作者面板

**Files:**
- Create: `frontend/src/components/articles/ArticleReadingMetaBar.tsx`
- Create: `frontend/src/components/articles/ArticleAuthorPanel.tsx`
- Modify: `frontend/src/app/articles/[id]/article-detail-content.tsx`
- Test: `frontend/__tests__/article-reading-components.test.tsx`

- [ ] **Step 1: 实现 ArticleReadingMetaBar**

接口：

```tsx
interface ArticleReadingMetaBarProps {
  article: Pick<Article, 'tags' | 'likes_count' | 'comments_count' | 'shares_count' | 'view_count'>;
  className?: string;
}
```

实现要求：

- 一个 `section`，不是四张卡。
- 顶部/左侧展示标签 chips。
- 数据在 `dl` 中，图标 aria-hidden；每个 `div` 带 `aria-label`：点赞数、评论数、分享数、阅读量。
- 桌面横向，移动端 `grid-cols-2`。
- 表面使用 `border-y border-border/70 py-5` 或低层级背景，不用重阴影。

- [ ] **Step 2: 实现 ArticleAuthorPanel**

接口：

```tsx
interface ArticleAuthorPanelProps {
  author: Article['author'];
  isFollowing: boolean;
  onFollow: () => void;
  className?: string;
}
```

实现要求：

- 有头像时保留不受控外部 `<img>`，旁边中文注释解释来源不可控；无头像显示首字母。
- 关注按钮 accessible name：`isFollowing ? '取消关注用户名' : '关注用户名'`。
- `reputation ?? 0`、`followers_count ?? 0`，避免显示 `undefined`。
- 作者 bio、声誉、关注者收在一个低层级面板。
- 不显示“活跃作者”这类无数据依据的固定标签。

- [ ] **Step 3: 替换详情页原结束区**

在正文卡后：

```tsx
<ArticleReadingMetaBar article={article} className="mb-8" />
<ArticleAuthorPanel
  author={article.author}
  isFollowing={isFollowingAuthor}
  onFollow={handleFollowAuthor}
  className="mb-8"
/>
<div className="xl:hidden mb-8">
  <RelatedArticleRail articles={relatedArticles} heading="继续阅读" />
</div>
```

删除：

- 原独立“标签”区。
- 四张统计 GlassCard grid。
- 原作者 GlassCard markup。

评论卡保留，但改为较轻层级：`shadow-none`，标题与输入区边界清晰。

- [ ] **Step 4: 运行组件测试与 type-check**

Run:

```bash
cd frontend
npx jest __tests__/article-reading-components.test.tsx --runInBand
npx tsc --noEmit
```

Expected: 3 个组件测试 PASS，type-check 0 错误。

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/articles/ArticleReadingMetaBar.tsx frontend/src/components/articles/ArticleAuthorPanel.tsx frontend/src/app/articles/[id]/article-detail-content.tsx frontend/__tests__/article-reading-components.test.tsx
git commit -m "refactor(article): consolidate reading footer and author panel"
```

---

### Task 5: 对齐封面、标题和正文中心线

**Files:**
- Modify: `frontend/src/components/articles/ArticleHeroStage.tsx`
- Modify: `frontend/src/app/articles/[id]/article-detail-content.tsx`

- [ ] **Step 1: 给 HeroStage 增加内容宽度入口**

接口新增：

```tsx
contentClassName?: string;
```

组件中封面保持全宽；标题元信息包裹改为：

```tsx
<div className={cn('mx-auto w-full px-4 md:px-6', contentClassName)}>
```

调用方传：

```tsx
contentClassName="max-w-[50rem]"
```

这样标题、meta 和正文均围绕 800px 中心列。

- [ ] **Step 2: 调整封面高度和视觉节奏**

媒体容器：

```tsx
className="relative z-10 mb-8 h-[13rem] overflow-hidden sm:h-[15rem] lg:h-[19rem] md:rounded-xl"
```

要求：

- 不占满首屏。
- Ken Burns/视差逻辑不变。
- `ArticleHeroCover` reduced-motion 行为不变。

标题/元信息：

- 分类与阅读时长 `mb-4`。
- h1 `text-3xl md:text-4xl`，不继续增大。
- 作者/日期/阅读量与互动按钮在移动端自然换行。
- 移除不必要的重 `drop-shadow` 或大面积装饰。

- [ ] **Step 3: 运行 type-check 和相关测试**

Run:

```bash
cd frontend
npx tsc --noEmit
npx jest __tests__/article-reading-components.test.tsx __tests__/article-toc-rail.test.tsx __tests__/markdown-renderer-reading.test.tsx --runInBand
```

Expected: type-check 0 错误，文章阅读测试全部 PASS。

- [ ] **Step 4: 提交**

```bash
git add frontend/src/components/articles/ArticleHeroStage.tsx frontend/src/app/articles/[id]/article-detail-content.tsx
git commit -m "refactor(article): align hero metadata with reading column"
```

---

### Task 6: 无障碍、编码与响应式浏览器验证

**Files:**
- Create: `frontend/__tests__/a11y/article-reading.a11y.test.tsx`
- Modify only if verification finds a concrete issue: files from Tasks 2–5

- [ ] **Step 1: 添加阅读组件 axe 测试**

创建 `article-reading.a11y.test.tsx`，组合渲染：

```tsx
import { expectNoA11yViolations } from '@/test-utils/a11y';
import ArticleReadingMetaBar from '@/components/articles/ArticleReadingMetaBar';
import ArticleAuthorPanel from '@/components/articles/ArticleAuthorPanel';
import RelatedArticleRail from '@/components/articles/RelatedArticleRail';

it('文章辅助阅读组件无严重无障碍违规', async () => {
  await expectNoA11yViolations(
    <div>
      <ArticleReadingMetaBar article={articleFixture} />
      <ArticleAuthorPanel author={articleFixture.author} isFollowing={false} onFollow={() => {}} />
      <RelatedArticleRail articles={relatedFixture} />
    </div>
  );
}, 15000);
```

fixture 字段与 Task 1 相同，保持精确类型。

- [ ] **Step 2: 运行所有文章阅读测试**

Run:

```bash
cd frontend
npx jest __tests__/article-reading-components.test.tsx __tests__/article-toc-rail.test.tsx __tests__/markdown-renderer-reading.test.tsx __tests__/a11y/article-reading.a11y.test.tsx --runInBand
```

Expected: 全部 PASS，无 axe violations。

- [ ] **Step 3: 运行全量静态验证**

Run:

```bash
cd frontend
npm run lint
npm run type-check
npm test -- --runInBand
npm run build
```

Expected:

- lint 0 error（既有 warnings 单独记录）。
- type-check 0 错误。
- 全量测试通过。
- build 成功；`/articles/[id]` 正常产出。

- [ ] **Step 4: 启动本地 dev server**

Run:

```bash
cd frontend
npm run dev -- --port 3000
```

Expected: `http://localhost:3000` 可访问；端口占用时使用下一个可用端口。

- [ ] **Step 5: 用 Browser Use 检查三个视口**

检查一个真实文章详情 URL（从文章列表的可见链接进入，不猜 ID）：

- 390×844：正文无横向溢出；目录按钮不遮评论输入；相关文章在正文后；代码/表格可横向滚动。
- 1280×900：正文优先，无 viewport fixed 左轨遮挡；目录使用移动/平板策略。
- 1536×960：完整三轨；左右 aside sticky；正文约 72ch；滚动到文章中部后目录当前章节更新，相关文章保持可见。

同时切换 light/dark：代码、引用、表格、链接和正文对比正常。

- [ ] **Step 6: 验证中文编码**

在浏览器 DOM snapshot 中确认文章标题和正文中文正常。再检查响应头：

```bash
curl -I http://localhost:3000/articles/<snapshot-proven-id>
```

Expected: 页面 UTF-8 渲染正常。若浏览器正常而终端 `curl` 乱码，记录为终端代码页问题；若浏览器也乱码，停止并单独建立数据编码修复任务。

- [ ] **Step 7: 最终 diff 与提交**

```bash
git diff --check
git status --short
git add frontend/__tests__/a11y/article-reading.a11y.test.tsx
# 若浏览器验证产生修复，同步 add 对应文件
git commit -m "test(article): verify immersive reading accessibility and responsiveness"
```

仅在有测试文件/验证修复时提交，不创建空提交。

---

## Spec 覆盖自检

- 三轨比例与 sticky 所有权：Task 2。
- 正文 72ch、字号/行高/段距、首字下沉范围：Task 3。
- Markdown 双主题语义色、代码/引用/表格/图片：Task 3。
- 标签/数据/作者/相关文章/评论结束区收敛：Task 4。
- 封面与正文中心线：Task 5。
- 移动目录、断点、三视口与明暗主题：Task 2 + Task 6。
- reduced-motion：Task 5 保持现有逻辑，Task 6 浏览器验证。
- 编码问题边界：Task 6 单独验证，不夹带后端修复。
- 测试、a11y、lint、type-check、build：Task 1 + Task 6。

## 自检结果

- 无 `TBD`、`TODO` 或不明确占位。
- 新组件接口在首次使用前完整定义。
- `RelatedArticleRail`、`ArticleReadingMetaBar`、`ArticleAuthorPanel` 各自职责单一。
- 主详情页只保留状态、数据流和布局编排，不重复实现展示组件。
