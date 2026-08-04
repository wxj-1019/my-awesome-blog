# 深邃星空背景 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将深色主题全局氛围背景从「月夜云海」DOM 拼装重构为 canvas 渲染的深邃星空（三层星 + 慢流星 + 旋臂星系 + 紫蓝星云 + 微尘），营造遨游深空感。

**Architecture:** 抽出无 React 依赖的 `lib/starfield.ts`（canvas 渲染类，含 rAF 循环 / visibility 暂停 / reduced-motion 静态帧）；`AmbientBackground` 的 dark 分支改为挂载单个 `<canvas>` 并 `useEffect` 调用 starfield；浅色 light 分支完全不变。

**Tech Stack:** Canvas 2D API、requestAnimationFrame、ResizeObserver、Jest + Testing Library（mock canvas context）。

**Spec:** `docs/superpowers/specs/2026-07-25-deep-space-starfield-design.md`

---

## File map

| 路径 | 职责 |
|------|------|
| `frontend/src/lib/starfield.ts` | 新建：canvas 深空渲染类，无 React 依赖，可单测 |
| `frontend/src/components/visual/AmbientBackground.tsx` | 改 dark 分支为 canvas；light 分支不动 |
| `frontend/__tests__/starfield.test.ts` | 新建：渲染类单测（mock canvas context） |
| `frontend/__tests__/AmbientBackground.test.tsx` | 改：dark 断言改为 canvas；light 断言不动 |

---

### Task 1: starfield 渲染类 + 失败测试（TDD）

**Files:**
- Create: `frontend/__tests__/starfield.test.ts`
- Create: `frontend/src/lib/starfield.ts`

- [ ] **Step 1: 写失败测试**

创建 `frontend/__tests__/starfield.test.ts`：

```ts
import { createStarfield } from '@/lib/starfield';

/** 最小 canvas + 2d context mock，记录被调用的方法 */
function mockCanvas() {
  const calls: string[] = [];
  const ctx: any = {
    set fillStyle(v: string) { calls.push(`fillStyle:${v}`); },
    get fillStyle() { return ''; },
    set strokeStyle(v: string) { calls.push(`strokeStyle:${v}`); },
    get strokeStyle() { return ''; },
    set lineWidth(v: number) { calls.push(`lineWidth:${v}`); },
    get lineWidth() { return 1; },
    set globalCompositeOperation(v: string) { calls.push(`comp:${v}`); },
    get globalCompositeOperation() { return 'source-over'; },
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillRect: (...a: unknown[]) => calls.push(`fillRect:${a.length}`),
    beginPath: () => calls.push('beginPath'),
    arc: (...a: unknown[]) => calls.push(`arc:${a.length}`),
    fill: () => calls.push('fill'),
    stroke: () => calls.push('stroke'),
    moveTo: () => calls.push('moveTo'),
    lineTo: () => calls.push('lineTo'),
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    setTransform: () => calls.push('setTransform'),
    clearRect: () => calls.push('clearRect'),
  };
  const canvas: any = {
    width: 800, height: 600,
    getBoundingClientRect: () => ({ width: 800, height: 600, left: 0, top: 0 }),
    getContext: () => ctx,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  return { canvas, ctx, calls };
}

describe('createStarfield', () => {
  beforeAll(() => {
    // jsdom 无 ResizeObserver / requestAnimationFrame / devicePixelRatio
    (globalThis as any).ResizeObserver = class {
      observe() {} unobserve() {} disconnect() {}
    };
    (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
      0 as unknown as number;
    (globalThis as any).cancelAnimationFrame = () => {};
    (globalThis as any).devicePixelRatio = 1;
  });

  it('返回 start/stop/resize/drawStatic 控制接口', () => {
    const { canvas } = mockCanvas();
    const sf = createStarfield(canvas);
    expect(typeof sf.start).toBe('function');
    expect(typeof sf.stop).toBe('function');
    expect(typeof sf.resize).toBe('function');
    expect(typeof sf.drawStatic).toBe('function');
  });

  it('start 与 stop 幂等，不抛错', () => {
    const { canvas } = mockCanvas();
    const sf = createStarfield(canvas);
    expect(() => { sf.start(); sf.start(); sf.stop(); sf.stop(); }).not.toThrow();
  });

  it('drawStatic 绘制底色与星点（调用 fillRect 与 arc）', () => {
    const { canvas, calls } = mockCanvas();
    const sf = createStarfield(canvas);
    sf.drawStatic();
    expect(calls).toContain('fillRect:4');
    expect(calls.filter((c) => c.startsWith('arc:')).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx jest __tests__/starfield.test.ts --no-coverage
```

Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `frontend/src/lib/starfield.ts`**

```ts
/**
 * 深邃星空 canvas 渲染器（深色主题全局背景）。
 * 无 React 依赖；由 AmbientBackground 在 useEffect 中挂载。
 * 元素：底色渐变 + 三层星（远/中/近）+ 慢流星 + 旋臂星系 + 紫蓝星云 + 上浮微尘。
 */

export interface StarfieldOptions {
  reducedMotion?: boolean;
}

interface Star {
  x: number; y: number; r: number; tw: number; ts: number;
}
interface Meteor {
  x: number; y: number; len: number; sp: number; life: number; max: number;
}
interface Dust {
  x: number; y: number; r: number; sp: number; a: number; ph: number;
}

const STAR_COUNTS = { far: 75, mid: 42, near: 18 };
const DUST_COUNT = 22;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function makeStars(n: number, w: number, h: number, rMin: number, rMax: number): Star[] {
  const arr: Star[] = [];
  for (let i = 0; i < n; i++) {
    arr.push({
      x: rand(0, w), y: rand(0, h),
      r: rand(rMin, rMax),
      tw: rand(0, Math.PI * 2), ts: rand(0.5, 2),
    });
  }
  return arr;
}

function makeDust(w: number, h: number): Dust[] {
  const arr: Dust[] = [];
  for (let i = 0; i < DUST_COUNT; i++) {
    arr.push({
      x: rand(0, w), y: rand(0, h),
      r: rand(0.4, 1), sp: rand(0.08, 0.2),
      a: rand(0.15, 0.35), ph: rand(0, Math.PI * 2),
    });
  }
  return arr;
}

export interface Starfield {
  start(): void;
  stop(): void;
  resize(): void;
  drawStatic(): void;
}

export function createStarfield(
  canvas: HTMLCanvasElement,
  options: StarfieldOptions = {},
): Starfield {
  const ctx = canvas.getContext('2d');
  const reduced = options.reducedMotion ?? false;
  let rafId = 0;
  let running = false;
  let t = 0;
  let W = 0;
  let H = 0;
  let far: Star[] = [];
  let mid: Star[] = [];
  let near: Star[] = [];
  let dust: Dust[] = [];
  const meteors: Meteor[] = [];

  function fitSize(): void {
    const dpr = Math.max(1, Math.min(2, (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1));
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rebuild(): void {
    fitSize();
    far = makeStars(STAR_COUNTS.far, W, H, 0.5, 1.1);
    mid = makeStars(STAR_COUNTS.mid, W, H, 0.8, 1.7);
    near = makeStars(STAR_COUNTS.near, W, H, 1.2, 2.6);
    dust = makeDust(W, H);
  }

  function drawBackground(): void {
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#040816');
    g.addColorStop(1, '#0a1228');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawStars(stars: Star[], baseColor: string): void {
    if (!ctx) return;
    for (const s of stars) {
      const a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.02 * s.ts + s.tw));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${baseColor},${a})`;
      ctx.fill();
    }
  }

  function spawnMeteor(): void {
    meteors.push({
      x: rand(0, W), y: rand(0, H * 0.45),
      len: rand(70, 110), sp: rand(0.6, 0.9),
      life: 0, max: rand(180, 220),
    });
  }

  function drawMeteors(): void {
    if (!ctx || reduced) return;
    if (Math.random() < 0.0035 && meteors.length < 1) spawnMeteor();
    for (const m of meteors) {
      m.life++;
      m.x -= m.sp * 2;
      m.y += m.sp * 0.55;
      const fade = m.life < 20 ? m.life / 20 : m.life > m.max - 30 ? (m.max - m.life) / 30 : 1;
      const grad = ctx.createLinearGradient(m.x, m.y, m.x + m.len, m.y - m.len * 0.28);
      grad.addColorStop(0, `rgba(255,255,255,${0.85 * fade})`);
      grad.addColorStop(0.4, `rgba(210,225,255,${0.4 * fade})`);
      grad.addColorStop(1, 'rgba(200,210,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x + m.len, m.y - m.len * 0.28);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${fade})`;
      ctx.fill();
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      if (meteors[i].life >= meteors[i].max) meteors.splice(i, 1);
    }
  }

  function drawGalaxy(): void {
    if (!ctx) return;
    const cx = W * 0.72;
    const cy = H * 0.68;
    const R = Math.min(W, H) * 0.22;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 60; i++) {
        const f = i / 60;
        const ang = f * Math.PI * 3 + arm * Math.PI + t * 0.0008;
        const rr = R * (0.15 + f * 0.85);
        const x = cx + Math.cos(ang) * rr + Math.sin(ang * 2) * 4;
        const y = cy + Math.sin(ang) * rr * 0.55;
        const a = 0.06 * (1 - f) * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + f * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,205,255,${a})`;
        ctx.fill();
      }
    }
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.4);
    rg.addColorStop(0, 'rgba(220,225,255,0.10)');
    rg.addColorStop(1, 'rgba(220,225,255,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawNebula(): void {
    if (!ctx) return;
    const clouds = [
      { x: 0.2, y: 0.3, r: 90, c: '120,90,200' },
      { x: 0.45, y: 0.55, r: 110, c: '70,110,190' },
    ];
    for (let i = 0; i < clouds.length; i++) {
      const cl = clouds[i];
      const ph = Math.sin(t * 0.003 + i);
      const cx = cl.x * W + Math.cos(t * 0.002 + i) * 14;
      const cy = cl.y * H + Math.sin(t * 0.0025 + i) * 10;
      const a = 0.06 + 0.03 * (0.5 + 0.5 * ph);
      const rad = Math.max(20, cl.r + ph * 10);
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      rg.addColorStop(0, `rgba(${cl.c},${a})`);
      rg.addColorStop(1, `rgba(${cl.c},0)`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDust(): void {
    if (!ctx || reduced) return;
    for (const d of dust) {
      d.y -= d.sp;
      if (d.y < -4) d.y = H + 4;
      const x = d.x + Math.sin(t * 0.01 + d.ph) * 6;
      ctx.beginPath();
      ctx.arc(x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,215,255,${d.a})`;
      ctx.fill();
    }
  }

  function frame(): void {
    if (!ctx) return;
    t++;
    drawBackground();
    drawStars(far, '230,235,255');
    drawStars(mid, '230,235,255');
    drawStars(near, '200,210,255');
    drawNebula();
    drawGalaxy();
    drawMeteors();
    drawDust();
    if (running) rafId = requestAnimationFrame(frame);
  }

  function drawStatic(): void {
    if (!ctx) return;
    t = 0;
    if (W === 0) rebuild();
    drawBackground();
    // 静态中等亮度
    for (const s of [...far, ...mid, ...near]) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,235,255,0.6)`;
      ctx.fill();
    }
    drawNebula();
    drawGalaxy();
  }

  return {
    start() {
      if (running) return;
      if (W === 0) rebuild();
      running = true;
      if (reduced) {
        drawStatic();
        running = false;
        return;
      }
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
    resize() {
      rebuild();
    },
    drawStatic() {
      drawStatic();
    },
  };
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
cd frontend && npx jest __tests__/starfield.test.ts --no-coverage
```

Expected: PASS（3 tests）

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/starfield.ts frontend/__tests__/starfield.test.ts
git commit -m "feat(background): starfield canvas 渲染器 + 单测"
```

---

### Task 2: AmbientBackground dark 分支改用 canvas

**Files:**
- Modify: `frontend/src/components/visual/AmbientBackground.tsx`

- [ ] **Step 1: 替换 dark 分支为 canvas 挂载**

将整个文件改为（保留 light 分支全部现有代码，仅 dark 分支替换为 canvas；下面给出关键改动，light 分支 DOM 原样保留）：

文件顶部 import 区增加：

```ts
import { useEffect, useRef } from 'react';
import { createStarfield, type Starfield } from '@/lib/starfield';
```

在组件函数体内（`mode` 计算之后、`return` 之前）加：

```ts
const canvasRef = useRef<HTMLCanvasElement>(null);
const sfRef = useRef<Starfield | null>(null);

useEffect(() => {
  if (mode !== 'dark') return;
  const canvas = canvasRef.current;
  if (!canvas) return;
  const sf = createStarfield(canvas, { reducedMotion });
  sfRef.current = sf;
  sf.start();

  const onResize = () => sf.resize();
  const onVis = () => {
    if (document.hidden) sf.stop();
    else sf.start();
  };
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);

  return () => {
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
    sf.stop();
    sfRef.current = null;
  };
}, [mode, reducedMotion]);
```

将 `{mode === 'dark' ? ( ... ) : ( ... )` 三元里的 **dark 分支**（原「月夜云海」整段 JSX）替换为：

```tsx
<div className="absolute inset-0" data-ambient-world="dark">
  <canvas
    ref={canvasRef}
    aria-hidden
    className="absolute inset-0 h-full w-full"
  />
  {/* 中部提亮暗角：保证正文/卡片可读 */}
  <div
    className="absolute inset-0"
    style={{
      background:
        'radial-gradient(ellipse 130% 100% at 50% 42%, transparent 58%, rgba(6, 14, 26, 0.3) 100%)',
    }}
  />
</div>
```

**注意：** light 分支（`<div className="absolute inset-0" data-ambient-world="light">…</div>`）原样保留，不动。原 dark 专用的 `<style jsx>` keyframes（moon-soft/cloud-slow/star-twinkle/meteor-fall 等）可保留在 `<style jsx>` 内不影响（light 仍用其中部分），或仅删除 dark 专用且 light 不引用的类；为最小改动，**全部保留** `<style jsx>` 块不删。

- [ ] **Step 2: type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/visual/AmbientBackground.tsx
git commit -m "feat(background): dark 分支改用 starfield canvas"
```

---

### Task 3: 更新 AmbientBackground 测试（dark 断言改为 canvas）

**Files:**
- Modify: `frontend/__tests__/AmbientBackground.test.tsx`

- [ ] **Step 1: 改 dark 测试用例的断言**

将 `'renders moonlit world when dark'` 用例改为：

```ts
  it('renders deep-space canvas when dark', () => {
    const { container } = render(<AmbientBackground />);
    expect(container.querySelector('[data-ambient-mode="dark"]')).toBeInTheDocument();
    expect(container.querySelector('[data-ambient-world="dark"]')).toBeInTheDocument();
    expect(container.querySelector('[data-ambient-world="light"]')).not.toBeInTheDocument();
    // 深空 canvas 渲染（替代原月夜云海 DOM 拼装）
    expect(container.querySelector('[data-ambient-world="dark"] canvas')).toBeInTheDocument();
    // 旧的月夜云海元素已移除
    expect(container.querySelector('[data-moon]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-meteor]')).not.toBeInTheDocument();
    expect(container.querySelector('.star-twinkle')).not.toBeInTheDocument();
    // 全站层不挂气泡
    expect(container.querySelector('[data-testid="bubble-field"]')).not.toBeInTheDocument();
  });
```

light 用例（`'renders dawn forest world when light'`）**不动**。

- [ ] **Step 2: 跑测试**

```bash
cd frontend && npx jest __tests__/AmbientBackground.test.tsx --no-coverage
```

Expected: PASS（2 tests）

- [ ] **Step 3: 全量测试 + type-check**

```bash
cd frontend && npx tsc --noEmit && npx jest --no-coverage
```

Expected: tsc exit 0；全部测试绿

- [ ] **Step 4: Commit**

```bash
git add frontend/__tests__/AmbientBackground.test.tsx
git commit -m "test(background): dark 断言改为 canvas"
```

---

### Task 4: 手动冒烟 + 合并 + 部署

- [ ] **Step 1: 本地冒烟**

```bash
cd frontend && npm run dev
```

深色模式打开任意公开页（如 `/`、`/articles`、`/tools/skills/taste`）：
- 三层星 + 星系 + 星云 + 微尘可见
- 约 20–30s 出现一颗慢流星
- 中部内容区可读（卡片不被星点干扰）
- 浅色模式仍是林间晨光（未变）
- 系统切「减少动态效果」：背景为静态深空，无流星/微尘

- [ ] **Step 2: 合并 main 并推送**

```bash
git checkout main
git merge feat/deep-space-starfield
git push origin main
```

- [ ] **Step 3: 部署前端**

仓库根同步代码 + `bash scripts/server-redeploy.sh frontend`。

- [ ] **Step 4: 生产验证**

`http://49.234.190.85/` 深色模式确认深邃星空生效。

---

## Spec coverage checklist

| 规格要求 | 任务 |
|----------|------|
| 三层星（远/中/近） | Task 1 `makeStars` + `drawStars` |
| 慢流星（低频长拖尾） | Task 1 `spawnMeteor`/`drawMeteors` |
| 旋臂星系 | Task 1 `drawGalaxy` |
| 紫蓝星云 | Task 1 `drawNebula` |
| 上浮微尘 | Task 1 `drawDust` |
| canvas 单元素渲染 | Task 2 dark 分支 |
| reduced-motion 静态帧 | Task 1 `start` reduced 分支 + `drawStatic` |
| 页面隐藏暂停 rAF | Task 2 `visibilitychange` |
| 中部暗角可读性 | Task 2 radial-gradient |
| 浅色不变 | Task 2/3 明确不动 light |
| 测试 | Task 1（starfield）+ Task 3（AmbientBackground） |

## Placeholder scan

无 TBD/TODO；每个代码步骤均含完整代码；无「类似 Task N」省略。

## Type consistency

- `createStarfield(canvas, options?: { reducedMotion?: boolean }): Starfield`
- `Starfield` 接口：`start() / stop() / resize() / drawStatic()`
- mock canvas 的 setter/getter 成对（`fillStyle`/`strokeStyle`/`lineWidth`/`globalCompositeOperation`），避免 TS 报只读
