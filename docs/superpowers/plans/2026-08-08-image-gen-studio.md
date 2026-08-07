# image-gen 创作台重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/tools/image-gen` 页面重构为「创作台」（左表单 + 右画布），修复账户 30s 轮询、生成进度反馈、视频加载黑屏等真实性问题，打磨类型切换/提示词/生成按钮等交互细节。

**Architecture:** 拆出三个新组件（ProgressSteps 步进条 / HistoryList 历史列表 / CanvasStage 画布四态容器），`useTaskPolling` 新增 `phase` 输出区分排队/生成阶段，`image-gen-content.tsx` 保留全部状态逻辑并接入新组件。纯前端改动，不动后端与 payload 契约。

**Tech Stack:** Next.js 16 + TS strict + Tailwind v3（令牌类）+ framer-motion（`@/lib/framer-motion` / `@/components/motion`）+ Jest + axe-core。

**设计文档:** `docs/superpowers/specs/2026-08-08-image-gen-studio-design.md`

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `frontend/src/hooks/useTaskPolling.ts` | 修改：新增 `phase` 输出（'idle'\|'pending'\|'running'\|'done'） |
| `frontend/src/components/tools/image-gen/ProgressSteps.tsx` | 新建：三节点步进条（排队→生成→完成） |
| `frontend/src/components/tools/image-gen/HistoryList.tsx` | 新建：画布历史列表（宽版，复用 localStorage 数据源） |
| `frontend/src/components/tools/image-gen/CanvasStage.tsx` | 新建：画布四态容器 + 结果/历史 tab + Lightbox 迁入 |
| `frontend/src/app/tools/image-gen/image-gen-content.tsx` | 修改：输入区打磨 + 接入 CanvasStage + 30s 账户轮询 |
| `frontend/__tests__/useTaskPolling.test.tsx` | 修改：加 phase 断言 |
| `frontend/__tests__/progress-steps.test.tsx` | 新建 |
| `frontend/__tests__/history-list.test.tsx` | 新建 |
| `frontend/__tests__/canvas-stage.test.tsx` | 新建 |
| `frontend/__tests__/image-gen-content.test.tsx` | 修改：兼容 + 新交互测试 |
| `frontend/__tests__/a11y/image-gen.a11y.test.tsx` | 修改：创作台结构覆盖 |

**关键既有 API（勿改名）**：
- `useTaskPolling({ intervalMs, timeoutMs, maxRetries })` → `{ status, result, error, start, stop }`（Task 1 增加 `phase`）
- `GenHistoryEntry { id, createdAt, kind, prompt, size?, count?, images, videoUrl }`，`loadHistory/saveHistory/addHistoryEntry/deleteHistoryEntry`（`@/lib/image-gen-history`）
- `createGenTask / getGenTaskStatus / getGenAccount`（`@/lib/api/imageGen`）
- 动效：`FadeIn / Stagger / StaggerItem`（`@/components/motion`）；`motion / AnimatePresence`（`@/lib/framer-motion`）；`useReducedMotion`（`@/hooks/useReducedMotion`）

---

### Task 1: useTaskPolling 新增 phase 输出（排队/生成区分）

**Files:**
- Modify: `frontend/src/hooks/useTaskPolling.ts`
- Test: `frontend/__tests__/useTaskPolling.test.tsx`

- [ ] **Step 1: 在测试中新增 phase 断言用例**

在 `useTaskPolling.test.tsx` 的 `fail 状态停止轮询并携带失败原因` 用例之后插入：

```tsx
it('phase 跟随轮询阶段：pending → running → done', async () => {
  mockGetStatus
    .mockResolvedValueOnce(statusResp({ status: 'pending' })) // 第一次 pending
    .mockResolvedValueOnce(statusResp({ status: 'running' })) // 第二次 running
    .mockResolvedValueOnce(statusResp({ status: 'success', images: ['https://cdn/x.png'] }));
  const { result } = renderHook(() => useTaskPolling({ intervalMs: 3000 }));

  expect(result.current.phase).toBe('idle');

  act(() => {
    result.current.start('task-1');
  });
  expect(result.current.phase).toBe('pending');
  await act(async () => {
    await Promise.resolve();
  });
  expect(result.current.phase).toBe('pending'); // 首查 pending

  await act(async () => {
    jest.advanceTimersByTime(3000);
    await Promise.resolve();
  });
  expect(result.current.phase).toBe('running'); // 二查 running

  await act(async () => {
    jest.advanceTimersByTime(3000);
    await Promise.resolve();
  });
  expect(result.current.phase).toBe('done'); // 三查 success
  expect(result.current.status).toBe('success');
});

it('stop 后 phase 回到 idle', async () => {
  mockGetStatus.mockResolvedValue(statusResp());
  const { result } = renderHook(() => useTaskPolling({ intervalMs: 3000 }));

  act(() => {
    result.current.start('task-1');
  });
  await act(async () => {
    await Promise.resolve();
  });
  act(() => {
    result.current.stop();
  });
  expect(result.current.phase).toBe('idle');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npx jest __tests__/useTaskPolling.test.tsx`
Expected: 新用例 FAIL（`phase` 为 undefined），既有用例 PASS。

- [ ] **Step 3: 实现 phase**

修改 `frontend/src/hooks/useTaskPolling.ts`：

接口（`UseTaskPollingResult`）增加字段：

```ts
export interface UseTaskPollingResult {
  status: TaskPollStatus;
  /** 轮询阶段（pending 排队 / running 生成 / done 成功；进度步进条用） */
  phase: 'idle' | 'pending' | 'running' | 'done';
  /** 最终成功结果（status=success 时非空） */
  result: GenTaskStatusResponse | null;
  /** 失败/超时/请求错误原因 */
  error: string | null;
  /** 开始轮询指定任务；已在轮询时调用会重置为新任务 */
  start: (taskId: string) => void;
  /** 主动停止（用户取消 / 组件卸载） */
  stop: () => void;
}
```

hook 内新增 state（放在 `const [error, setError] = useState...` 之后）：

```ts
const [phase, setPhase] = useState<'idle' | 'pending' | 'running' | 'done'>('idle');
```

`start` 回调开头（`clearTimer();` 之后）加：

```ts
setPhase('pending');
```

`stop` 回调（`clearTimer();` 之后）加：

```ts
setPhase('idle');
```

`pollOnce` 中 `const data = await getGenTaskStatus(taskId);` 之后、`retryCount = 0;` 之前加：

```ts
if (data.status === 'running') {
  setPhase('running');
}
```

`if (data.status === 'success')` 分支内（`setResult(data);` 之后）加：

```ts
setPhase('done');
```

返回对象加 `phase`：

```ts
return { status, phase, result, error, start, stop };
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npx jest __tests__/useTaskPolling.test.tsx`
Expected: 全部 PASS（含新用例）。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useTaskPolling.ts frontend/__tests__/useTaskPolling.test.tsx
git commit -m "feat(image-gen): 轮询 hook 暴露 phase 阶段（pending/running/done）"
```

---

### Task 2: ProgressSteps 三节点步进条（TDD）

**Files:**
- Create: `frontend/src/components/tools/image-gen/ProgressSteps.tsx`
- Test: `frontend/__tests__/progress-steps.test.tsx`

- [ ] **Step 1: 写失败测试**

创建 `frontend/__tests__/progress-steps.test.tsx`：

```tsx
import { render, screen } from '@testing-library/react';
import ProgressSteps from '@/components/tools/image-gen/ProgressSteps';

describe('ProgressSteps · 生成进度步进条', () => {
  it('渲染三节点：排队/生成/完成', () => {
    render(<ProgressSteps activeIndex={0} statusText="任务排队中…" />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('排队')).toBeInTheDocument();
    expect(screen.getByText('生成')).toBeInTheDocument();
    expect(screen.getByText('完成')).toBeInTheDocument();
  });

  it('activeIndex=0 时排队节点激活（aria-current），状态文本可被辅助技术读取', () => {
    render(<ProgressSteps activeIndex={0} statusText="任务排队中…" />);
    const active = screen.getByText('排队').closest('li');
    expect(active).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('status')).toHaveTextContent('任务排队中…');
  });

  it('activeIndex=1 时生成节点激活', () => {
    render(<ProgressSteps activeIndex={1} statusText="正在生成…" />);
    const active = screen.getByText('生成').closest('li');
    expect(active).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('排队').closest('li')).not.toHaveAttribute('aria-current');
  });

  it('activeIndex=2 时全部完成，无激活节点', () => {
    render(<ProgressSteps activeIndex={2} statusText="生成完成" />);
    expect(screen.queryByRole('listitem', { current: 'step' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npx jest __tests__/progress-steps.test.tsx`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现组件**

创建 `frontend/src/components/tools/image-gen/ProgressSteps.tsx`：

```tsx
'use client';

import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 三节点步进条：排队 → 生成 → 完成。activeIndex: 0 排队 / 1 生成 / 2 已完成 */
interface ProgressStepsProps {
  activeIndex: 0 | 1 | 2;
  /** 当前阶段描述（role=status 供辅助技术播报） */
  statusText: string;
}

const STEPS = ['排队', '生成', '完成'] as const;

/**
 * 生成过程阶段进度条：节点状态 = 完成（勾）/ 激活（旋转指示） / 未到。
 * 只动 opacity/transform；旋转动画在 reduced-motion 下由 motion-reduce 关闭。
 */
export default function ProgressSteps({ activeIndex, statusText }: ProgressStepsProps) {
  return (
    <div role="group" aria-label="生成进度" className="w-full">
      <ol className="flex items-center">
        {STEPS.map((label, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <li
              key={label}
              aria-current={isActive ? 'step' : undefined}
              className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}
            >
              <span className="flex flex-col items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-colors',
                    isDone && 'border-primary/60 bg-primary/10 text-primary',
                    isActive && 'border-primary bg-primary text-primary-foreground',
                    !isDone && !isActive && 'border-border text-muted-foreground/60'
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    'text-xs',
                    isActive
                      ? 'font-medium text-primary'
                      : isDone
                        ? 'text-foreground'
                        : 'text-muted-foreground/60'
                  )}
                >
                  {label}
                </span>
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    'mx-2 h-px flex-1 transition-colors',
                    i < activeIndex ? 'bg-primary/60' : 'bg-border'
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p role="status" className="mt-3 text-center text-sm text-muted-foreground">
        {statusText}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npx jest __tests__/progress-steps.test.tsx`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/tools/image-gen/ProgressSteps.tsx frontend/__tests__/progress-steps.test.tsx
git commit -m "feat(image-gen): 生成进度三节点步进条 ProgressSteps"
```

---

### Task 3: HistoryList 宽版历史列表（TDD）

**Files:**
- Create: `frontend/src/components/tools/image-gen/HistoryList.tsx`
- Test: `frontend/__tests__/history-list.test.tsx`

- [ ] **Step 1: 写失败测试**

创建 `frontend/__tests__/history-list.test.tsx`：

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import HistoryList from '@/components/tools/image-gen/HistoryList';
import type { GenHistoryEntry } from '@/lib/image-gen-history';

const entry: GenHistoryEntry = {
  id: 'e1',
  createdAt: Date.now() - 60_000,
  kind: 'image',
  prompt: '月光下的静谧湖泊',
  size: '1:1',
  count: 1,
  images: ['https://cdn.example.com/a.png'],
  videoUrl: null,
};

const videoEntry: GenHistoryEntry = {
  id: 'e2',
  createdAt: Date.now(),
  kind: 'video',
  prompt: '海鸥飞过灯塔',
  images: [],
  videoUrl: 'https://cdn.example.com/clip.mp4',
};

describe('HistoryList · 画布历史列表', () => {
  it('空历史显示空态提示', () => {
    render(<HistoryList entries={[]} onRestore={jest.fn()} onDelete={jest.fn()} onClear={jest.fn()} />);
    expect(screen.getByText('还没有生成记录')).toBeInTheDocument();
  });

  it('渲染条目：图片缩略图 + 提示词 + 类型/张数 + 时间', () => {
    render(<HistoryList entries={[entry]} onRestore={jest.fn()} onDelete={jest.fn()} onClear={jest.fn()} />);
    expect(screen.getByRole('img', { name: '' })).toBeInTheDocument(); // 缩略图
    expect(screen.getByText('月光下的静谧湖泊')).toBeInTheDocument();
    expect(screen.getByText('1 张')).toBeInTheDocument();
    expect(screen.getByText('1 分钟前')).toBeInTheDocument();
  });

  it('视频条目显示视频标识与播放图标占位', () => {
    render(<HistoryList entries={[videoEntry]} onRestore={jest.fn()} onDelete={jest.fn()} onClear={jest.fn()} />);
    expect(screen.getByText('视频')).toBeInTheDocument();
  });

  it('点击条目触发恢复回调', () => {
    const onRestore = jest.fn();
    render(<HistoryList entries={[entry]} onRestore={onRestore} onDelete={jest.fn()} onClear={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /恢复记录/ }));
    expect(onRestore).toHaveBeenCalledWith(entry);
  });

  it('删除与清空触发对应回调', () => {
    const onDelete = jest.fn();
    const onClear = jest.fn();
    render(<HistoryList entries={[entry]} onRestore={jest.fn()} onDelete={onDelete} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: '删除' }));
    expect(onDelete).toHaveBeenCalledWith('e1');
    fireEvent.click(screen.getByRole('button', { name: '清空' }));
    expect(onClear).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npx jest __tests__/history-list.test.tsx`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现组件**

创建 `frontend/src/components/tools/image-gen/HistoryList.tsx`（宽版；时间格式化与 GenDrawer 一致）：

```tsx
'use client';

import { Clapperboard, ImageIcon, ImageOff, RotateCcw, Trash2 } from 'lucide-react';
import type { GenHistoryEntry } from '@/lib/image-gen-history';

/** 相对时间：x 分钟前 / x 小时前 / 日期 */
function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) {return '刚刚';}
  if (diff < 3_600_000) {return `${Math.floor(diff / 60_000)} 分钟前`;}
  if (diff < 86_400_000) {return `${Math.floor(diff / 3_600_000)} 小时前`;}
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 提示词过长截断 */
function truncatePrompt(text: string): string {
  return text.length > 30 ? `${text.slice(0, 30)}…` : text;
}

interface HistoryListProps {
  entries: GenHistoryEntry[];
  onRestore: (entry: GenHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

/** 画布「历史」tab 宽版列表：点击恢复、单条删除、清空（数据源与 GenDrawer 抽屉一致） */
export default function HistoryList({ entries, onRestore, onDelete, onClear }: HistoryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <ImageOff className="h-8 w-8 text-muted-foreground/50" aria-hidden />
        <p className="text-sm text-muted-foreground">还没有生成记录</p>
        <p className="text-xs text-muted-foreground/60">生成图片或视频后会自动保存在这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">共 {entries.length} 条，点击可恢复</p>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          清空
        </button>
      </div>

      <ul className="space-y-2">
        {entries.map((entry) => {
          const first = entry.images[0];
          return (
            <li key={entry.id} className="group flex items-center gap-3 rounded-lg border border-border p-2.5">
              <button
                type="button"
                onClick={() => onRestore(entry)}
                aria-label={`恢复记录：${entry.prompt}`}
                className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {entry.kind === 'image' && first ? (
                  <span className="block h-16 w-16 overflow-hidden rounded-md border border-border">
                    <img
                      src={first}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground">
                    {entry.kind === 'video' ? (
                      <Clapperboard className="h-5 w-5" aria-hidden />
                    ) : (
                      <ImageOff className="h-5 w-5" aria-hidden />
                    )}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onRestore(entry)}
                className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block truncate text-sm text-foreground">
                  {truncatePrompt(entry.prompt)}
                </span>
                <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5">
                    {entry.kind === 'video' ? (
                      <>
                        <Clapperboard className="h-3 w-3" aria-hidden />
                        视频
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-3 w-3" aria-hidden />
                        {entry.count ?? 1} 张
                      </>
                    )}
                  </span>
                  <span>{formatTime(entry.createdAt)}</span>
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRestore(entry)}
                  aria-label="恢复"
                  title="恢复此记录"
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  aria-label="删除"
                  title="删除此记录"
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npx jest __tests__/history-list.test.tsx`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/tools/image-gen/HistoryList.tsx frontend/__tests__/history-list.test.tsx
git commit -m "feat(image-gen): 画布历史列表 HistoryList（宽版，与抽屉共用数据源）"
```

---

### Task 4: CanvasStage 画布容器（TDD）

**Files:**
- Create: `frontend/src/components/tools/image-gen/CanvasStage.tsx`
- Test: `frontend/__tests__/canvas-stage.test.tsx`

- [ ] **Step 1: 写失败测试**

创建 `frontend/__tests__/canvas-stage.test.tsx`（Lightbox 需 mock，与现有页面测试一致）：

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import CanvasStage from '@/components/tools/image-gen/CanvasStage';
import type { GenHistoryEntry } from '@/lib/image-gen-history';

jest.mock('@/components/ui/Lightbox', () => ({
  __esModule: true,
  default: () => <div data-testid="lightbox" />,
}));

const baseProps = {
  state: 'idle' as const,
  phase: 'idle' as const,
  kind: 'image' as const,
  prompt: '',
  size: '1:1',
  images: [] as string[],
  videoUrl: null as string | null,
  failedImages: new Set<string>(),
  errorMsg: '',
  history: [] as GenHistoryEntry[],
  hasResult: false,
  examplePrompts: ['月光下的湖泊', '宇航员橘猫'],
  onExampleSelect: jest.fn(),
  onRestore: jest.fn(),
  onDelete: jest.fn(),
  onClear: jest.fn(),
  onRetry: jest.fn(),
  onImageError: jest.fn(),
  onImageRetry: jest.fn(),
  activeEntryId: null,
};

describe('CanvasStage · 创作台画布', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('idle 空态：示例提示词卡片可点击填入', () => {
    const onExampleSelect = jest.fn();
    render(<CanvasStage {...baseProps} onExampleSelect={onExampleSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /月光下的湖泊/ }));
    expect(onExampleSelect).toHaveBeenCalledWith('月光下的湖泊');
  });

  it('polling + pending 阶段显示排队进度节点', () => {
    render(<CanvasStage {...baseProps} state="polling" phase="pending" />);
    expect(screen.getByText('排队')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/排队|等待/);
  });

  it('polling + running 阶段显示生成进度节点', () => {
    render(<CanvasStage {...baseProps} state="polling" phase="running" />);
    const active = screen.getByText('生成').closest('li');
    expect(active).toHaveAttribute('aria-current', 'step');
  });

  it('done 且有图片结果：渲染图片网格（可点击查看大图）', () => {
    render(
      <CanvasStage
        {...baseProps}
        state="done"
        phase="done"
        images={['https://cdn.example.com/a.png']}
        hasResult
      />
    );
    expect(screen.getByRole('button', { name: '查看生成图片 1' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看生成图片 1' }));
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
  });

  it('done 且有视频结果：渲染视频播放器与下载链接', () => {
    render(
      <CanvasStage
        {...baseProps}
        state="done"
        phase="done"
        kind="video"
        videoUrl="https://cdn.example.com/clip.mp4"
        hasResult
      />
    );
    expect(screen.getByLabelText('生成的视频')).toHaveAttribute('src', 'https://cdn.example.com/clip.mp4');
    expect(screen.getByRole('link', { name: '下载视频' })).toBeInTheDocument();
  });

  it('error 状态：role=alert 展示错误并触发重试', () => {
    const onRetry = jest.fn();
    render(<CanvasStage {...baseProps} state="error" errorMsg="生成服务调用失败" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('生成服务调用失败');
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('结果/历史 tab 可切换，历史为空显示空态', () => {
    render(<CanvasStage {...baseProps} />);
    fireEvent.click(screen.getByRole('tab', { name: '历史' }));
    expect(screen.getByText('还没有生成记录')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: '结果' }));
    expect(screen.getByText('生成结果')).toBeInTheDocument();
  });
});
```

注意：`idle` 空态需包含「生成结果」标题容器，保证 tab 切换后 `getByText('生成结果')` 可命中——见实现（tab 面板 `role="tabpanel"`，结果 tab 内嵌标题「生成结果」）。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npx jest __tests__/canvas-stage.test.tsx`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现组件**

创建 `frontend/src/components/tools/image-gen/CanvasStage.tsx`：

```tsx
'use client';

import { useMemo, useState } from 'react';
import { Clapperboard, Download, ImageIcon, ImageOff, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import EmptyState from '@/components/ui/EmptyState';
import Lightbox, { type LightboxImage } from '@/components/ui/Lightbox';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { cn } from '@/lib/utils';
import type { GenType } from '@/lib/api/imageGen';
import type { GenHistoryEntry } from '@/lib/image-gen-history';
import HistoryList from './HistoryList';
import ProgressSteps from './ProgressSteps';

/** 画幅字符串 → 结果图对应宽高比 class（未知画幅兜底方图） */
const SIZE_ASPECT: Record<string, string> = {
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
};

/** 页面生成状态机（与父组件一致） */
export type CanvasGenState = 'idle' | 'submitting' | 'polling' | 'done' | 'error';

interface CanvasStageProps {
  state: CanvasGenState;
  /** 轮询阶段（useTaskPolling.phase；polling 状态下有意义） */
  phase: 'idle' | 'pending' | 'running' | 'done';
  kind: GenType;
  prompt: string;
  size: string;
  images: string[];
  videoUrl: string | null;
  /** 加载失败的图片 URL 集合 */
  failedImages: Set<string>;
  errorMsg: string;
  history: GenHistoryEntry[];
  /** 是否有可展示结果（done 且非空） */
  hasResult: boolean;
  /** 空态灵感示例（点击填入提示词） */
  examplePrompts: string[];
  onExampleSelect: (prompt: string) => void;
  onRestore: (entry: GenHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onRetry: () => void;
  onImageError: (url: string) => void;
  onImageRetry: (url: string) => void;
  /** 结果区当前对应历史条目 id（Stagger 重挂载 key） */
  activeEntryId: string | null;
}

/**
 * 创作台画布：结果 / 历史 双 tab。
 * 结果 tab 四态：idle 灵感引导 → submitting/polling 阶段进度 → done 结果（图片网格/视频）→ error 错误重试。
 * Lightbox 预览状态内聚于此，父组件不再持有。
 */
export default function CanvasStage({
  state,
  phase,
  kind,
  prompt,
  size,
  images,
  videoUrl,
  failedImages,
  errorMsg,
  history,
  hasResult,
  examplePrompts,
  onExampleSelect,
  onRestore,
  onDelete,
  onClear,
  onRetry,
  onImageError,
  onImageRetry,
  activeEntryId,
}: CanvasStageProps) {
  const [activeTab, setActiveTab] = useState<'result' | 'history'>('result');
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      images.map((url, i) => ({
        id: `${i}`,
        src: url,
        alt: prompt.trim() || `生成图片 ${i + 1}`,
      })),
    [images, prompt]
  );

  /** 进度阶段映射：submitting=排队，polling+pending=排队，polling+running=生成，done=完成 */
  const progressIndex: 0 | 1 | 2 =
    state === 'done' ? 2 : phase === 'running' ? 1 : 0;
  const progressText =
    state === 'submitting'
      ? '正在提交任务…'
      : phase === 'running'
        ? '正在生成，请耐心等待…'
        : '任务排队中，请稍候…';

  const tabClass = (active: boolean) =>
    cn(
      'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <GlassCard padding="md" className="flex min-h-[420px] flex-col">
      {/* Tab：结果 / 历史 */}
      <div role="tablist" aria-label="画布内容" className="mb-4 flex gap-1.5 rounded-lg border border-border p-1">
        <button
          type="button"
          role="tab"
          id="canvas-tab-result"
          aria-selected={activeTab === 'result'}
          aria-controls="canvas-panel-result"
          onClick={() => setActiveTab('result')}
          className={tabClass(activeTab === 'result')}
        >
          结果
        </button>
        <button
          type="button"
          role="tab"
          id="canvas-tab-history"
          aria-selected={activeTab === 'history'}
          aria-controls="canvas-panel-history"
          onClick={() => setActiveTab('history')}
          className={tabClass(activeTab === 'history')}
        >
          历史
        </button>
      </div>

      {activeTab === 'history' ? (
        <div
          role="tabpanel"
          id="canvas-panel-history"
          aria-labelledby="canvas-tab-history"
          className="flex-1 overflow-y-auto"
        >
          <HistoryList entries={history} onRestore={onRestore} onDelete={onDelete} onClear={onClear} />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="canvas-panel-result"
          aria-labelledby="canvas-tab-result"
          className="flex-1 overflow-y-auto"
        >
          <ResultPanel
            state={state}
            phase={phase}
            kind={kind}
            prompt={prompt}
            size={size}
            images={images}
            videoUrl={videoUrl}
            failedImages={failedImages}
            errorMsg={errorMsg}
            hasResult={hasResult}
            examplePrompts={examplePrompts}
            onExampleSelect={onExampleSelect}
            onRetry={onRetry}
            onImageError={onImageError}
            onImageRetry={onImageRetry}
            activeEntryId={activeEntryId}
            progressIndex={progressIndex}
            progressText={progressText}
            onLightboxOpen={(i) => {
              setLightboxIndex(i);
              setLightboxOpen(true);
            }}
          />
        </div>
      )}

      <Lightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={() => setLightboxIndex((i) => (i + 1) % Math.max(images.length, 1))}
        onPrevious={() => setLightboxIndex((i) => (i - 1 + images.length) % Math.max(images.length, 1))}
        enableZoom
        enableDownload
      />
    </GlassCard>
  );
}

/* ---------------- 结果面板（四态） ---------------- */

interface ResultPanelProps extends Omit<CanvasStageProps, 'history' | 'onRestore' | 'onDelete' | 'onClear'> {
  progressIndex: 0 | 1 | 2;
  progressText: string;
  onLightboxOpen: (index: number) => void;
}

function ResultPanel({
  state,
  kind,
  prompt,
  size,
  images,
  videoUrl,
  failedImages,
  errorMsg,
  hasResult,
  examplePrompts,
  onExampleSelect,
  onRetry,
  onImageError,
  onImageRetry,
  activeEntryId,
  progressIndex,
  progressText,
  onLightboxOpen,
}: ResultPanelProps) {
  // 生成中：阶段进度
  if (state === 'submitting' || state === 'polling') {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center gap-6 py-16">
          <ProgressSteps activeIndex={progressIndex} statusText={progressText} />
          <p className="text-xs text-muted-foreground">
            {kind === 'video' ? '视频通常需要数分钟' : '图片通常需要十几秒'}，可先切换到历史查看之前的作品
          </p>
        </div>
      </FadeIn>
    );
  }

  // 失败：错误 + 重试
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p role="alert" className="text-sm text-error">{errorMsg}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          重试
        </button>
      </div>
    );
  }

  // 成功但无结果
  if (state === 'done' && !hasResult) {
    return (
      <FadeIn>
        <EmptyState
          icon={kind === 'video' ? Clapperboard : ImageIcon}
          title="没有生成结果"
          description="可调整提示词后重试"
          action={{
            label: '重新生成',
            icon: RefreshCw,
            onClick: onRetry,
          }}
        />
      </FadeIn>
    );
  }

  // 成功且有结果：结果标题 + 视频/图片
  if (hasResult) {
    return (
      <Stagger key={activeEntryId ?? 'fresh'}>
        <StaggerItem>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-tech-purple" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">生成结果</h2>
            {kind === 'video' ? (
              <span className="ml-auto text-xs text-muted-foreground">视频</span>
            ) : (
              <span className="ml-auto text-xs text-muted-foreground">{images.length} 张</span>
            )}
          </div>
        </StaggerItem>

        {kind === 'video' && videoUrl ? (
          <StaggerItem>
            <VideoResult url={videoUrl} />
          </StaggerItem>
        ) : null}

        {kind === 'image' && images.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((url, i) => (
              <StaggerItem key={`${url}-${i}`} className="group relative">
                {failedImages.has(url) ? (
                  <div
                    className={cn(
                      'flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 text-center text-muted-foreground',
                      SIZE_ASPECT[size] ?? 'aspect-square'
                    )}
                  >
                    <ImageOff className="h-5 w-5" aria-hidden />
                    <span className="text-xs">图片加载失败</span>
                    <button
                      type="button"
                      onClick={() => onImageRetry(url)}
                      className="rounded border border-border px-2 py-0.5 text-[11px] transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      重试加载
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onLightboxOpen(i)}
                    aria-label={`查看生成图片 ${i + 1}`}
                    className={cn(
                      'block w-full overflow-hidden rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      SIZE_ASPECT[size] ?? 'aspect-square'
                    )}
                  >
                    <img
                      src={url}
                      alt={prompt.trim() || `生成图片 ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                      onError={() => onImageError(url)}
                    />
                  </button>
                )}
              </StaggerItem>
            ))}
          </div>
        ) : null}
      </Stagger>
    );
  }

  // idle 空态：灵感引导
  return (
    <FadeIn>
      <div className="py-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">生成结果</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          还没有结果。输入提示词点击生成，或从灵感卡片开始：
        </p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {examplePrompts.map((p) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => onExampleSelect(p)}
                className="flex h-full w-full items-center gap-2 rounded-lg border border-border p-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-tech-purple" aria-hidden />
                <span className="line-clamp-2">{p}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </FadeIn>
  );
}

/* ---------------- 视频结果 ---------------- */

function VideoResult({ url }: { url: string }) {
  const [videoLoading, setVideoLoading] = useState(true);

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg border border-border">
        {videoLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5" aria-hidden>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground motion-reduce:animate-none" />
          </div>
        ) : null}
        <video
          src={url}
          controls
          preload="metadata"
          onLoadStart={() => setVideoLoading(true)}
          onCanPlay={() => setVideoLoading(false)}
          className="aspect-video w-full bg-black/5"
          aria-label="生成的视频"
        >
          您的浏览器不支持视频播放，请
          <a href={url} target="_blank" rel="noreferrer" className="underline">
            点击下载
          </a>
        </video>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <a
          href={url}
          download
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          下载视频
        </a>
        <span className="text-xs text-muted-foreground">
          视频地址为临时链接，请及时保存
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npx jest __tests__/canvas-stage.test.tsx`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/tools/image-gen/CanvasStage.tsx frontend/__tests__/canvas-stage.test.tsx
git commit -m "feat(image-gen): 创作台画布 CanvasStage（四态 + 结果/历史 tab + Lightbox 内聚）"
```

---

### Task 5: 重构 image-gen-content.tsx 接入创作台

**Files:**
- Modify: `frontend/src/app/tools/image-gen/image-gen-content.tsx`
- Test: `frontend/__tests__/image-gen-content.test.tsx`

- [ ] **Step 1: 新增交互测试用例（TDD 先行）**

在 `image-gen-content.test.tsx` 的「创建任务请求失败 → 展示错误信息」用例之后插入：

```tsx
it('输入提示词后显示字数统计与清空按钮，点击清空恢复空', () => {
  render(<ImageGenContent />);
  const textarea = screen.getByLabelText('提示词');
  fireEvent.change(textarea, { target: { value: '月光' } });
  expect(screen.getByText('2/1000')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '清空提示词' }));
  expect(textarea).toHaveValue('');
});

it('空态画布显示灵感卡片，点击填入提示词', () => {
  render(<ImageGenContent />);
  fireEvent.click(screen.getByRole('button', { name: /月光下的静谧湖泊/ }));
  expect(screen.getByLabelText('提示词')).toHaveValue('月光下的静谧湖泊');
});

it('画布 tab 可切换到历史（空历史显示空态）并切回结果', () => {
  render(<ImageGenContent />);
  fireEvent.click(screen.getByRole('tab', { name: '历史' }));
  expect(screen.getByText('还没有生成记录')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '结果' }));
  expect(screen.getByRole('tabpanel')).toBeInTheDocument();
});

it('生成中显示进度节点（排队阶段）', async () => {
  mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
  mockGetStatus.mockResolvedValue({
    task_id: 'task-1',
    status: 'running',
    images: [],
    video_url: null,
    fail_reason: null,
  });

  render(<ImageGenContent />);
  fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '一只猫' } });
  fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
  await flushPromises();
  expect(screen.getByRole('status')).toHaveTextContent(/生成/);
});

it('抽屉打开后每 30 秒自动刷新账户信息', async () => {
  render(<ImageGenContent />);
  // 打开抽屉：立即加载一次
  fireEvent.click(screen.getByRole('button', { name: '打开生成记录' }));
  fireEvent.click(screen.getByRole('button', { name: '账户' }));
  await flushPromises();
  expect(mockGetAccount).toHaveBeenCalledTimes(1);
  // 快进 30s：再次刷新
  await act(async () => {
    jest.advanceTimersByTime(30_000);
    await Promise.resolve();
  });
  expect(mockGetAccount).toHaveBeenCalledTimes(2);
  // 快进 60s：累计 4 次（30s 间隔）
  await act(async () => {
    jest.advanceTimersByTime(60_000);
    await Promise.resolve();
  });
  expect(mockGetAccount).toHaveBeenCalledTimes(4);
});
```

- [ ] **Step 2: 运行测试确认新增用例失败**

Run: `cd frontend && npx jest __tests__/image-gen-content.test.tsx`
Expected: 新增 5 个用例 FAIL（清空按钮/字数/灵感卡/tab/轮询未实现），既有用例 PASS。

- [ ] **Step 3: 重构页面（分段修改 image-gen-content.tsx）**

**3a. imports**：删除 `Lightbox` / `Stagger / StaggerItem` 中不再使用的部分，加入新组件：

```tsx
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import GenDrawer, { type AccountLoadState } from '@/components/ui/GenDrawer';
import CanvasStage from '@/components/tools/image-gen/CanvasStage';
import { FadeIn } from '@/components/motion';
import {
  createGenTask,
  getGenAccount,
  type GenType,
} from '@/lib/api/imageGen';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import {
  addHistoryEntry,
  deleteHistoryEntry,
  loadHistory,
  saveHistory,
  type GenHistoryEntry,
} from '@/lib/image-gen-history';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { X } from 'lucide-react';
```

（`FadeIn` 保留用于左列输入卡；`Stagger/StaggerItem`、`Lightbox`、`SIZE_ASPECT`、`useState` 的 lightbox 状态全部移出，`SIZE_ASPECT` 由 CanvasStage 持有。）

**3b. 常量**：保留 `SIZE_PRESETS / RUNNINGHUB_* / KIND_OPTIONS / EXAMPLE_PROMPTS`；新增视频画幅映射（供图形图标用）：

```tsx
/** 尺寸预设 → 图形图标样式（方/竖/横小矩形） */
const SIZE_SHAPE: Record<string, string> = {
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
};
```

**3c. 组件内状态**：删除 `lightboxIndex / lightboxOpen` 两个 state（迁入 CanvasStage）。

**3d. 账户 30s 轮询**：替换原「打开抽屉时自动加载」effect：

```tsx
// 抽屉打开期间每 30s 自动刷新账户（兑现 GenDrawer「每 30 秒自动刷新」文案）
useEffect(() => {
  if (!drawerOpen) {
    return;
  }
  void refreshAccount();
  const timer = window.setInterval(() => {
    void refreshAccount();
  }, 30_000);
  return () => window.clearInterval(timer);
}, [drawerOpen, refreshAccount]);
```

**3e. handleRestore**：保持不变（状态回填）。

**3f. 结果区 JSX 替换**：将右列 `space-y-6` 内从 `{state === 'done' && !hasResult ? ...}` 到 `</div>`（结果区结束）整段（含原 Lightbox 使用处）替换为：

```tsx
          {/* 右列：创作台画布（结果/历史双 tab，lg+ sticky 视口） */}
          <div className="lg:sticky lg:top-24">
            <CanvasStage
              state={state}
              phase={polling.phase}
              kind={kind}
              prompt={prompt}
              size={size}
              images={images}
              videoUrl={videoUrl}
              failedImages={failedImages}
              errorMsg={errorMsg}
              history={history}
              hasResult={hasResult}
              examplePrompts={EXAMPLE_PROMPTS}
              onExampleSelect={(p) => setPrompt(p)}
              onRestore={handleRestore}
              onDelete={handleDeleteHistory}
              onClear={handleClearHistory}
              onRetry={handleGenerate}
              onImageError={(url) => setFailedImages((prev) => new Set(prev).add(url))}
              onImageRetry={(url) =>
                setFailedImages((prev) => {
                  const next = new Set(prev);
                  next.delete(url);
                  return next;
                })
              }
              activeEntryId={activeEntryId}
            />
          </div>
```

同时删除 `hasResult`、`lightboxImages` 两个不再使用的派生值（hasResult 逻辑移入 CanvasStage，父组件不再需要；`lightboxImages` 删除）。

**3g. 类型切换滑动指示器**：在输入卡顶部类型切换处，把 `KIND_OPTIONS.map` 按钮替换为带指示器的版本：

```tsx
              <div
                role="group"
                aria-label="生成类型"
                className="relative mb-4 flex gap-1.5 rounded-lg border border-border p-1"
              >
                {kind === 'image' || kind === 'video' ? (
                  <motion.div
                    layoutId="gen-kind-indicator"
                    transition={shouldReduceMotion ? { duration: 0.1 } : { type: 'spring' as const, stiffness: 320, damping: 30 }}
                    className={cn(
                      'absolute inset-y-1 w-[calc(50%-3px)] rounded-md bg-primary',
                      kind === 'image' ? 'left-1' : 'left-[calc(50%+3px)]'
                    )}
                  />
                ) : null}
                {KIND_OPTIONS.map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => setKind(k.value)}
                    aria-pressed={kind === k.value}
                    className={cn(
                      'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      kind === k.value
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {k.value === 'video' ? (
                      <Clapperboard className="h-4 w-4" aria-hidden />
                    ) : (
                      <ImageIcon className="h-4 w-4" aria-hidden />
                    )}
                    {k.label}
                  </button>
                ))}
              </div>
```

`shouldReduceMotion` 来自 `useReducedMotion()`（组件内新增一行 `const shouldReduceMotion = useReducedMotion();`）。`layoutId` 指示器宽度用 `w-[calc(50%-3px)]` 与 `left` 定位（两个 tab 均分）；reduced-motion 时 transition 缩为 0.1s（指示器仍会瞬移，避免 layoutId 动画）。

**3h. 提示词区字数统计 + 清空**：在 textarea 下新增：

```tsx
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {prompt.length}/1000
                </span>
                {prompt.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setPrompt('')}
                    aria-label="清空提示词"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    清空
                  </button>
                ) : null}
              </div>
```

**3i. 尺寸预设图形图标**：尺寸按钮内容加小矩形示意：

```tsx
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        size === s.value
                          ? 'border-primary/60 bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'block h-3 rounded-[2px] border border-current',
                          SIZE_SHAPE[s.value]
                        )}
                        style={s.value === '1:1' ? { width: 12 } : undefined}
                      />
                      {s.label}
```

（3:4 / 4:3 由 aspect 类自然定宽于 h-3；1:1 补 width 12px。）

**3j. 生成按钮渐变**：把 `className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 ..."` 中的 `bg-primary` 替换为 `bg-gradient-to-r from-tech-cyan to-tech-sky`（文字色 `text-white` 保持 `text-primary-foreground`，深色主题下 tech 渐变仍可读；hover 加 `opacity-90` 替代原 `hover:bg-primary/90`）。完整新 className：

```
'flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-tech-cyan to-tech-sky px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60'
```

- [ ] **Step 4: 运行全部 image-gen 测试并修复兼容性断言**

Run: `cd frontend && npx jest __tests__/image-gen-content.test.tsx __tests__/useTaskPolling.test.tsx __tests__/progress-steps.test.tsx __tests__/history-list.test.tsx __tests__/canvas-stage.test.tsx`
Expected: 全部 PASS。若既有断言因结构变化失败（如查询方式），按新 DOM 结构调整断言（元素语义不变：按钮名/aria-label 均保留）。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/tools/image-gen/image-gen-content.tsx frontend/__tests__/image-gen-content.test.tsx
git commit -m "refactor(image-gen): 页面接入创作台（滑动指示器/字数清空/渐变按钮/30s 账户轮询）"
```

---

### Task 6: a11y 套件更新 + 四道闸

**Files:**
- Modify: `frontend/__tests__/a11y/image-gen.a11y.test.tsx`

- [ ] **Step 1: 更新 a11y 测试**

替换整个 describe 为（保留 3 场景 + 新增画布 tab 场景）：

```tsx
describe('图片/视频生成页无障碍', () => {
  beforeEach(() => {
    localStorage.clear();
    mockCreateTask.mockReset();
    mockGetStatus.mockReset();
  });

  it('初始状态（类型切换/提示词/尺寸/张数/生成按钮/画布灵感卡）应无严重可访问性违规', async () => {
    await expectNoA11yViolations(<ImageGenContent />);
  }, 15000);

  it('生成成功（2 张图）结果网格与结果/历史 tab 应无严重可访问性违规', async () => {
    mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
    mockGetStatus.mockResolvedValue({
      task_id: 'task-1',
      status: 'success',
      images: ['https://cdn.example.com/a.png', 'https://cdn.example.com/b.png'],
      video_url: null,
      fail_reason: null,
    });

    const { container } = render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '月光下的湖泊' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    await flushPromises();
    await screen.findByText('生成结果');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);

  it('生成失败（role=alert 错误提示）应无严重可访问性违规', async () => {
    mockCreateTask.mockRejectedValue(new Error('模型限流'));

    const { container } = render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '失败场景' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    await flushPromises();
    await screen.findByRole('alert');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);

  it('画布历史 tab 应无严重可访问性违规', async () => {
    const { container } = render(<ImageGenContent />);
    fireEvent.click(screen.getByRole('tab', { name: '历史' }));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);
});
```

- [ ] **Step 2: 跑 a11y 测试**

Run: `cd frontend && npx jest __tests__/a11y/image-gen.a11y.test.tsx`
Expected: 全部 PASS，无违规。

- [ ] **Step 3: 四道闸**

Run:
```bash
cd frontend
npm run type-check
npm run lint
npm test
npm run build
```
Expected: type-check 无错误；lint 0 error（新增 warning 需修复）；`npm test` 全绿；build 成功。若 a11y 报告 tab 违规（如 tablist 需 aria-controls 配对），按报错调整 CanvasStage 属性后重跑。

- [ ] **Step 4: Commit**

```bash
git add frontend/__tests__/a11y/image-gen.a11y.test.tsx
git commit -m "test(a11y): 创作台结构无障碍覆盖（画布 tab/进度/结果）"
```

---

### Task 7: 部署与线上验证

**Files:** 无（遵循记忆中的部署流程）

- [ ] **Step 1: 本地提交全部改动后 tar 同步**

```bash
cd E:\A_Project\my-awesome-blog
tar -czf - --exclude='node_modules' --exclude='.next' --exclude='__pycache__' --exclude='.git' --exclude='*.pyc' --exclude='.env' --exclude='.env.local' --exclude='.env.production' --exclude='venv' --exclude='.venv' --exclude='logs' --exclude='*.log' --exclude='.trae' . | ssh -o ConnectTimeout=15 root@49.234.190.85 "tar xzf - -C /opt/my-awesome-blog"
```
Expected: `SYNC OK`（echo 追加）。

- [ ] **Step 2: CRLF 修复 + nohup 重建前端（独立 ssh 命令）**

```bash
ssh root@49.234.190.85 "cd /opt/my-awesome-blog && find . -name '*.sh' -exec sed -i 's/\r\$//' {} + && nohup bash scripts/server-redeploy.sh frontend > /tmp/redeploy.log 2>&1 & echo started"
```
Expected: 输出 started；轮询 `/tmp/redeploy.log` 出现 `==== done ====`（约 2-3 分钟）。

- [ ] **Step 3: 线上验证**

```bash
ssh root@49.234.190.85 "curl -s -o /dev/null -w 'page: %{http_code}\n' http://localhost/tools/image-gen; docker exec my-awesome-blog-frontend-1 sh -c 'grep -rl progress-steps\|CanvasStage .next/static/chunks 2>/dev/null | head -2'"
```
Expected: `page: 200`；构建产物含新组件 chunk（文件名可含 `CanvasStage` 或 `ProgressSteps`）。随后浏览器人工过一遍：类型切换指示器、字数/清空、生成图片/视频、结果/历史 tab、账户 30s 刷新。

- [ ] **Step 4: 收尾提交（如有部署期调整）**

```bash
git add -A
git commit -m "chore(image-gen): 创作台部署验证"
```

---

## Self-Review

**Spec 覆盖核对**（对照 `docs/superpowers/specs/2026-08-08-image-gen-studio-design.md`）：

| 设计文档要求 | 对应任务 |
|---|---|
| 2.1 创作台布局（lg+ sticky 画布 / 移动端 min-h-[420px]） | Task 5 步骤 3f（`lg:sticky lg:top-24`）+ Task 4（GlassCard `min-h-[420px]`） |
| 2.2 类型切换滑动指示器（layoutId + reduced 回退） | Task 5 步骤 3g |
| 2.2 字数统计 + 一键清空 | Task 5 步骤 3h |
| 2.2 尺寸图形图标 / 渐变生成按钮 | Task 5 步骤 3i / 3j |
| 2.3 画布四态（空态灵感卡 / 阶段进度 / 结果 / 错误） | Task 4（ResultPanel 四态 + ProgressSteps） |
| 2.3 结果/历史 tab + 历史复用 localStorage | Task 4（tab + HistoryList）、Task 3 |
| 2.3 视频加载 spinner（onLoadStart/onCanPlay） | Task 4（VideoResult） |
| 2.4 账户 30s 自动轮询（打开启动/关闭清理） | Task 5 步骤 3d |
| 2.5 动效红线（motion 封装 / 令牌 / reduced-motion） | Task 2（motion-reduce）、Task 4（FadeIn/Stagger）、Task 5（spring 令牌） |
| 2.6 组件拆分（ProgressSteps/HistoryList/CanvasStage） | Task 2/3/4 |
| 3 测试与验证（单测/a11y/四道闸/部署） | Task 1-6 测试步骤 + Task 7 |

**Placeholder 扫描**：无 TBD/TODO；所有步骤含完整代码或精确替换说明。

**类型一致性核对**：
- `phase: 'idle' | 'pending' | 'running' | 'done'`：Task 1 定义 → Task 4 `CanvasStageProps.phase` / `progressIndex` 映射 / Task 5 `polling.phase` 传入 —— 一致。
- `CanvasStageProps` 字段：Task 5 步骤 3f 传入的 props 与 Task 4 接口逐项对应（state/phase/kind/prompt/size/images/videoUrl/failedImages/errorMsg/history/hasResult/examplePrompts/onExampleSelect/onRestore/onDelete/onClear/onRetry/onImageError/onImageRetry/activeEntryId）。
- `ResultPanelProps extends Omit<CanvasStageProps, 'history' | 'onRestore' | 'onDelete' | 'onClear'>`：Task 4 内定义即用，无跨任务引用。
- 既有 API（createGenTask 等）仅引用不改名。

**遗留风险**：
- Task 5 步骤 3g 指示器宽度依赖两个 tab 等宽（`flex-1`），文案「图片/视频」长度不同会略偏——可接受（指示器为背景色块，非精确胶囊）。若视觉偏差明显，执行时可改为 `grid grid-cols-2` 容器保证等分。
- 深色主题下 `bg-gradient-to-r from-tech-cyan to-tech-sky` 与 `text-primary-foreground` 对比：tech-cyan 深色为 `#5eead4`（浅亮），`text-primary-foreground` 深色应为深字——若对比不足，执行时在 3j 的 className 中改 `text-white`（浅色主题 tech-cyan #0ea5e9 深底白字同样达标）。以 a11y axe 结果为准。
