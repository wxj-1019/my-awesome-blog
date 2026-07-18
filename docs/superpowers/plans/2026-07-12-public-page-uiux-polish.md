# Public Page UI/UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve non-home, non-music public page UI/UX by unifying page headers, reducing excessive motion, and making core interactions feel cleaner and more consistent.

**Architecture:** Add one shared `PageHeader` component and reuse it across articles, albums, videos, and messages. Keep page behavior intact while reducing heavyweight decorative elements and making motion opt-in or lower intensity. Avoid touching the homepage, music route, backend APIs, and admin pages.

**Tech Stack:** Next.js 16 App Router, React 18, TypeScript strict mode, Tailwind CSS, existing `cn()` utility, existing UI primitives.

---

## File Structure

- Create: `frontend/src/components/layout/PageHeader.tsx`
  - Shared public page header with title, description, optional icon, optional action, and consistent glass/tech visual style.

- Modify: `frontend/src/components/ui/Button.tsx`
  - Add optional `enableRipple?: boolean`; default false to reduce unnecessary state updates on high-frequency buttons.

- Modify: `frontend/src/components/ui/GlassCard.tsx`
  - Normalize radius, shadow, hover movement, and transition intensity while keeping existing props.

- Modify: `frontend/src/app/articles/articles-content.tsx`
  - Replace cyber-styled title block with `PageHeader`; keep current article data behavior.

- Modify: `frontend/src/app/albums/albums-content.tsx`
  - Replace large ImageTrail hero with `PageHeader`; keep filters, gallery, cards, and lightbox behavior.

- Modify: `frontend/src/app/videos/videos-content.tsx`
  - Replace Lottie-heavy hero with `PageHeader` plus compact stats strip; keep video list and add/progress modals.

- Modify: `frontend/src/app/messages/messages-content.tsx`
  - Add `PageHeader`; reduce default danmaku density and motion intensity; keep message creation/list behavior.

- Verify only; do not modify unless tests fail: `frontend/src/app/music/*`, `frontend/src/app/page.tsx`.

---

### Task 1: Add Shared PageHeader

**Files:**
- Create: `frontend/src/components/layout/PageHeader.tsx`

- [ ] **Step 1: Create the shared component**

Create `frontend/src/components/layout/PageHeader.tsx` with this content:

```tsx
import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  align?: 'left' | 'center';
}

export default function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  action,
  align = 'center',
  className,
  ...props
}: PageHeaderProps) {
  const isCentered = align === 'center';

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-macos-2xl border border-glass-border bg-glass/30 backdrop-blur-xl shadow-macos-glass-2',
        'px-5 py-8 sm:px-8 sm:py-10 lg:px-10',
        className
      )}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tech-cyan/60 to-transparent" />
      <div
        className={cn(
          'relative z-10 flex flex-col gap-5',
          isCentered ? 'items-center text-center' : 'items-start text-left lg:flex-row lg:items-center lg:justify-between'
        )}
      >
        <div className={cn('max-w-3xl', isCentered && 'mx-auto')}>
          {(eyebrow || Icon) && (
            <div className={cn('mb-4 flex items-center gap-2 text-sm font-medium text-tech-cyan', isCentered && 'justify-center')}>
              {Icon && (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-macos-md border border-tech-cyan/20 bg-tech-cyan/10">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
              {eyebrow && <span>{eyebrow}</span>}
            </div>
          )}
          <h1 className="font-display text-3xl font-bold tracking-normal text-foreground sm:text-4xl lg:text-title-1">
            {title}
          </h1>
          {description && (
            <p className={cn('mt-3 text-base leading-7 text-muted-foreground sm:text-lg', isCentered && 'mx-auto max-w-2xl')}>
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run TypeScript for the new file**

Run:

```bash
cd frontend
npx tsc --noEmit
```

Expected: command exits with code 0.

---

### Task 2: Make Button Ripple Optional

**Files:**
- Modify: `frontend/src/components/ui/Button.tsx`

- [ ] **Step 1: Update Button props and click logic**

Replace the `ButtonProps` interface and component body with this version, preserving the existing `buttonVariants` declaration:

```tsx
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  enableRipple?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, enableRipple = false, children, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
    const rippleIdRef = React.useRef(0);

    React.useImperativeHandle(ref, () => buttonRef.current!);

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);

      if (!enableRipple) {
        return;
      }

      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;

      setRipples(prev => [...prev, { id, x, y }]);

      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== id));
      }, 600);
    }, [enableRipple, onClick]);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={asChild ? undefined : buttonRef}
        onClick={handleClick}
        {...(asChild ? {} : { type: 'button' })}
        {...props}
      >
        {children}
        {enableRipple && ripples.map(ripple => (
          <span
            key={ripple.id}
            className="button-ripple"
            style={{
              '--ripple-x': `${ripple.x}px`,
              '--ripple-y': `${ripple.y}px`,
            } as React.CSSProperties}
          />
        ))}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
export { Button, buttonVariants };
```

- [ ] **Step 2: Run lint and type-check**

Run:

```bash
cd frontend
npx eslint src/components/ui/Button.tsx --ext .ts,.tsx
npx tsc --noEmit
```

Expected: both commands exit with code 0.

---

### Task 3: Normalize GlassCard Motion

**Files:**
- Modify: `frontend/src/components/ui/GlassCard.tsx`

- [ ] **Step 1: Reduce hover intensity and normalize shape**

In `GlassCard.tsx`, replace the `className={cn(...)}` block inside the returned `<div>` with:

```tsx
className={cn(
  'rounded-macos-lg border border-glass-border bg-glass/30 shadow-macos-glass-1 transition-[transform,box-shadow,border-color] duration-200 ease-out',
  'backdrop-blur-xl',
  paddingClasses[padding],
  isLight ? [
    'text-foreground',
    hoverEffect && 'hover:-translate-y-0.5 hover:border-tech-cyan/30 hover:shadow-macos-glass-2 cursor-pointer',
    glowEffect && 'hover:shadow-[0_0_20px_rgba(59,130,246,0.16)]',
  ] : [
    'text-foreground',
    hoverEffect && 'hover:-translate-y-0.5 hover:border-tech-cyan/30 hover:shadow-macos-glass-2 cursor-pointer',
    glowEffect && 'hover:shadow-[0_0_22px_var(--shadow-tech-cyan)]',
  ],
  className
)}
```

- [ ] **Step 2: Run component type-check**

Run:

```bash
cd frontend
npx tsc --noEmit
```

Expected: command exits with code 0.

---

### Task 4: Unify Articles List Header

**Files:**
- Modify: `frontend/src/app/articles/articles-content.tsx`

- [ ] **Step 1: Add PageHeader import**

Add these imports near the top:

```tsx
import { BookOpen } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
```

- [ ] **Step 2: Remove unused GlitchText import**

Remove this import:

```tsx
import GlitchText from '@/components/ui/GlitchText';
```

- [ ] **Step 3: Replace the cyber title block**

Replace this block:

```tsx
<div className="pt-20 pb-10 text-center">
  <GlitchText text="ARTICLES" size="lg" className="mb-4 font-display" />
  <p className="text-gray-400 font-mono text-sm tracking-widest uppercase">
    Explore digital frontier
  </p>
</div>
```

With:

```tsx
<div className="container mx-auto px-4 pt-24 pb-8">
  <PageHeader
    icon={BookOpen}
    eyebrow="Articles"
    title="文章"
    description="沉淀技术实践、设计思考和项目复盘，按分类与标签快速筛选阅读。"
  />
</div>
```

- [ ] **Step 4: Run lint/type-check**

Run:

```bash
cd frontend
npx eslint src/app/articles/articles-content.tsx --ext .ts,.tsx
npx tsc --noEmit
```

Expected: both commands exit with code 0.

---

### Task 5: Simplify Albums Hero

**Files:**
- Modify: `frontend/src/app/albums/albums-content.tsx`

- [ ] **Step 1: Add PageHeader import**

Add:

```tsx
import PageHeader from '@/components/layout/PageHeader';
```

- [ ] **Step 2: Remove ImageTrail import**

Remove:

```tsx
import ImageTrail from '@/components/ui/ImageTrail';
```

- [ ] **Step 3: Replace the large hero block**

Replace the first `motion.div` under `<div className="container mx-auto px-4">` that contains `ImageTrail` and the `我的相册` heading with:

```tsx
<motion.div
  initial={{ opacity: 0, y: -12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.25 }}
  className="mb-8"
>
  <PageHeader
    icon={Camera}
    eyebrow="Albums"
    title="相册"
    description="整理摄影作品、旅行记录和生活瞬间，用更轻量的浏览体验聚焦图片本身。"
  />
</motion.div>
```

- [ ] **Step 4: Change page background to token-based background**

Replace:

```tsx
<div className="min-h-screen bg-gradient-to-br from-tech-darkblue via-tech-deepblue to-tech-cyan pb-16 pt-24">
```

With:

```tsx
<div className="min-h-screen bg-background pb-16 pt-24 text-foreground">
```

- [ ] **Step 5: Run lint/type-check**

Run:

```bash
cd frontend
npx eslint src/app/albums/albums-content.tsx --ext .ts,.tsx
npx tsc --noEmit
```

Expected: both commands exit with code 0.

---

### Task 6: Simplify Videos Hero

**Files:**
- Modify: `frontend/src/app/videos/videos-content.tsx`

- [ ] **Step 1: Add PageHeader import**

Add:

```tsx
import PageHeader from '@/components/layout/PageHeader';
```

- [ ] **Step 2: Remove LottieAnimation import**

Remove:

```tsx
import LottieAnimation from '@/components/ui/LottieAnimation';
```

- [ ] **Step 3: Replace title and Lottie hero with PageHeader + compact stats**

Replace the `<div className="text-center mb-8">...</div>` and the following hero `<div className="relative overflow-hidden rounded-2xl ...">...</div>` with:

```tsx
<PageHeader
  icon={Film}
  eyebrow="Videos"
  title="视频收藏"
  description="记录电影、剧集和动漫的观看进度，把收藏、状态和下一步观看计划放在同一个清晰视图里。"
  align="left"
  action={
    <Button
      onClick={() => setIsAddModalOpen(true)}
      className="bg-tech-cyan text-black hover:bg-tech-lightcyan"
    >
      <Plus className="mr-2 h-4 w-4" />
      添加收藏
    </Button>
  }
/>

<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
  <div className="rounded-macos-lg border border-glass-border bg-glass/30 p-4 backdrop-blur-xl">
    <p className="text-sm text-muted-foreground">在看</p>
    <p className="mt-1 text-2xl font-bold text-foreground">{stats.watching}</p>
  </div>
  <div className="rounded-macos-lg border border-glass-border bg-glass/30 p-4 backdrop-blur-xl">
    <p className="text-sm text-muted-foreground">已完成</p>
    <p className="mt-1 text-2xl font-bold text-foreground">{stats.completed}</p>
  </div>
  <div className="rounded-macos-lg border border-glass-border bg-glass/30 p-4 backdrop-blur-xl">
    <p className="text-sm text-muted-foreground">计划</p>
    <p className="mt-1 text-2xl font-bold text-foreground">{stats.plan}</p>
  </div>
  <div className="rounded-macos-lg border border-glass-border bg-glass/30 p-4 backdrop-blur-xl">
    <p className="text-sm text-muted-foreground">总观看</p>
    <p className="mt-1 text-2xl font-bold text-foreground">{formatWatchTime(stats.totalWatchTime)}</p>
  </div>
</div>
```

- [ ] **Step 4: Tone down page background**

Replace:

```tsx
<div className="min-h-screen py-8 sm:py-12 bg-gradient-to-br from-tech-darkblue/20 via-tech-deepblue/10 to-tech-cyan/5">
```

With:

```tsx
<div className="min-h-screen bg-background py-24 text-foreground sm:py-28">
```

- [ ] **Step 5: Run lint/type-check**

Run:

```bash
cd frontend
npx eslint src/app/videos/videos-content.tsx --ext .ts,.tsx
npx tsc --noEmit
```

Expected: both commands exit with code 0.

---

### Task 7: Add Messages PageHeader and Reduce Danmaku Noise

**Files:**
- Modify: `frontend/src/app/messages/messages-content.tsx`

- [ ] **Step 1: Add PageHeader import**

Add:

```tsx
import PageHeader from '@/components/layout/PageHeader';
```

The file already imports `MessageSquare`, so reuse that icon.

- [ ] **Step 2: Reduce danmaku density**

In `DANMAKU_CONFIG`, change the values to:

```tsx
const DANMAKU_CONFIG = {
  maxOnScreen: 12,
  minBatchSize: 1,
  maxBatchSize: 2,
  minBatchInterval: 900,
  maxBatchInterval: 2200,
  burstChance: 0.05,
  burstSize: { min: 2, max: 3 },
  quietAfterBurst: { min: 2600, max: 4600 },
  trackCount: 6,
  minDuration: 10,
  maxDuration: 18,
};
```

- [ ] **Step 3: Insert PageHeader near the top of returned content**

Find the main page container returned by `MessagesPageContent`. Immediately inside the top-level content wrapper, add:

```tsx
<PageHeader
  icon={MessageSquare}
  eyebrow="Messages"
  title="留言板"
  description="留下想法、反馈和问候。弹幕作为轻量氛围层存在，主要阅读和交流仍以留言列表为中心。"
  className="mb-8"
/>
```

- [ ] **Step 4: Keep rainbow mode off by default**

Confirm this line remains unchanged:

```tsx
const [rainbowMode, setRainbowMode] = useState(false);
```

- [ ] **Step 5: Run lint/type-check**

Run:

```bash
cd frontend
npx eslint src/app/messages/messages-content.tsx --ext .ts,.tsx
npx tsc --noEmit
```

Expected: both commands exit with code 0.

---

### Task 8: Full Verification

**Files:**
- Verify: frontend app

- [ ] **Step 1: Run frontend lint**

Run:

```bash
cd frontend
npx eslint . --ext .ts,.tsx
```

Expected: exits with code 0. Existing warnings are acceptable only if the command exits successfully.

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
cd frontend
npx tsc --noEmit
```

Expected: exits with code 0.

- [ ] **Step 3: Run production build**

Run:

```bash
cd frontend
npx next build
```

Expected: build completes successfully.

- [ ] **Step 4: Confirm excluded routes were not changed**

Run:

```bash
git diff -- frontend/src/app/page.tsx frontend/src/app/music frontend/src/components/music
```

Expected: no diff output for homepage or music files.

---

## Self-Review

**Spec coverage:**
- Shared header: Task 1.
- Button ripple default off: Task 2.
- GlassCard motion normalization: Task 3.
- Articles header unification: Task 4.
- Albums heavy hero removal: Task 5.
- Videos Lottie hero removal: Task 6.
- Messages danmaku noise reduction: Task 7.
- Homepage and music exclusion verification: Task 8.

**Placeholder scan:** No TBD/TODO placeholders remain. Each task includes concrete file paths and commands.

**Type consistency:** `PageHeader` accepts a `LucideIcon` and is used with `BookOpen`, `Camera`, `Film`, and `MessageSquare`, all from `lucide-react`. `Button.enableRipple` is optional and defaults to false, so existing call sites remain compatible.
