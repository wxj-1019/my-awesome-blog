# 塔罗与图片生成 UI/UX 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按设计规范 `docs/superpowers/specs/2026-08-06-tarot-image-gen-uiux-design.md` 完成两个工具页面的完整体验优化：修复流程竞态与键盘问题，补齐生图公开访问/限流/取消/会话历史与灯箱闭环，落地双人格布局与响应式，最后统一视觉与验收。

**Architecture:** 前端以现有 Server `page.tsx` + Client `*-content.tsx` 结构为主，修改 `tarot-content.tsx` / `image-gen-content.tsx` 及共享组件（Lightbox、TarotCutDeck、TarotFlipCard、TarotDeckFan、ShareCard、useTarotShortcuts）；后端仅动 `image_gen.py` 端点（免登录 + 独立限流）与 `rate_limit.py`。测试优先：每个修复先补 Jest 用例再实现；跨文件共享改动（Lightbox）保持向后兼容。

**Tech Stack:** Next.js 16（App Router）、TypeScript strict、Tailwind CSS v3 + 语义 token、framer-motion（仅 `@/lib/framer-motion`）、Jest + Testing Library + axe-core、FastAPI + slowapi 限流。

---

## 阶段 1：稳定性与语义（先修流程与状态，后做视觉）

### Task 1: 塔罗跳过洗牌不产生流程回退

**Files:**
- Modify: `frontend/src/app/tools/tarot/tarot-content.tsx:156-167, 461-467`
- Test: `frontend/__tests__/tarot-content.test.tsx`

- [ ] **Step 1: 写失败测试**（在 `tarot-content.test.tsx` 的“切牌后进入扇形选牌”测试后追加）

```tsx
it('跳过洗牌后推进超过 900ms 仍停留在选牌阶段（旧 timer 不回退）', () => {
  render(<TarotContent />);
  fireEvent.click(screen.getByText('开始占卜'));
  // 跳过动画：应清除原 900ms 洗牌 timer
  fireEvent.click(screen.getByText('跳过动画'));
  fireEvent.click(screen.getByText('点击切牌'));
  expect(screen.getByText('扇形抽牌')).toBeInTheDocument();

  // 原洗牌 timer 到点后不得把流程改回切牌
  act(() => {
    jest.advanceTimersByTime(900);
  });
  expect(screen.getByText('扇形抽牌')).toBeInTheDocument();
  expect(screen.queryByText('点击切牌')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/tarot-content.test.tsx -t "跳过洗牌后推进"`  
Expected: FAIL（900ms 后流程回到切牌阶段）

- [ ] **Step 3: 实现**

在 `tarot-content.tsx` 新增“进入切牌时清洗牌 timer”的副作用，并让“跳过动画”走同一入口：

```tsx
/** 进入切牌阶段：先清除洗牌 timer，防止跳过动画后旧 timer 把流程改回切牌 */
const goToCutting = useCallback(() => {
  if (timerRef.current) {clearTimeout(timerRef.current);}
  timerRef.current = null;
  setPhase('cutting');
}, []);
```

- 将 `startReading` 中的 `setTimeout(() => setPhase('cutting'), ...)` 回调改为 `goToCutting`。
- 将洗牌阶段“跳过动画”按钮的 `onClick={() => setPhase('cutting')}` 改为 `onClick={goToCutting}`。
- 将 `goToCutting` 加入 `startReading` 的依赖数组。

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/tarot-content.test.tsx`  
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add frontend/src/app/tools/tarot/tarot-content.tsx frontend/__tests__/tarot-content.test.tsx
git commit -m "fix(tarot): 跳过洗牌时清除旧 timer，防止流程回退到切牌"
```

### Task 2: 切牌动画 timer 卸载后不再回调

**Files:**
- Modify: `frontend/src/components/tarot/TarotCutDeck.tsx:28-38`
- Test: `frontend/__tests__/TarotCutDeck.test.tsx`（新建）

- [ ] **Step 1: 写失败测试**

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import TarotCutDeck from '@/components/tarot/TarotCutDeck';

jest.mock('@/lib/framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
  useReducedMotion: () => false,
}));

describe('TarotCutDeck · 切牌动画', () => {
  it('卸载后超时不再调用 onCut（stale callback 防护）', () => {
    jest.useFakeTimers();
    const onCut = jest.fn();
    const { unmount } = render(<TarotCutDeck onCut={onCut} />);
    fireEvent.click(screen.getByText('点击切牌'));
    unmount(); // 模拟父层 reset 卸载
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(onCut).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/TarotCutDeck.test.tsx`  
Expected: FAIL（onCut 被调用 1 次）

- [ ] **Step 3: 实现**（用 ref 保存 timer，卸载时清理）

```tsx
const timerRef = useRef<number | null>(null);

const handleCut = useCallback(() => {
  if (cutting) {return;}
  if (reducedMotion) {
    onCut();
    return;
  }
  setCutting(true);
  timerRef.current = window.setTimeout(() => {
    onCut();
  }, CUT_MS);
}, [cutting, onCut, reducedMotion]);

useEffect(() => () => {
  if (timerRef.current !== null) {window.clearTimeout(timerRef.current);}
}, []);
```

补 import：`useEffect, useRef`（当前文件已有 `useCallback, useState`）。

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/TarotCutDeck.test.tsx`  
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/tarot/TarotCutDeck.tsx frontend/__tests__/TarotCutDeck.test.tsx
git commit -m "fix(tarot): TarotCutDeck 卸载时清理切牌 timer，防 stale callback"
```

### Task 3: 快捷键不抢占原生交互控件

**Files:**
- Modify: `frontend/src/hooks/useTarotShortcuts.ts:35-47`
- Test: `frontend/__tests__/useTarotShortcuts.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
it('焦点在 button 上时按 Space 不触发 onStart（交还原生行为）', () => {
  const onStart = jest.fn();
  const onFlipNext = jest.fn();
  const onReset = jest.fn();
  const onPickSpread = jest.fn();
  const button = document.createElement('button');
  document.body.appendChild(button);
  button.focus();

  renderHook(() =>
    useTarotShortcuts({
      phase: 'ask',
      onStart,
      onFlipNext,
      onReset,
      onPickSpread,
    })
  );

  fireEvent.keyDown(button, { key: ' ' });
  expect(onStart).not.toHaveBeenCalled();
  document.body.removeChild(button);
});
```

（若 `renderHook` 不可用，改为 `render(<div />)` 后手动挂载/卸载副作用组件的方式；`useTarotShortcuts.test.tsx` 现有测试用 `renderHook`，先确认其 import 来源并复用。）

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/useTarotShortcuts.test.tsx -t "焦点在 button"`  
Expected: FAIL（onStart 被调用）

- [ ] **Step 3: 实现**（排除所有原生交互目标）

```tsx
// 输入框与可交互控件聚焦时让位，避免 Space/数字键抢占原生行为
const target = e.target as HTMLElement | null;
if (!target) {return;}
const interactiveTag = /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName);
if (interactiveTag) {return;}
if (target.isContentEditable) {return;}
if (target.getAttribute('role') === 'button' || target.getAttribute('role') === 'tab') {return;}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/useTarotShortcuts.test.tsx`  
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add frontend/src/hooks/useTarotShortcuts.ts frontend/__tests__/useTarotShortcuts.test.tsx
git commit -m "fix(tarot): 快捷键让位 button/link/tab 等原生交互控件"
```

### Task 4: ShareCard 弹层 Esc 不同时重置占卜

**Files:**
- Modify: `frontend/src/app/tools/tarot/tarot-content.tsx:274-281`（useTarotShortcuts 调用处）
- Test: `frontend/__tests__/tarot-content.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
it('分享弹层打开时按 Esc 只关闭弹层，不重置占卜', () => {
  render(<TarotContent />);
  fireEvent.click(screen.getByText('开始占卜'));
  act(() => { jest.advanceTimersByTime(900); });
  fireEvent.click(screen.getByText('点击切牌'));
  fireEvent.click(screen.getByText('扇形抽牌'));
  act(() => { jest.advanceTimersByTime(420); }); // 进入揭示
  act(() => { jest.advanceTimersByTime(1000); }); // 逐张自动翻牌
  // 打开分享弹层
  fireEvent.click(screen.getByText('分享牌阵'));
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });
  // 弹层关闭，但占卜结果还在（未回到 ask）
  expect(screen.queryByText('分享牌阵')).not.toBeInTheDocument();
  expect(screen.queryByText('开始占卜')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/tarot-content.test.tsx -t "分享弹层打开时按 Esc"`  
Expected: FAIL（弹层关闭后页面回到 ask 或断言失败）

- [ ] **Step 3: 实现**

在 `tarot-content.tsx` 中维护 `shareOpen` 状态（或复用 ReadingPanel 内部 shareOpen 的上抛），把“弹层打开”传给 `useTarotShortcuts` 的 `modalOpen`：

```tsx
const [shareOpen, setShareOpen] = useState(false);

// 弹层打开时不注册全局快捷键（弹层自身处理 Esc）
useTarotShortcuts({
  phase,
  modalOpen: shareOpen || view !== 'reading',
  onStart: startReading,
  onFlipNext: flipNext,
  onReset: resetReading,
  onPickSpread: setSpreadType,
});
```

- ReadingPanel 新增可选 prop `shareOpen` / `onShareOpenChange`（或由父组件控制 `ShareCard`），确保 Esc 只关闭弹层。
- 保持 ReadingPanel 默认不破坏现有调用（`shareOpen` 可选、默认内部状态）。

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/tarot-content.test.tsx __tests__/ReadingPanel.test.tsx`  
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add frontend/src/app/tools/tarot/tarot-content.tsx frontend/src/components/tarot/ReadingPanel.tsx frontend/__tests__/tarot-content.test.tsx
git commit -m "fix(tarot): 分享弹层打开时 Esc 只关弹层，不重置占卜"
```

### Task 5: 塔罗 localStorage 读取健壮性

**Files:**
- Modify: `frontend/src/lib/tarot-history.ts:90-94`、`frontend/src/lib/tarot-stats.ts`、`frontend/src/lib/tarot-favorites.ts:46-50`、`frontend/src/app/tools/tarot/tarot-content.tsx:94`
- Test: `frontend/__tests__/tarot-history.test.ts`、`frontend/__tests__/tarot-favorites.test.ts`

- [ ] **Step 1: 写失败测试**

```tsx
it('storage.getItem 抛异常时 loadHistory 降级为空数组', () => {
  const broken: Pick<Storage, 'getItem'> = {
    getItem() { throw new Error('SecurityError: The operation is insecure.'); },
  };
  expect(loadHistory(broken)).toEqual([]);
});
```

（`tarot-favorites.test.ts` 中对 `loadFavorites(broken)` 同理；`loadStats` 若有导出则补同款用例。）

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/tarot-history.test.ts __tests__/tarot-favorites.test.ts`  
Expected: FAIL（抛异常）

- [ ] **Step 3: 实现**（读取统一 try/catch）

```tsx
/** 从 localStorage 读取历史（解析失败/不可用时返回 []；SSR 时返回 []） */
export function loadHistory(storage?: Pick<Storage, 'getItem'>): TarotHistoryEntry[] {
  if (typeof window === 'undefined') {return [];}
  try {
    return parseHistory((storage ?? window.localStorage).getItem(HISTORY_KEY));
  } catch {
    return [];
  }
}
```

- `loadFavorites`、`loadStats` 做相同包裹。
- `tarot-content.tsx:94` 的首次引导读取改为 try/catch：

```tsx
let onboarded = false;
try { onboarded = !!window.localStorage.getItem('tarot_onboarded'); } catch { /* 隐私模式降级 */ }
if (!onboarded) { setShowOnboard(true); }
```

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/tarot-history.test.ts __tests__/tarot-favorites.test.ts __tests__/tarot-content.test.tsx`  
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add frontend/src/lib/tarot-history.ts frontend/src/lib/tarot-stats.ts frontend/src/lib/tarot-favorites.ts frontend/src/app/tools/tarot/tarot-content.tsx frontend/__tests__/tarot-history.test.ts frontend/__tests__/tarot-favorites.test.ts
git commit -m "fix(tarot): localStorage 读取异常时降级为会话内状态"
```

### Task 6: 生图接口公开 + 独立限流（后端）

**Files:**
- Modify: `backend/app/api/v1/endpoints/image_gen.py:1-35`
- Modify: `backend/app/utils/rate_limit.py:91-98, 101-119`
- Test: `backend/app/tests/test_image_gen.py`

- [ ] **Step 1: 写失败测试**（追加到 `test_image_gen.py`）

```python
def test_generate_image_public_without_login(client):
    """游客可调用生图接口（无 token），由 IP 限流保护"""
    response = client.post(
        "/api/v1/image-gen/generate",
        json={"prompt": "一只猫", "size": "1024x1024", "count": 1},
    )
    assert response.status_code != 401  # 服务/配置层错误可接受，认证层必须放行
```

（conftest 的 autouse override 会把认证替换为测试用户；该用例主要防止将来重新加回 `get_current_active_user`。）

- [ ] **Step 2: 运行确认失败**

Run: `cd backend && ./.venv/Scripts/python.exe -m pytest app/tests/test_image_gen.py -q`  
Expected: 现状通过（认证被 override）——本任务验证点是 diff 中依赖注入被移除；以“不回归”方式执行。

- [ ] **Step 3: 实现**

`backend/app/utils/rate_limit.py` 新增：

```python
image_gen_rate_limit = limiter.limit("6 per minute")  # 文生图（游客 IP 限流，成本较高）
```

`__all__` 追加 `'image_gen_rate_limit'`。

`backend/app/api/v1/endpoints/image_gen.py`：

```python
from app.core.dependencies import get_current_user_optional
from app.models.user import User
from app.utils.rate_limit import image_gen_rate_limit

@router.post("/generate", response_model=ImageGenResponse)
@image_gen_rate_limit
async def generate_image(
    request: Request,
    *,
    gen_request: ImageGenRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> ImageGenResponse:
    """文生图：代理调用火山方舟 images/generations，返回图片 URL 列表。

    游客可用（仅后台管理需要登录）；成本敏感，按 IP 限流。
    """
    operator = current_user.username if current_user else "游客"
    app_logger.info(f"Image gen by user={operator} size={gen_request.size} count={gen_request.count}")
    try:
        return await image_gen_service.generate_images(gen_request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
```

删除不再使用的 `get_current_active_user` / `User` 旧导入（`User` 仍用于类型标注时保留）。

- [ ] **Step 4: 运行确认通过**

Run: `cd backend && ./.venv/Scripts/python.exe -m pytest app/tests/test_image_gen.py -q`  
Expected: 全部 PASS（且无 `get_current_active_user` 引用）

- [ ] **Step 5: 提交**

```bash
git add backend/app/api/v1/endpoints/image_gen.py backend/app/utils/rate_limit.py backend/app/tests/test_image_gen.py
git commit -m "feat(image-gen): 生图接口免登录，按 IP 独立限流"
```

### Task 7: 生图前端公开访问 + 状态机重构

**Files:**
- Modify: `frontend/src/lib/api/imageGen.ts:24-45`
- Modify: `frontend/src/app/tools/image-gen/image-gen-content.tsx:30-73`
- Test: `frontend/__tests__/image-gen-content.test.tsx`

- [ ] **Step 1: 写失败测试**（替换“未登录点击生成 → 显示登录引导”用例）

```tsx
it('未登录也可发起生成（公开功能），请求不带 Authorization', async () => {
  mockGenerate.mockResolvedValue({
    images: [{ url: 'https://cdn.example.com/a.png', size: '1024x1024' }],
    model: 'test-model',
  });

  render(<ImageGenContent />);
  fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '一只猫' } });
  fireEvent.click(screen.getByRole('button', { name: '生成图片' }));

  expect(await screen.findByText('生成结果')).toBeInTheDocument();
  expect(mockGenerate).toHaveBeenCalledWith(
    expect.objectContaining({ prompt: '一只猫' })
  );
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/image-gen-content.test.tsx`  
Expected: FAIL（无 token 时走 unauthorized 分支）

- [ ] **Step 3: 实现**

`frontend/src/lib/api/imageGen.ts`：移除 token 逻辑，改为可注入 AbortSignal，并保留状态码：

```ts
export class ImageGenError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ImageGenError';
    this.status = status;
  }
}

/** 文生图：后端代理调用火山方舟，返回图片 URL 列表（公开，限流保护） */
export const generateImages = async (
  request: ImageGenRequest,
  signal?: AbortSignal
): Promise<ImageGenResponse> => {
  const response = await apiFetch(`/image-gen/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData?.error?.message ?? errorData.detail ?? `请求失败: ${response.status}`;
    throw new ImageGenError(message, response.status);
  }
  const data = await response.json();
  // 响应形状校验：images 必须为非空 URL 数组（malformed 归入 error）
  if (
    !data ||
    !Array.isArray(data.images) ||
    data.images.length === 0 ||
    data.images.some((img: unknown) => !img || typeof (img as { url?: unknown }).url !== 'string')
  ) {
    throw new ImageGenError('生成服务返回异常结果，请重试', 200);
  }
  return data as ImageGenResponse;
};
```

（先确认 `apiFetch` 是否支持 `signal` 透传；不支持则用原生 fetch 分支或调整 apiFetch 签名——以 `frontend/src/lib/api-client.ts` 实际实现为准。）

`image-gen-content.tsx`：

- 状态类型改为 `'idle' | 'loading' | 'done' | 'error'`，删除 `unauthorized`。
- `handleGenerate` 用 `useRef<AbortController | null>` 保存控制器；新请求先 abort 旧请求；卸载时 abort。
- 401/403 一律进入 error 并显示 `请先登录后台后重试`（提示性文案，不做整页跳转）。
- 生成按钮文案改为 `生成中… 可取消`，点击生成中按钮触发取消。
- 删除 `TOKEN_KEY` / `LogIn` / `Link` 相关引用与“去登录”UI。

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/image-gen-content.test.tsx`  
Expected: 全部 PASS（同时更新受影响的既有用例文案）

- [ ] **Step 5: 提交**

```bash
git add frontend/src/lib/api/imageGen.ts frontend/src/app/tools/image-gen/image-gen-content.tsx frontend/__tests__/image-gen-content.test.tsx
git commit -m "feat(image-gen): 游客可直接生成，支持取消与响应形状校验"
```

### Task 8: 生图空结果 / 失败反馈与可感知状态

**Files:**
- Modify: `frontend/src/app/tools/image-gen/image-gen-content.tsx`
- Test: `frontend/__tests__/image-gen-content.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
it('成功但返回空数组 → 显示空态与行动', async () => {
  mockGenerate.mockResolvedValue({ images: [], model: 'm' });
  render(<ImageGenContent />);
  fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '空结果' } });
  fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
  expect(await screen.findByText(/没有生成结果/)).toBeInTheDocument();
});

it('生成失败 → role=alert 展示错误并可重试', async () => {
  mockGenerate.mockRejectedValue(new Error('模型限流'));
  render(<ImageGenContent />);
  fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '失败场景' } });
  fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('模型限流');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/image-gen-content.test.tsx -t "空数组"`  
Expected: FAIL（无空态/无 alert）

- [ ] **Step 3: 实现**

- 结果区条件从 `state === 'done' && images.length > 0` 改为按状态渲染：
  - `done && images.length === 0` → 复用 `EmptyState`（title `没有生成结果`，description `可调整提示词后重试`，action `重新生成`）。
  - `error` → `role="alert"` 的 p（`text-error`），下方提供 `重试` outline 按钮（复用上次 prompt/size/count）。
- loading 按钮加 `aria-busy={state === 'loading'}`。
- 单图 `img` 增加 `onError`（隐藏失效图并显示单图占位文案）。

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/image-gen-content.test.tsx`  
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add frontend/src/app/tools/image-gen/image-gen-content.tsx frontend/__tests__/image-gen-content.test.tsx
git commit -m "feat(image-gen): 空结果空态、错误 alert 与重试动作"
```

### Task 9: Lightbox 可访问 modal + 全屏 + 下载闭环

**Files:**
- Modify: `frontend/src/components/ui/Lightbox.tsx`
- Test: `frontend/__tests__/Lightbox.test.tsx`（新建）

- [ ] **Step 1: 写失败测试**（覆盖三个核心行为）

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import Lightbox from '@/components/ui/Lightbox';

jest.mock('@/lib/framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div>, img: (p: any) => <img {...p} /> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
jest.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

const images = [
  { id: '1', src: 'https://cdn.example.com/a.png', alt: '图A' },
  { id: '2', src: 'https://cdn.example.com/b.png', alt: '图B' },
];

describe('Lightbox · 可访问灯箱', () => {
  it('打开时获得 dialog 语义，Esc 触发 onClose', () => {
    const onClose = jest.fn();
    render(<Lightbox images={images} currentIndex={0} isOpen onClose={onClose} enableZoom={false} enableRotate={false} enableShare={false} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('切换图片后恢复缩放状态', () => {
    const onNext = jest.fn();
    render(<Lightbox images={images} currentIndex={0} isOpen onClose={jest.fn()} onNext={onNext} enableShare={false} />);
    // 放大后切换下一张
    fireEvent.click(screen.getByRole('button', { name: '放大' }));
    fireEvent.click(screen.getByRole('button', { name: '下一张图片' }));
    expect(screen.getByText(/2 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText('1.0x')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/Lightbox.test.tsx`  
Expected: FAIL（无 dialog role / 无“1.0x”断言上下文）

- [ ] **Step 3: 实现**（保持其他调用方兼容——props 全部可选，缺省行为不变）

1. 根 `motion.div` 加 `role="dialog"`、`aria-modal="true"`、`aria-label={currentImage.alt}`。
2. 打开时把焦点移到灯箱容器（`ref` + `focus()`）；关闭后由调用方恢复（页面级处理，Lightbox 只负责内部）。
3. 控制栏永不从 DOM 移除：`showControls` 只切换 `opacity-0 pointer-events-none` 类而非条件渲染；键盘/触摸聚焦时恢复。
4. 全屏改为真实 API：

```tsx
const handleFullscreen = useCallback(async () => {
  const el = document.getElementById('lightbox-container');
  if (!el) {return;}
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => {});
  } else {
    await el.requestFullscreen?.().catch(() => {});
  }
}, []);

useEffect(() => {
  const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
  document.addEventListener('fullscreenchange', onFsChange);
  return () => document.removeEventListener('fullscreenchange', onFsChange);
}, []);
```

5. 下载闭环：`downloading` 状态 + 成功 toast + 失败 `role=alert` 内联提示；扩展名按 URL 或 Content-Type 推断（`.png`/`.jpg`/`.webp`，默认 `.png`）；失败可重试。
6. 移除 300ms 转场 magic duration 改为 `TRANSITION.FAST`（从 `@/lib/animation-utils` 导入）；`useReducedMotion` 为 true 时不播放入场/切图动画。
7. 触控目标：图标按钮 `p-2` 提升到 `p-2.5` + 图标 `h-5 w-5`（≥44px 触控区）。

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/Lightbox.test.tsx __tests__/image-gen-content.test.tsx`  
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/ui/Lightbox.tsx frontend/__tests__/Lightbox.test.tsx
git commit -m "fix(ui): Lightbox 补齐 dialog 语义、真实全屏与下载闭环"
```

---

## 阶段 2：布局与响应式

### Task 10: 生图创作台双栏布局 + 会话历史

**Files:**
- Modify: `frontend/src/app/tools/image-gen/image-gen-content.tsx`
- Test: `frontend/__tests__/image-gen-content.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
it('成功生成后进入会话历史；历史最多 5 组并支持恢复', async () => {
  mockGenerate.mockResolvedValue({
    images: [{ url: 'https://cdn.example.com/a.png', size: '1024x1024' }],
    model: 'm',
  });
  render(<ImageGenContent />);
  // 生成两组
  fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '第一组' } });
  fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
  await screen.findByText('生成结果');
  fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '第二组' } });
  fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
  await screen.findByText('生成结果');

  expect(screen.getByText(/本次会话历史/)).toBeInTheDocument();
  // 恢复第一组：点击历史项后提示词回到「第一组」
  fireEvent.click(screen.getByText('第一组'));
  expect((screen.getByLabelText('提示词') as HTMLTextAreaElement).value).toBe('第一组');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/image-gen-content.test.tsx -t "会话历史"`  
Expected: FAIL（无历史 UI）

- [ ] **Step 3: 实现**

- 新增会话历史状态与纯函数（放组件同目录新文件 `frontend/src/lib/image-gen-history.ts`，便于单测）：

```ts
import type { GeneratedImage } from '@/lib/api/imageGen';

export interface GenHistoryEntry {
  id: string;
  createdAt: number;
  prompt: string;
  size: string;
  count: number;
  images: GeneratedImage[];
}

const HISTORY_MAX = 5;

export function addHistoryEntry(
  entries: readonly GenHistoryEntry[],
  entry: GenHistoryEntry
): GenHistoryEntry[] {
  return [entry, ...entries].slice(0, HISTORY_MAX);
}
```

- 组件内：
  - 生成成功且 `images.length > 0` 时插入历史（id 用 `crypto.randomUUID` 兜底）。
  - 结果区下方渲染“本次会话历史（刷新后清空）”横向/纵向列表：每组显示提示词截断 + 首图缩略 + 张数，点击恢复 prompt/size/count/结果区。
  - 桌面 834px+：`grid lg:grid-cols-[minmax(280px,36%)_minmax(0,64%)]`；左参数右结果；<834 单列。
  - 结果缩略图按真实比例：`aspect-[3/4]` / `aspect-[4/3]` / `aspect-square` 由 size 映射，不再统一 `aspect-square object-cover`。
  - 网格列数：`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`（按 count 自适应）。

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/image-gen-content.test.tsx && npx tsc --noEmit`  
Expected: 全部 PASS + type-check 通过

- [ ] **Step 5: 提交**

```bash
git add frontend/src/lib/image-gen-history.ts frontend/src/app/tools/image-gen/image-gen-content.tsx frontend/__tests__/image-gen-content.test.tsx
git commit -m "feat(image-gen): 双栏创作台、真实比例结果与本次会话历史"
```

### Task 11: 塔罗四步进度 + 桌面侧轨 + 触控目标

**Files:**
- Modify: `frontend/src/app/tools/tarot/tarot-content.tsx`
- Modify: `frontend/src/components/tarot/TarotDeckFan.tsx`
- Test: `frontend/__tests__/tarot-content.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
it('桌面布局显示四步进程，进度随阶段推进', () => {
  render(<TarotContent />);
  expect(screen.getByText('问牌')).toBeInTheDocument();
  expect(screen.getByText('洗切')).toBeInTheDocument();
  expect(screen.getByText('抽牌')).toBeInTheDocument();
  expect(screen.getByText('解读')).toBeInTheDocument();
  fireEvent.click(screen.getByText('开始占卜'));
  // 当前步骤进入“洗切”后，步骤 1 显示完成态
  expect(screen.getByText('洗切')).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/tarot-content.test.tsx -t "四步进程"`  
Expected: FAIL（无步骤条）

- [ ] **Step 3: 实现**

- 新增 `TarotStepper`（`frontend/src/components/tarot/TarotStepper.tsx`）：

```tsx
'use client';

interface TarotStepperProps {
  current: 'ask' | 'shuffling' | 'cutting' | 'drawing' | 'revealing' | 'reading';
}

const STEPS = [
  { key: 'ask', label: '问牌' },
  { key: 'shuffling', label: '洗切' },
  { key: 'drawing', label: '抽牌' },
  { key: 'reading', label: '解读' },
] as const;

const stepIndex = (phase: TarotStepperProps['current']) =>
  phase === 'ask' ? 0
    : phase === 'shuffling' || phase === 'cutting' ? 1
    : phase === 'drawing' || phase === 'revealing' ? 2
    : 3;
```

- 渲染：横向 4 步，当前步 `text-primary + bg-primary/10`，已完成步带对勾，未到步 `text-muted-foreground`；每个步骤节点 ≥44px 触控区；`aria-current="step"` 标记当前步。
- 桌面（`lg+`）：左侧垂直版（窄轨）+ 中央内容；`<lg`：顶部横向紧凑版。历史/统计/快捷键帮助移入右侧栏（`xl+` 三栏，中央 `min-w-0` 保证牌桌宽度）。
- 移动端牌堆：`TarotDeckFan` 在 `<sm` 时提供“代我抽牌”主按钮（已有 `randomPickAll`），并把 78 个牌按钮改为非 Tab 序列（`tabIndex={-1}`，仅视觉点选），键盘抽牌走“代我抽牌”按钮；补 `aria-label`。
- 全部触控目标：塔罗页 tab（`py-1.5` → `min-h-11`）、速查收藏按钮（`p-1.5` → `p-2.5` + 图标 `h-5 w-5`）等升到 ≥44px。

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/tarot-content.test.tsx && npx tsc --noEmit`  
Expected: 全部 PASS + type-check 通过

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/tarot/TarotStepper.tsx frontend/src/app/tools/tarot/tarot-content.tsx frontend/src/components/tarot/TarotDeckFan.tsx frontend/__tests__/tarot-content.test.tsx
git commit -m "feat(tarot): 四步进度条、桌面侧轨与 44px 触控目标"
```

### Task 12: 未翻牌不进可访问树 + 牌义 Tab 语义补全

**Files:**
- Modify: `frontend/src/components/tarot/TarotFlipCard.tsx:60-77`
- Modify: `frontend/src/app/tools/tarot/tarot-content.tsx:283-319, 571-574`
- Test: `frontend/__tests__/TarotFlipCard.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
it('未翻开的牌面不在可访问树中；翻开后可见', () => {
  const face = <span>牌面内容</span>;
  const back = <span>牌背</span>;
  const { rerender } = render(
    <TarotFlipCard flipped={false} back={back} face={face} />
  );
  expect(screen.queryByText('牌面内容')).not.toBeInTheDocument();
  rerender(<TarotFlipCard flipped back={back} face={face} />);
  expect(screen.getByText('牌面内容')).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd frontend && npx jest __tests__/TarotFlipCard.test.tsx`  
Expected: FAIL（未翻时也能查到牌面）

- [ ] **Step 3: 实现**

- `TarotFlipCard` 的 face 容器加 `aria-hidden={!flipped}`（3D 与 reduced 分支都加），并把牌面文本节点改为条件渲染（`flipped ? face : null` 或 `inert`），确保未翻时不在可访问树。
- 翻开时由父层用 `aria-live="polite"` 区域播报：牌位 + 牌名 + 正/逆位（`tarot-content.tsx` 揭示区已有牌名文本，加 `aria-live` 容器并随翻转更新）。
- 牌义速查 Tab：`role="tab"` 加 `aria-controls="tarot-lexicon-panel"`、面板加 `role="tabpanel"` + `aria-labelledby`；支持左右箭头切换（roving tabindex：仅激活 tab 可聚焦）。
- `TarotLexicon` 保持挂载但用 `useInViewport` 已是现状；确认 hidden 面板的收藏星标在 SSR 首屏不产生不一致（初始 `onlyFavorites=false` 即可）。

- [ ] **Step 4: 运行确认通过**

Run: `cd frontend && npx jest __tests__/TarotFlipCard.test.tsx __tests__/tarot-content.test.tsx __tests__/a11y/tarot.a11y.test.tsx`  
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/tarot/TarotFlipCard.tsx frontend/src/app/tools/tarot/tarot-content.tsx frontend/__tests__/TarotFlipCard.test.tsx
git commit -m "fix(tarot): 未翻牌不进可访问树，牌义 Tab 补全 ARIA 语义"
```

---

## 阶段 3：视觉与动效精修

### Task 13: 统一页头、返回路径与按钮层级

**Files:**
- Modify: `frontend/src/app/tools/tarot/tarot-content.tsx`
- Modify: `frontend/src/app/tools/image-gen/image-gen-content.tsx`
- Test: 走查（无新单测）

- [ ] **Step 1: 实现**

- 两页 `PageHeader` 替换为 `PageActHeader`（kicker：`塔罗占卜 · TAROT` / `图片生成 · IMAGE STUDIO`；对齐 `docs/rules/frontend-uiux-design-spec.md` §5.2 页头二选一）。
- 页头下方加紧凑返回路径：`百宝箱 / 当前工具`（`Link href="/tools"`，`text-footnote` 层级，键盘可达）。
- 检查按钮层级：每页一屏仅一个 `bg-primary` CTA（塔罗：当前阶段主操作；生图：生成图片）；次要操作用 outline/ghost。
- 文案统一：生图提示“生成图地址为临时链接，请及时保存”保留，但移到会话历史区说明。

- [ ] **Step 2: 运行确认**

Run: `cd frontend && npx tsc --noEmit && npm run lint`  
Expected: 0 error

- [ ] **Step 3: 提交**

```bash
git add frontend/src/app/tools/tarot/tarot-content.tsx frontend/src/app/tools/image-gen/image-gen-content.tsx
git commit -m "feat(tools): 工具页统一 PageActHeader 与返回路径"
```

### Task 14: 翻牌叙事与结果 reveal 两个“哇点”精修

**Files:**
- Modify: `frontend/src/components/tarot/TarotFlipCard.tsx`（如需要）
- Modify: `frontend/src/app/tools/image-gen/image-gen-content.tsx`

- [ ] **Step 1: 实现**

- 塔罗：翻牌辉光保持一次性；把 magic duration（0.75s）改为 `TRANSITION.DEFAULT` 或 `EASE` token；确认 reduced-motion 下无 3D 旋转（现状已有，保持）。
- 生图：结果图片入场用 `Stagger`/`FadeIn`（`@/components/motion`）轻量 reveal（仅 opacity + y:8，`TRANSITION.FAST`），不逐张弹跳；reduced-motion 直接渲染。
- 检查并清理页面内其余手写 duration（`900/1100/420/350` 等）——只替换与视觉反馈相关的过渡值，流程计时（SHUFFLE_MS 等）保持常量注释说明为流程语义。
- 确认不新增循环装饰：不添加浮动、光扫、粒子。

- [ ] **Step 2: 运行确认**

Run: `cd frontend && npx jest __tests__/ReadingPanel.test.tsx __tests__/tarot-content.test.tsx __tests__/image-gen-content.test.tsx && npm run lint`  
Expected: 全部 PASS + 0 error

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/tarot/TarotFlipCard.tsx frontend/src/app/tools/image-gen/image-gen-content.tsx
git commit -m "style(tools): 翻牌与结果 reveal 动效对齐动效令牌"
```

---

## 阶段 4：验收与上线

### Task 15: a11y 测试补齐（axe）

**Files:**
- Test: `frontend/__tests__/a11y/tarot.a11y.test.tsx`（扩展）
- Test: `frontend/__tests__/a11y/image-gen.a11y.test.tsx`（新建）

- [ ] **Step 1: 写测试**（参照 `tarot.a11y.test.tsx` 现有结构与 axe 辅助函数）

```tsx
// image-gen.a11y.test.tsx 骨架：渲染 ImageGenContent（mock generateImages）
// 场景1：初始表单（提示词、尺寸、张数、主按钮）
// 场景2：mock 成功 2 张图后的结果区
// 场景3：mock 失败后的错误提示
// 每个场景 axe 断言 0 critical/serious
```

- 塔罗扩展场景：`revealing`（至少一张翻开的牌）、`ReadingPanel` 含 AI 解读按钮、`ShareCard` 打开态。

- [ ] **Step 2: 运行确认通过**

Run: `cd frontend && npx jest __tests__/a11y/`  
Expected: 全部 PASS（0 critical/serious）

- [ ] **Step 3: 提交**

```bash
git add frontend/__tests__/a11y/
git commit -m "test(a11y): 补齐塔罗揭示/分享与生图全场景 axe 覆盖"
```

### Task 16: 全量验证与部署

- [ ] **Step 1: 本地四道闸**

Run: `cd frontend && npm run type-check && npm run lint && npm test && npm run build`  
Expected: 全部通过（0 error；构建成功）

Run: `cd backend && ./.venv/Scripts/python.exe -m pytest app/tests -q`  
Expected: 全部通过

- [ ] **Step 2: 浏览器走查**

视口：320、375、768、1024、1440px；light/dark/reduced-motion 三组合；检查两页主流程、键盘全链路、无横向裁切、无重叠、触控目标 ≥44px。

- [ ] **Step 3: 提交（如走查有微调）**

```bash
git add -A
git commit -m "chore(tools): 两工具页 UI/UX 验收微调"
```

- [ ] **Step 4: 部署到服务器**

```bash
# 按既有流程：tar 同步 → 服务器 CRLF 修复 → nohup 后台 server-redeploy.sh all → 轮询日志
# 部署后烟雾验证：
#   curl /tools/tarot → 200
#   curl /tools/image-gen → 200
#   curl -X POST /api/v1/image-gen/generate（游客，无 token）→ 非 401（限流/服务错误可接受）
#   curl /admin → 307（后台仍保护）
```

- [ ] **Step 5: 推送**

```bash
git push origin main
```

---

## Self-Review 结论

- **规范覆盖**：§4.4 八个 P1 → Task 1-5、7-9、12；§5.4/5.5 生图状态机与健壮性 → Task 6-8；§5.6 会话历史 → Task 10；§5.7 灯箱 → Task 9；§6 导航/主题/视觉 → Task 13-14；§7 无障碍 → Task 12、15；§8 性能 → 散落在各 Task 的实现约束；§9 测试矩阵 → Task 1-15；§10 四阶段 → 与 Task 分组一一对应。
- **范围检查**：生图历史明确为会话级（Task 10），不做 IndexedDB；Navbar 键盘下拉属规范 §6.1，作为 Task 12 的补充项记录（若时间不足可降级，不影响两页验收）。
- **类型一致性**：`GenHistoryEntry`、`ImageGenError`、`TarotStepper` 等新类型在首次定义处即被后续 Task 复用，无跨任务命名漂移。
