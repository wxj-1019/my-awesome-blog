# 全局搜索弹窗实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全站任意页面通过导航按钮或 Cmd/Ctrl+K 唤起搜索弹窗，调用后端 jieba 全文搜索接口检索已发布文章并键盘可达地跳转；顺带修复 Navbar 聚焦不存在元素的死按钮。

**Architecture:** 纯前端新增，零后端改动。新 service `src/lib/api/search.ts` 走 `apiFetch` 直连 `/articles/search-fulltext`；新组件 `GlobalSearch.tsx` 用项目已有的 `@radix-ui/react-dialog` 实现弹窗，300ms 防抖 + AbortController 竞态保护；`Navbar.tsx` 接线并删除 `focusSearch`/`global-search-input` 死代码。

**Tech Stack:** Next.js 16 (App Router)、TypeScript strict、Radix Dialog、Tailwind、Jest + Testing Library。

**Spec:** `docs/superpowers/specs/2026-09-08-global-search-dialog-design.md`

**参考文件（动手前先读）：**
- `frontend/src/components/articles/ArticleTocRail.tsx:137-164` — 项目 Radix Dialog 用法
- `frontend/src/lib/api/friend-links.ts:1-40` — `src/lib/api/*` service 写法
- `frontend/src/lib/api-client.ts:84` — `apiFetch(input, options, retries)`，options 是 RequestInit（支持 signal）
- `frontend/src/types/index.ts:190` — `BackendArticleWithAuthor` 类型
- `frontend/__tests__/FilterBar.test.tsx` — 测试风格（fake timers 测防抖）
- `frontend/src/components/ui/EmptyState.tsx:19` — EmptyState props

---

### Task 1: 搜索 service `src/lib/api/search.ts`

**Files:**
- Create: `frontend/src/lib/api/search.ts`
- Test: `frontend/__tests__/search-api.test.ts`

- [ ] **Step 1: 写失败测试** `frontend/__tests__/search-api.test.ts`

```ts
import { searchArticlesFulltext } from '@/lib/api/search';
import { apiFetch } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('searchArticlesFulltext · 全文搜索 service', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('拼接 search_query/limit/published_only 参数并透传 AbortSignal', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'a1', title: '测试' }],
    } as Response);
    const controller = new AbortController();

    const result = await searchArticlesFulltext('React', controller.signal);

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = apiFetchMock.mock.calls[0];
    expect(url).toContain('/articles/search-fulltext');
    expect(url).toContain('search_query=React');
    expect(url).toContain('limit=20');
    expect(url).toContain('published_only=true');
    expect((options as RequestInit).signal).toBe(controller.signal);
    expect(result).toEqual([{ id: 'a1', title: '测试' }]);
  });

  it('响应非 ok 时抛出错误', async () => {
    apiFetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(searchArticlesFulltext('x')).rejects.toThrow('500');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx jest __tests__/search-api.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/api/search'`

- [ ] **Step 3: 实现 service** `frontend/src/lib/api/search.ts`

```ts
import { apiFetch } from '@/lib/api-client';
import type { BackendArticleWithAuthor } from '@/types';

/** 单次搜索返回的最大结果数（后端上限 100，弹窗场景 20 足够） */
export const SEARCH_RESULTS_LIMIT = 20;

/**
 * 调用后端 jieba 全文搜索（PG tsvector，开发 SQLite 下有方言降级）。
 * 仅返回已发布文章；调用方负责通过 signal 取消过期请求。
 */
export async function searchArticlesFulltext(
  query: string,
  signal?: AbortSignal
): Promise<BackendArticleWithAuthor[]> {
  const params = new URLSearchParams({
    search_query: query,
    limit: String(SEARCH_RESULTS_LIMIT),
    published_only: 'true',
  });
  const response = await apiFetch(`/articles/search-fulltext?${params.toString()}`, {
    signal,
  });
  if (!response.ok) {
    throw new Error(`全文搜索失败：HTTP ${response.status}`);
  }
  return (await response.json()) as Promise<BackendArticleWithAuthor[]>;
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
cd frontend && npx jest __tests__/search-api.test.ts
```

Expected: PASS（2 passed）

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/api/search.ts frontend/__tests__/search-api.test.ts
git commit -m "feat(search): fulltext search api service with abort support"
```

---

### Task 2: `GlobalSearch.tsx` 弹窗组件

**Files:**
- Create: `frontend/src/components/navigation/GlobalSearch.tsx`
- Test: `frontend/__tests__/GlobalSearch.test.tsx`

- [ ] **Step 1: 写失败测试** `frontend/__tests__/GlobalSearch.test.tsx`

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import GlobalSearch from '@/components/navigation/GlobalSearch';
import { searchArticlesFulltext } from '@/lib/api/search';

jest.mock('@/lib/api/search', () => ({
  searchArticlesFulltext: jest.fn(),
}));

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const searchMock = searchArticlesFulltext as jest.MockedFunction<
  typeof searchArticlesFulltext
>;

const ARTICLES = [
  {
    id: 'a1',
    title: 'React 入门',
    excerpt: '第一篇',
    content: '',
    published_at: '2026-01-01',
    read_time: 3,
    cover_image: null,
    categories: [],
  },
  {
    id: 'a2',
    title: 'React 进阶',
    excerpt: '第二篇',
    content: '',
    published_at: '2026-01-02',
    read_time: 5,
    cover_image: null,
    categories: [],
  },
];

function setup(open = true) {
  const onOpenChange = jest.fn();
  render(<GlobalSearch open={open} onOpenChange={onOpenChange} />);
  return { onOpenChange };
}

/** fake timers 下推进防抖并 flush 微任务 */
async function advanceDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(350);
  });
  await act(async () => {});
}

describe('GlobalSearch · 全局搜索弹窗', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    searchMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('输入关键词防抖后调用搜索并渲染结果', async () => {
    searchMock.mockResolvedValue(ARTICLES);
    setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'React' },
    });
    expect(searchMock).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(searchMock).toHaveBeenCalledWith('React', expect.anything());
    expect(screen.getByText('React 入门')).toBeInTheDocument();
    expect(screen.getByText('React 进阶')).toBeInTheDocument();
  });

  it('点击结果跳转文章页并关闭弹窗', async () => {
    searchMock.mockResolvedValue(ARTICLES);
    const { onOpenChange } = setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'React' },
    });
    await advanceDebounce();

    fireEvent.click(screen.getByText('React 入门'));

    expect(pushMock).toHaveBeenCalledWith('/articles/a1');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('键盘 ↓ + Enter 选中第二篇并跳转', async () => {
    searchMock.mockResolvedValue(ARTICLES);
    setup();
    const input = screen.getByLabelText('搜索文章');

    fireEvent.change(input, { target: { value: 'React' } });
    await advanceDebounce();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(pushMock).toHaveBeenCalledWith('/articles/a2');
  });

  it('无结果时显示空态', async () => {
    searchMock.mockResolvedValue([]);
    setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: '不存在的东西' },
    });
    await advanceDebounce();

    expect(screen.getByText('没有找到相关文章')).toBeInTheDocument();
  });

  it('请求失败时显示错误态', async () => {
    searchMock.mockRejectedValue(new Error('HTTP 500'));
    setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'React' },
    });
    await advanceDebounce();

    expect(screen.getByText('搜索出错了')).toBeInTheDocument();
  });

  it('关键词为空时不发请求并显示引导文案', async () => {
    setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: '   ' },
    });
    await advanceDebounce();

    expect(searchMock).not.toHaveBeenCalled();
    expect(screen.getByText('输入关键词搜索全站文章')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx jest __tests__/GlobalSearch.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/navigation/GlobalSearch'`

- [ ] **Step 3: 实现组件** `frontend/src/components/navigation/GlobalSearch.tsx`

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, X, Loader2, FileText } from 'lucide-react';
import { searchArticlesFulltext } from '@/lib/api/search';
import type { BackendArticleWithAuthor } from '@/types';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

/** 输入防抖间隔：与 FilterBar 的 300ms 惯例一致 */
const DEBOUNCE_MS = 300;

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 全站文章搜索弹窗（Cmd/Ctrl+K 或导航按钮唤起）。
 * 防抖 + AbortController：新输入取消在途旧请求，避免旧结果覆盖新结果。
 */
export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BackendArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);

  // 关闭时重置全部状态并中止在途请求
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      setQuery('');
      setResults([]);
      setLoading(false);
      setError(false);
      setActiveIndex(-1);
    }
  }, [open]);

  // 防抖搜索
  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) {
      setResults([]);
      setError(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const items = await searchArticlesFulltext(keyword, controller.signal);
        setResults(items);
        setError(false);
        setActiveIndex(items.length > 0 ? 0 : -1);
      } catch (err) {
        // 主动取消不算错误（浏览器 abort 抛 AbortError，用名称兜底判断）
        if ((err as { name?: string } | null)?.name === 'AbortError') {
          return;
        }
        setResults([]);
        setError(true);
      } finally {
        if (abortRef.current === controller) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const goToArticle = useCallback(
    (article: BackendArticleWithAuthor) => {
      onOpenChange(false);
      router.push(`/articles/${article.id}`);
    },
    [onOpenChange, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) =>
        results.length ? (i - 1 + results.length) % results.length : -1
      );
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      goToArticle(results[activeIndex]);
    }
  };

  const keyword = query.trim();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed z-50 left-1/2 top-[12%] -translate-x-1/2',
            'w-[calc(100vw-2rem)] max-w-xl',
            'bg-glass/80 backdrop-blur-xl border border-glass-border rounded-2xl shadow-2xl',
            'focus:outline-none'
          )}
        >
          <Dialog.Title className="sr-only">全局搜索</Dialog.Title>

          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索文章…"
              aria-label="搜索文章"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="关闭搜索"
                className="p-1 rounded-full hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </Dialog.Close>
          </div>

          <div
            className="max-h-[60vh] overflow-y-auto p-2"
            role="listbox"
            aria-label="搜索结果"
          >
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  className="w-5 h-5 animate-spin text-muted-foreground"
                  aria-label="搜索中"
                />
              </div>
            )}

            {!loading && error && (
              <EmptyState
                variant="error"
                size="sm"
                compact
                title="搜索出错了"
                description="请稍后重试"
              />
            )}

            {!loading && !error && keyword && results.length === 0 && (
              <EmptyState
                variant="search"
                size="sm"
                compact
                title="没有找到相关文章"
                description="换个关键词试试"
              />
            )}

            {!loading && !error && !keyword && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                输入关键词搜索全站文章
              </p>
            )}

            {!loading &&
              !error &&
              results.map((article, index) => (
                <button
                  key={article.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goToArticle(article)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    index === activeIndex ? 'bg-muted/60' : 'hover:bg-muted/40'
                  )}
                >
                  {article.cover_image ? (
                    // 封面来自 MinIO/外部 URL，缩略图场景用裸 img（项目惯例，见 CoverPicker）
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.cover_image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <FileText
                        className="w-5 h-5 text-muted-foreground"
                        aria-hidden
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {article.title}
                    </p>
                    {article.excerpt && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

注意：`role="listbox"` 的直接子级若含非 option 元素会有 lint/aria 告警风险——上面实现把状态块与 option 同层，若 `jsx-a11y` 报错，把状态块移到 listbox 容器外或给状态块加 `role="presentation"`。以实际 lint 输出为准微调，不改测试断言（测试按文案查询，不受影响）。

- [ ] **Step 4: 跑测试确认通过**

```bash
cd frontend && npx jest __tests__/GlobalSearch.test.tsx
```

Expected: PASS（6 passed）。若 Radix Dialog 在 jsdom 报 `hasPointerCapture`/`scrollIntoView` 未实现，在测试文件顶部 jest.mock 之后补：

```ts
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/navigation/GlobalSearch.tsx frontend/__tests__/GlobalSearch.test.tsx
git commit -m "feat(search): global search dialog component with keyboard navigation"
```

---

### Task 3: Navbar 接线 + 删除死代码

**Files:**
- Modify: `frontend/src/components/navigation/Navbar.tsx`

- [ ] **Step 1: 引入组件与状态**

在 `Navbar.tsx` 顶部 import 区加：

```tsx
import GlobalSearch from '@/components/navigation/GlobalSearch';
```

在组件内其他 `useState` 附近加：

```tsx
const [searchOpen, setSearchOpen] = useState(false);
```

- [ ] **Step 2: 替换 Cmd+K 快捷键逻辑（约 173-186 行）**

把 keydown effect 中的：

```tsx
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
```

改为：

```tsx
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
```

- [ ] **Step 3: 删除 focusSearch 死代码并改搜索按钮（约 192-198、406 行）**

删除整个 `focusSearch` useCallback（约 192-198 行，含 `/** 聚焦搜索框 */` 注释）。

把桌面搜索按钮（约 406 行）的 `onClick={focusSearch}` 改为 `onClick={() => setSearchOpen(true)}`。

- [ ] **Step 4: 移动端菜单加搜索入口**

在移动端菜单 `<nav role="navigation" aria-label="移动端导航" className="py-4 px-4 space-y-2">` 内、`{navLinks.map(...)}` 之前插入：

```tsx
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-foreground/80 hover:bg-glass hover:text-tech-cyan transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="搜索文章"
            >
              <Search className="h-5 w-5" />
              <span className="text-base font-medium">搜索</span>
            </button>
```

- [ ] **Step 5: 挂载弹窗组件**

在 `</header>` 结束之后、组件 return 的最外层 `<>...</>` 内（`{/* 移动端菜单 */}` 区块之后即可）加：

```tsx
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
```

注意：Navbar 在 `/admin` 路径提前 return null，弹窗随之不渲染——保持该行为，不要把挂载挪到提前 return 之前。

- [ ] **Step 6: 验证**

```bash
cd frontend && npx tsc --noEmit && npx jest __tests__/GlobalSearch.test.tsx __tests__/search-api.test.ts --silent
```

Expected: tsc 0 错误；8 个测试全过。

手动验证（dev server 可选）：`npm run dev`，任意页面点搜索按钮 / Cmd+K 弹窗打开，输入出结果，Esc 关闭。

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/navigation/Navbar.tsx
git commit -m "feat(search): wire global search dialog into navbar, remove dead focusSearch"
```

---

### Task 4: 全量回归

- [ ] **Step 1: 全量验证**

```bash
cd frontend && npx tsc --noEmit && npx jest --silent && npm run lint
```

Expected: tsc 0 错误；Test Suites 全过（原 55 + 新增 2 = 57）；lint 0 error（既有 13 条 warning 不退化）。

- [ ] **Step 2: 确认无遗留引用**

```bash
grep -rn "global-search-input\|focusSearch" frontend/src/
```

Expected: 无输出（死代码已清干净）。

- [ ] **Step 3: 更新 changelog**

在 `docs/changelog-agents.md` 按现有表格格式追加一行 2026-09-08 记录：全局搜索弹窗上线（激活 jieba 全文搜索前端接入）+ 修复 Navbar 死按钮。

- [ ] **Step 4: Commit**

```bash
git add docs/changelog-agents.md
git commit -m "docs(changelog): global search dialog rollout"
```
