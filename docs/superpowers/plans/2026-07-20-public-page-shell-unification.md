# Public Page Shell Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify public content pages with `PageShell` + `PageHeader`, migrate about/login/home/tools/unauthorized to semantic tokens and GlassCard.

**Architecture:** Two small layout components mirror existing `/tools` hub patterns. Pages wrap content without changing data fetching or auth logic. Login keeps floating-label CSS structure; only color tokens and card shell change.

**Tech Stack:** Next.js 16, React 18, Tailwind, existing `GlassCard` / `Button` / `cn()`.

**Spec:** `docs/superpowers/specs/2026-07-20-public-page-shell-unification-design.md`

---

### Task 1: PageShell + PageHeader

**Files:**
- Create: `frontend/src/components/layout/PageShell.tsx`
- Create: `frontend/src/components/layout/PageHeader.tsx`

- [ ] **Step 1: Create PageShell.tsx**

```tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type PageShellDensity = 'default' | 'narrow' | 'flush';

export interface PageShellProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** 是否包 container；false 时仅外层（如 login 全屏居中） */
  contained?: boolean;
  density?: PageShellDensity;
  containerClassName?: string;
  /** 外层用 main 或 div */
  as?: 'main' | 'div';
}

const densityContainer: Record<PageShellDensity, string> = {
  default: 'container mx-auto px-4 sm:px-6 pt-24 pb-12 md:pb-16',
  narrow: 'container mx-auto px-4 sm:px-6 pt-20 pb-10 md:py-16',
  flush: 'container mx-auto px-4 sm:px-6 py-8',
};

/**
 * 公开内容页外层：统一背景、顶距、container。
 * 不塞动效；页内自行组合 PageHeader / GlassCard。
 */
export default function PageShell({
  children,
  className,
  contained = true,
  density = 'default',
  containerClassName,
  as: Comp = 'main',
  ...props
}: PageShellProps) {
  return (
    <Comp
      className={cn(
        'min-h-[70vh] bg-background text-foreground',
        !contained && 'min-h-screen',
        className
      )}
      {...props}
    >
      {contained ? (
        <div className={cn(densityContainer[density], containerClassName)}>
          {children}
        </div>
      ) : (
        children
      )}
    </Comp>
  );
}
```

- [ ] **Step 2: Create PageHeader.tsx**

```tsx
'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  align?: 'center' | 'left';
  className?: string;
}

/**
 * 公开页标题区：对齐 /tools、/home hub 的图标+标题+描述。
 */
export default function PageHeader({
  title,
  description,
  icon: Icon,
  align = 'center',
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-10',
        align === 'center' && 'max-w-2xl mx-auto text-center',
        align === 'left' && 'max-w-4xl',
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 text-primary mb-4',
            align === 'left' && 'mb-4'
          )}
        >
          <Icon className="w-7 h-7" aria-hidden />
        </div>
      )}
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
        {title}
      </h1>
      {description ? (
        <p className="text-muted-foreground text-sm md:text-base">{description}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: type-check partial** — after all page migrations in Task 5.

---

### Task 2: Migrate hubs (home + tools)

**Files:**
- Modify: `frontend/src/app/home/home-content.tsx`
- Modify: `frontend/src/app/tools/tools-content.tsx`

- [ ] **Step 1: Rewrite home-content to use PageShell + PageHeader** (keep items/GlassCard)

- [ ] **Step 2: Rewrite tools-content the same way**

---

### Task 3: Migrate about-content

**Files:**
- Modify: `frontend/src/app/about/about-content.tsx`

- [ ] **Step 1:** Replace `Card`/`CardContent` with `GlassCard`; wrap with `PageShell` + `PageHeader` align left; icon e.g. `User`; loading spinner `text-primary`.

---

### Task 4: Migrate login-content

**Files:**
- Modify: `frontend/src/app/login/login-content.tsx`
- Optionally light-touch: `frontend/src/styles/components/login-form.css` if white labels break light mode

- [ ] **Step 1:** Remove inline style rgba on card; use GlassCard or glass classes; `text-foreground` / `text-muted-foreground`; error destructive tokens; Button default primary; keep form-control structure.

---

### Task 5: Migrate unauthorized-content

**Files:**
- Modify: `frontend/src/app/unauthorized/unauthorized-content.tsx`

- [ ] **Step 1:** PageShell + Button asChild + Link; destructive icon well.

---

### Task 6: Verify

- [ ] `cd frontend && npm run type-check`
- [ ] Optional: `npm test` if time
- [ ] Grep target files for `text-gray-` / inline `rgba(15, 23, 42`

---

### Spec coverage

| Spec item | Task |
|-----------|------|
| PageShell | 1 |
| PageHeader | 1 |
| about GlassCard | 3 |
| login tokens | 4 |
| hubs | 2 |
| unauthorized | 5 |
| type-check | 6 |
