# 作品集公开页实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建 `/portfolio` 公开页面（纯 RSC，零客户端 JS 增量），卡片网格展示全部作品，导航栏加入口，sitemap 收录；顺带重写已漂移的 `lib/api/portfolio.ts` 类型。

**Architecture:** RSC 页面服务端 `apiFetch` 调公开接口 `GET /api/v1/portfolio/`；展示组件全为 Server Component（hover 走 CSS group-hover）；排序逻辑抽纯函数便于单测。

**Tech Stack:** Next.js 16 App Router RSC、TypeScript strict、Tailwind、Jest + Testing Library。

**Spec:** `docs/superpowers/specs/2026-09-08-portfolio-public-page-design.md`

**参考文件（动手前先读）：**
- `backend/app/schemas/portfolio.py:10-31` — 后端字段权威定义
- `frontend/src/lib/api/portfolio.ts` — 待重写类型的死代码文件（函数体保留）
- `frontend/src/components/layout/PageActHeader.tsx` — 页头组件（client，可作 RSC 叶子）：props `{ kicker, title, description, kickerFont, align, className }`
- `frontend/src/components/ui/GlassCard.tsx`、`frontend/src/components/ui/Badge.tsx`（variant: default/secondary/destructive/outline）、`frontend/src/components/ui/EmptyState.tsx`
- `frontend/src/app/albums/albums-content.tsx:199-205` — PageActHeader 用法
- `frontend/__tests__/FilterBar.test.tsx` — 测试风格

---

### Task 1: 重写 `lib/api/portfolio.ts` 类型对齐后端

**Files:**
- Modify: `frontend/src/lib/api/portfolio.ts`（仅改三个 interface，函数体一行不动）

- [ ] **Step 1: 重写三个 interface**（文件 1-38 行区域），替换 `PortfolioItem` / `PortfolioItemCreate` / `PortfolioItemUpdate` 为：

```ts
export interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  demo_url: string | null;
  github_url: string | null;
  technologies: string[] | null;
  start_date: string | null;
  end_date: string | null;
  /** completed=已完成 in_progress=进行中 planned=规划中 */
  status: string | null;
  is_featured: boolean | null;
  sort_order: number | null;
  created_at: string;
  updated_at?: string;
}

export interface PortfolioItemCreate {
  title: string;
  slug: string;
  description?: string | null;
  cover_image?: string | null;
  demo_url?: string | null;
  github_url?: string | null;
  technologies?: string[] | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  is_featured?: boolean | null;
  sort_order?: number | null;
}

export interface PortfolioItemUpdate {
  title?: string;
  slug?: string;
  description?: string | null;
  cover_image?: string | null;
  demo_url?: string | null;
  github_url?: string | null;
  technologies?: string[] | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  is_featured?: boolean | null;
  sort_order?: number | null;
}
```

（字段与 `backend/app/schemas/portfolio.py` 的 `PortfolioItemBase`/`PortfolioItemUpdate` 一一对应；date 序列化为 ISO 字符串。）

- [ ] **Step 2: 验证**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 0 错误（该文件全库无引用，改类型不会波及其他文件；admin/portfolios 页用本地 interface 不受影响）。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api/portfolio.ts
git commit -m "fix(api): align portfolio types with backend schema (dead code revival)"
```

---

### Task 2: PortfolioCard / PortfolioGrid 组件 + 测试

**Files:**
- Create: `frontend/src/components/portfolio/PortfolioCard.tsx`
- Create: `frontend/src/components/portfolio/PortfolioGrid.tsx`
- Test: `frontend/__tests__/PortfolioCard.test.tsx`
- Test: `frontend/__tests__/PortfolioGrid.test.tsx`

两个组件均为 **Server Component**（不写 `'use client'`），jsdom 下可同步渲染测试。

- [ ] **Step 1: 写失败测试** `frontend/__tests__/PortfolioGrid.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import PortfolioGrid, { sortPortfolioItems } from '@/components/portfolio/PortfolioGrid';
import type { PortfolioItem } from '@/lib/api/portfolio';

const item = (overrides: Partial<PortfolioItem>): PortfolioItem => ({
  id: Math.random().toString(36).slice(2),
  title: '作品',
  slug: 'work',
  description: null,
  cover_image: null,
  demo_url: null,
  github_url: null,
  technologies: null,
  start_date: null,
  end_date: null,
  status: 'completed',
  is_featured: false,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('sortPortfolioItems · 排序', () => {
  it('精选优先，其次 sort_order 升序，再按 created_at 降序', () => {
    const a = item({ title: 'A', is_featured: false, sort_order: 1, created_at: '2026-01-02T00:00:00Z' });
    const b = item({ title: 'B', is_featured: true, sort_order: 5, created_at: '2026-01-01T00:00:00Z' });
    const c = item({ title: 'C', is_featured: false, sort_order: 1, created_at: '2026-01-03T00:00:00Z' });

    const sorted = sortPortfolioItems([a, b, c]);

    expect(sorted.map((i) => i.title)).toEqual(['B', 'C', 'A']);
  });
});

describe('PortfolioGrid · 网格', () => {
  it('空数组渲染空态', () => {
    render(<PortfolioGrid items={[]} />);

    expect(screen.getByText('暂无作品')).toBeInTheDocument();
  });

  it('渲染作品卡片', () => {
    render(<PortfolioGrid items={[item({ title: '我的博客' })]} />);

    expect(screen.getByText('我的博客')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 写失败测试** `frontend/__tests__/PortfolioCard.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import PortfolioCard from '@/components/portfolio/PortfolioCard';
import type { PortfolioItem } from '@/lib/api/portfolio';

const base: PortfolioItem = {
  id: 'p1',
  title: '个人博客',
  slug: 'blog',
  description: '全栈博客平台',
  cover_image: 'https://example.com/cover.jpg',
  demo_url: 'https://demo.example.com',
  github_url: 'https://github.com/x/blog',
  technologies: ['Next.js', 'FastAPI', 'PostgreSQL'],
  start_date: '2025-01-01',
  end_date: null,
  status: 'in_progress',
  is_featured: true,
  sort_order: 1,
  created_at: '2026-01-01T00:00:00Z',
};

describe('PortfolioCard · 作品卡片', () => {
  it('渲染完整字段：标题/描述/技术栈/徽章/链接/日期', () => {
    render(<PortfolioCard item={base} />);

    expect(screen.getByText('个人博客')).toBeInTheDocument();
    expect(screen.getByText('全栈博客平台')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('精选')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /在线预览/ })).toHaveAttribute('href', 'https://demo.example.com');
    expect(screen.getByRole('link', { name: /源码/ })).toHaveAttribute('href', 'https://github.com/x/blog');
    expect(screen.getByText(/2025-01-01/)).toBeInTheDocument();
    expect(screen.getByText(/至今/)).toBeInTheDocument();
  });

  it('无封面时渲染占位，无链接时不渲染链接区', () => {
    render(
      <PortfolioCard
        item={{ ...base, cover_image: null, demo_url: null, github_url: null, is_featured: false, status: 'completed' }}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /在线预览/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /源码/ })).not.toBeInTheDocument();
    expect(screen.queryByText('精选')).not.toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('技术栈超过 5 个时显示 +N', () => {
    render(
      <PortfolioCard
        item={{ ...base, technologies: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }}
      />
    );

    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 跑测试确认失败**

```bash
cd frontend && npx jest __tests__/PortfolioGrid.test.tsx __tests__/PortfolioCard.test.tsx
```

Expected: FAIL — Cannot find module。

- [ ] **Step 4: 实现 PortfolioCard** `frontend/src/components/portfolio/PortfolioCard.tsx`

```tsx
import { ExternalLink, Github, FolderGit2, Star } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import type { PortfolioItem } from '@/lib/api/portfolio';
import { cn } from '@/lib/utils';

/** 技术栈标签最多展示数量，超出折叠为 +N */
const MAX_TECH_BADGES = 5;

const STATUS_META: Record<string, { label: string; className: string }> = {
  completed: { label: '已完成', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  in_progress: { label: '进行中', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  planned: { label: '规划中', className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30' },
};

/**
 * 作品卡片（Server Component）：封面 + 标题 + 描述 + 技术栈 + 状态/精选徽章 + 外链。
 * hover 微交互纯 CSS（group-hover），无客户端 JS。
 */
export default function PortfolioCard({ item }: { item: PortfolioItem }) {
  const techs = item.technologies ?? [];
  const visibleTechs = techs.slice(0, MAX_TECH_BADGES);
  const hiddenCount = techs.length - visibleTechs.length;
  const statusMeta = (item.status && STATUS_META[item.status]) || null;

  return (
    <GlassCard className="group flex flex-col overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-1">
      {/* 封面 16:9 */}
      <div className="relative aspect-video overflow-hidden bg-muted/40">
        {item.cover_image ? (
          // 封面来自 MinIO/外部 URL，缩略场景用裸 img（项目惯例，见 CoverPicker）
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.cover_image}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
            <FolderGit2 className="h-10 w-10 text-muted-foreground/50" aria-hidden />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {item.is_featured ? (
            <Badge variant="default" className="gap-1">
              <Star className="h-3 w-3" aria-hidden />
              精选
            </Badge>
          ) : null}
          {statusMeta ? (
            <Badge variant="outline" className={cn('backdrop-blur-sm', statusMeta.className)}>
              {statusMeta.label}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-serif text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {item.title}
        </h3>
        {item.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        ) : null}

        {visibleTechs.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {visibleTechs.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
            {hiddenCount > 0 ? (
              <Badge variant="outline" className="text-xs">
                +{hiddenCount}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
          {item.start_date ? (
            <span>
              {item.start_date} – {item.end_date ?? '至今'}
            </span>
          ) : (
            <span />
          )}
          <span className="flex gap-3">
            {item.demo_url ? (
              <a
                href={item.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.title} 在线预览`}
                className="inline-flex items-center gap-1 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                在线预览
              </a>
            ) : null}
            {item.github_url ? (
              <a
                href={item.github_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.title} 源码`}
                className="inline-flex items-center gap-1 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <Github className="h-3.5 w-3.5" aria-hidden />
                源码
              </a>
            ) : null}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
```

- [ ] **Step 5: 实现 PortfolioGrid** `frontend/src/components/portfolio/PortfolioGrid.tsx`

```tsx
import PortfolioCard from '@/components/portfolio/PortfolioCard';
import EmptyState from '@/components/ui/EmptyState';
import type { PortfolioItem } from '@/lib/api/portfolio';

/** 精选优先 → sort_order 升序 → created_at 降序（返回新数组，不改原数组） */
export function sortPortfolioItems(items: PortfolioItem[]): PortfolioItem[] {
  return [...items].sort((a, b) => {
    const featuredDiff = Number(b.is_featured ?? false) - Number(a.is_featured ?? false);
    if (featuredDiff !== 0) {return featuredDiff;}
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (orderDiff !== 0) {return orderDiff;}
    return b.created_at.localeCompare(a.created_at);
  });
}

/** 作品网格（Server Component）：响应式三列，空数据走 EmptyState。 */
export default function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="暂无作品"
        description="作品正在整理中，敬请期待"
        size="md"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sortPortfolioItems(items).map((item) => (
        <PortfolioCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

注意：若 GlassCard 不接受 `p-0` 覆盖或自带 padding 冲突，读 GlassCard 实现后用其支持的方式（如 props 或 cn 覆盖）处理，测试断言不受影响。

- [ ] **Step 6: 跑测试确认通过**

```bash
cd frontend && npx jest __tests__/PortfolioGrid.test.tsx __tests__/PortfolioCard.test.tsx
```

Expected: PASS（7 passed）。若 GlassCard/EmptyState 渲染的类名或结构导致个别断言失败，按实际输出微调实现（不改测试语义）。

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/portfolio/ frontend/__tests__/PortfolioCard.test.tsx frontend/__tests__/PortfolioGrid.test.tsx
git commit -m "feat(portfolio): public portfolio card and grid components"
```

---

### Task 3: `/portfolio` 页面 + 导航入口 + sitemap

**Files:**
- Create: `frontend/src/app/portfolio/page.tsx`
- Modify: `frontend/src/components/navigation/Navbar.tsx`
- Modify: `frontend/src/app/sitemap.ts`

- [ ] **Step 1: 新建页面** `frontend/src/app/portfolio/page.tsx`

```tsx
import type { Metadata } from 'next';
import PageActHeader from '@/components/layout/PageActHeader';
import PortfolioGrid from '@/components/portfolio/PortfolioGrid';
import EmptyState from '@/components/ui/EmptyState';
import { getPortfolioItems } from '@/lib/api/portfolio';
import type { PortfolioItem } from '@/lib/api/portfolio';

export const metadata: Metadata = {
  title: '作品集 - My Awesome Blog',
  description: '精选项目与作品展示：全栈应用、开源工具与技术实践。',
};

/** 作品数据量小且更新低频，服务端每次请求拉取（与公开接口契约一致） */
async function loadItems(): Promise<PortfolioItem[]> {
  try {
    return await getPortfolioItems({ limit: 100 });
  } catch {
    // 后端不可达时渲染空态而非整页 500
    return [];
  }
}

export default async function PortfolioPage() {
  const items = await loadItems();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
      <PageActHeader
        kicker="作品集 · PORTFOLIO"
        title="精选作品"
        description="项目与实践 · 从想法到上线"
        className="mb-10"
      />
      <PortfolioGrid items={items} />
    </main>
  );
}
```

注意：`pt-24` 是给 fixed Navbar 留的间距——动手前对照 `frontend/src/app/albums/albums-content.tsx` 或 about 页的实际顶部间距类调整一致。若 kickerFont 体系里作品集有指定艺术字体（参考 albums 用 `font-gallery`），先 grep `font-` 类在 tailwind.config.js 或 variables.css 的可选值，选一个语义贴合的；没有明确对应就省略 kickerFont。

- [ ] **Step 2: 导航入口**。`Navbar.tsx` navLinks 中 `{ href: '/albums', label: '相册', icon: Camera },` 之后插入：

```tsx
  { href: '/portfolio', label: '作品集', icon: Briefcase },
```

并把 `Briefcase` 加进文件顶部的 lucide-react import 列表。

- [ ] **Step 3: sitemap**。`frontend/src/app/sitemap.ts` 按 `/albums` 条目完全相同的格式（url/lastModified/changeFrequency/priority 字段照抄相邻条目）加一条 `${baseUrl}/portfolio`。

- [ ] **Step 4: 验证**

```bash
cd frontend && npx tsc --noEmit && npx jest --silent 2>&1 | tail -3 && npm run lint 2>&1 | tail -2
```

Expected: tsc 0 错误；全部测试过（57 套件 365 用例 + 新增）；lint 0 error。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/portfolio/ frontend/src/components/navigation/Navbar.tsx frontend/src/app/sitemap.ts
git commit -m "feat(portfolio): public portfolio page with navbar entry and sitemap"
```

---

### Task 4: 全量回归 + changelog

- [ ] **Step 1: 全量验证**（命令同 Task 3 Step 4），确认无退化。
- [ ] **Step 2: 更新 changelog**。`docs/changelog-agents.md` 记录表按现有格式追加 2026-09-08 行：作品集公开页上线 + portfolio api 类型重写对齐后端。
- [ ] **Step 3: Commit** `git add docs/changelog-agents.md && git commit -m "docs(changelog): portfolio public page rollout"`
