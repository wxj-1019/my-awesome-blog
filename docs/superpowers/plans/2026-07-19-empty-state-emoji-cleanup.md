# Empty State + Emoji Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify public empty UIs on the existing `EmptyState` component (lucide + copy + CTA), remove decorative emoji from UI chrome (including message reactions/pickers display), keep BrandLogo as fixed SVG, leave user message body emoji and backend reaction keys unchanged.

**Architecture:** Add a shared `emoji-icon-map` catalog (API emoji key → Lucide + Chinese label). Enhance `EmptyState` with `size`/`compact` and `useReducedMotion`. Migrate hand-rolled empty blocks and decorative emoji call sites. Message reaction/picker UIs render Lucide but still submit/insert unicode emoji keys for compatibility.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind, lucide-react, framer-motion via `@/lib/framer-motion`, Jest + Testing Library, existing `EmptyState` + `useReducedMotion`.

**Spec:** `docs/superpowers/specs/2026-07-19-empty-state-emoji-cleanup-design.md`

---

## File map

| File | Action |
|------|--------|
| `frontend/src/lib/emoji-icon-map.ts` | **Create** — reaction + composer catalogs + helpers |
| `frontend/src/lib/emoji-icon-map.test.ts` | **Create** — unit tests for map helpers |
| `frontend/src/components/ui/EmptyState.tsx` | **Modify** — size/compact/reduced-motion/token polish |
| `frontend/src/components/messages/MessageReactions.tsx` | **Modify** — catalog + Lucide + non-emoji particles |
| `frontend/src/components/messages/QuickActions.tsx` | **Modify** — composer catalog UI |
| `frontend/src/components/messages/MessageInput.tsx` | **Modify** — inline picker uses catalog |
| `frontend/src/components/messages/ReportDialog.tsx` | **Modify** — Lucide reason icons |
| `frontend/src/components/messages/MessageList.tsx` | **Modify** — EmptyState |
| `frontend/src/components/messages/VirtualMessageList.tsx` | **Modify** — EmptyState; reaction display via map |
| `frontend/src/components/messages/MessageReplies.tsx` | **Modify** — compact empty |
| `frontend/src/app/articles/articles-content.tsx` | **Modify** — EmptyState |
| `frontend/src/components/articles/CommentTree.tsx` | **Modify** — EmptyState |
| `frontend/src/components/home/FeaturedHighlights.tsx` | **Modify** — EmptyState |
| `frontend/src/components/home/Portfolio.tsx` | **Modify** — EmptyState |
| `frontend/src/components/chat/ChatSidebar.tsx` | **Modify** — EmptyState sm |
| `frontend/src/components/ai/chat/ChatSidebar.tsx` | **Modify** — EmptyState sm |
| `frontend/src/components/chat/PromptSettings.tsx` | **Modify** — EmptyState when empty |
| `frontend/src/components/music/SongList.tsx` | **Modify** — EmptyState sm |
| `frontend/src/components/ui/DataTable.tsx` | **Modify** — delegate empty to EmptyState |
| `frontend/src/app/contact/contact-content.tsx` | **Modify** — drop ✨ |
| `frontend/src/app/profile/components/ProfileView.tsx` | **Modify** — User/Users icons |
| `frontend/src/app/profile/components/ActivityView.tsx` | **Modify** — EmptyState sm |
| `frontend/src/app/profile/components/SocialLinksCard.tsx` | **Modify** — EmptyState sm |
| `frontend/src/app/admin/timeline/page.tsx` | **Modify** — placeholder text only |
| `BrandLogo.tsx` | **Do not touch** |

**Out of scope this plan:** ArticleTocRail short empty line; admin business copy rewrites; Lottie; backend.

---

### Task 1: Shared emoji → Lucide catalog

**Files:**
- Create: `frontend/src/lib/emoji-icon-map.ts`
- Create: `frontend/src/lib/emoji-icon-map.test.ts`

- [ ] **Step 1: Write failing unit tests**

Create `frontend/src/lib/emoji-icon-map.test.ts`:

```ts
import {
  REACTION_CATALOG,
  COMPOSER_EMOJI_CATALOG,
  getReactionIcon,
  getReactionLabel,
  getComposerEntry,
} from './emoji-icon-map';
import { Heart, ThumbsUp } from 'lucide-react';

describe('emoji-icon-map', () => {
  it('maps known reaction keys to lucide icons', () => {
    expect(getReactionIcon('❤️')).toBe(Heart);
    expect(getReactionIcon('👍')).toBe(ThumbsUp);
  });

  it('returns Chinese labels for reactions', () => {
    expect(getReactionLabel('❤️')).toBe('喜欢');
    expect(getReactionLabel('👍')).toBe('赞同');
  });

  it('falls back safely for unknown keys', () => {
    expect(getReactionIcon('🦄')).toBeDefined();
    expect(getReactionLabel('🦄')).toBe('反应');
  });

  it('keeps reaction API keys as unicode emoji strings', () => {
    const keys = REACTION_CATALOG.map((r) => r.key);
    expect(keys).toEqual(
      expect.arrayContaining(['❤️', '👍', '👎', '🔥', '😂', '🚀', '✨'])
    );
    expect(REACTION_CATALOG).toHaveLength(7);
  });

  it('composer catalog has 16–24 entries with key+icon+label', () => {
    expect(COMPOSER_EMOJI_CATALOG.length).toBeGreaterThanOrEqual(16);
    expect(COMPOSER_EMOJI_CATALOG.length).toBeLessThanOrEqual(24);
    for (const entry of COMPOSER_EMOJI_CATALOG) {
      expect(entry.key.length).toBeGreaterThan(0);
      expect(entry.icon).toBeDefined();
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it('getComposerEntry finds by key', () => {
    const first = COMPOSER_EMOJI_CATALOG[0];
    expect(getComposerEntry(first.key)?.label).toBe(first.label);
  });
});
```

- [ ] **Step 2: Run test — expect fail**

```bash
cd frontend && npm test -- --testPathPattern=emoji-icon-map --no-coverage
```

Expected: FAIL (module not found / exports missing).

- [ ] **Step 3: Implement catalog**

Create `frontend/src/lib/emoji-icon-map.ts`:

```ts
import type { LucideIcon } from 'lucide-react';
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Laugh,
  Rocket,
  Sparkles,
  Smile,
  PartyPopper,
  Star,
  Check,
  X,
  HandMetal,
  Handshake,
  CircleHelp,
  Ghost,
  Frown,
  Angry,
  Meh,
  Zap,
  Trophy,
  Coffee,
} from 'lucide-react';

export type EmojiIconEntry = {
  /** 后端/存储/插入用的 unicode emoji key */
  key: string;
  icon: LucideIcon;
  /** 中文无障碍与 title */
  label: string;
};

/** 留言反应：展示 Lucide，提交 key 不变 */
export const REACTION_CATALOG: readonly EmojiIconEntry[] = [
  { key: '❤️', icon: Heart, label: '喜欢' },
  { key: '👍', icon: ThumbsUp, label: '赞同' },
  { key: '👎', icon: ThumbsDown, label: '不赞同' },
  { key: '🔥', icon: Flame, label: '精彩' },
  { key: '😂', icon: Laugh, label: '好笑' },
  { key: '🚀', icon: Rocket, label: '支持' },
  { key: '✨', icon: Sparkles, label: '亮点' },
] as const;

/** 输入/快捷面板精选（插入仍写入 key 字符） */
export const COMPOSER_EMOJI_CATALOG: readonly EmojiIconEntry[] = [
  { key: '😀', icon: Smile, label: '微笑' },
  { key: '😂', icon: Laugh, label: '大笑' },
  { key: '🥰', icon: Heart, label: '喜爱' },
  { key: '😍', icon: Heart, label: '喜欢' },
  { key: '🤔', icon: CircleHelp, label: '思考' },
  { key: '😎', icon: Smile, label: '酷' },
  { key: '👍', icon: ThumbsUp, label: '赞同' },
  { key: '👎', icon: ThumbsDown, label: '不赞同' },
  { key: '❤️', icon: Heart, label: '红心' },
  { key: '🎉', icon: PartyPopper, label: '庆祝' },
  { key: '🔥', icon: Flame, label: '火焰' },
  { key: '✨', icon: Sparkles, label: '闪亮' },
  { key: '🚀', icon: Rocket, label: '火箭' },
  { key: '💪', icon: HandMetal, label: '加油' },
  { key: '👏', icon: ThumbsUp, label: '鼓掌' },
  { key: '🙏', icon: Handshake, label: '感谢' },
  { key: '⭐', icon: Star, label: '星星' },
  { key: '✅', icon: Check, label: '完成' },
  { key: '❌', icon: X, label: '否定' },
  { key: '😡', icon: Angry, label: '生气' },
  { key: '😭', icon: Frown, label: '难过' },
  { key: '👻', icon: Ghost, label: '幽灵' },
  { key: '⚡', icon: Zap, label: '闪电' },
  { key: '🏆', icon: Trophy, label: '奖杯' },
] as const;

const reactionByKey = new Map(REACTION_CATALOG.map((e) => [e.key, e]));
const composerByKey = new Map(COMPOSER_EMOJI_CATALOG.map((e) => [e.key, e]));

/** 未知 key 回退：Meh 图标 + 通用文案（不抛错） */
export function getReactionIcon(key: string): LucideIcon {
  return reactionByKey.get(key)?.icon ?? Meh;
}

export function getReactionLabel(key: string): string {
  return reactionByKey.get(key)?.label ?? '反应';
}

export function getComposerEntry(key: string): EmojiIconEntry | undefined {
  return composerByKey.get(key);
}
```

Note: If `HandMetal` is missing in the installed lucide version, replace with `Zap` or `Star` and keep tests green. Verify with:

```bash
cd frontend && node -e "const l=require('lucide-react'); console.log(['HandMetal','Handshake','Meh','Coffee'].map(k=>k+':'+!!l[k]).join('\n'))"
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd frontend && npm test -- --testPathPattern=emoji-icon-map --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/emoji-icon-map.ts frontend/src/lib/emoji-icon-map.test.ts
git commit -m "feat(frontend): add emoji-to-lucide catalog for reactions and composer"
```

---

### Task 2: Enhance EmptyState

**Files:**
- Modify: `frontend/src/components/ui/EmptyState.tsx`

- [ ] **Step 1: Read current file fully** (already ~175 lines). Confirm exports stay default + `EmptyStateProps`.

- [ ] **Step 2: Implement size, compact, reduced-motion**

Replace implementation with (preserve default export and displayName):

```tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import {
  FileText,
  Inbox,
  Search,
  Plus,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  variant?: 'default' | 'search' | 'error' | 'create';
  className?: string;
  /** md = 公开页默认；sm = 侧栏/表格/卡片内 */
  size?: 'sm' | 'md';
  /** 减少垂直留白 */
  compact?: boolean;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title,
      description,
      icon: Icon,
      action,
      variant = 'default',
      className,
      size = 'md',
      compact = false,
    },
    ref
  ) => {
    const reducedMotion = useReducedMotion();

    const defaultConfig: Record<
      string,
      {
        icon: React.ComponentType<{ className?: string }>;
        title: string;
        description: string;
        action?: EmptyStateProps['action'];
      }
    > = {
      default: {
        icon: Icon || Inbox,
        title: title || '暂无数据',
        description: description || '这里暂时没有任何内容',
      },
      search: {
        icon: Icon || Search,
        title: title || '未找到结果',
        description: description || '请尝试其他搜索关键词',
        action: action || {
          label: '清除搜索',
          onClick: () => window.location.reload(),
          icon: RefreshCw,
        },
      },
      error: {
        icon: Icon || RefreshCw,
        title: title || '加载失败',
        description: description || '请稍后重试',
        action: action || {
          label: '重新加载',
          onClick: () => window.location.reload(),
          icon: RefreshCw,
        },
      },
      create: {
        icon: Icon || FileText,
        title: title || '开始创建',
        description: description || '创建您的第一个内容',
        action: action || {
          label: '立即创建',
          icon: Plus,
        },
      },
    };

    const config = defaultConfig[variant];
    // 调用方传入的 action 优先于 variant 默认 action
    const resolvedAction = action !== undefined ? action : config.action;
    const DefaultIcon = (Icon || config.icon) as React.ComponentType<{
      className?: string;
    }>;
    const ActionIcon = resolvedAction?.icon || ArrowRight;

    const isSm = size === 'sm';
    const pad = compact
      ? isSm
        ? 'py-6 px-3'
        : 'py-8 px-4'
      : isSm
        ? 'py-10 px-4'
        : 'py-16 px-4';
    const iconWrap = isSm ? 'w-14 h-14' : 'w-20 h-20';
    const iconSize = isSm ? 'w-7 h-7' : 'w-10 h-10';

    const motionOff = reducedMotion
      ? { initial: false, animate: undefined, transition: { duration: 0 } }
      : {};

    return (
      <motion.div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          pad,
          className
        )}
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.5 }}
      >
        <div className="relative mb-4 sm:mb-6">
          <div
            className={cn(
              'rounded-full bg-muted/40 backdrop-blur-lg border border-border/40 flex items-center justify-center',
              iconWrap
            )}
          >
            <DefaultIcon className={cn(iconSize, 'text-muted-foreground')} />
          </div>
          {!reducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/10 blur-xl pointer-events-none"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.25, 0.45, 0.25],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>

        <h3
          className={cn(
            'font-semibold text-foreground mb-2',
            isSm ? 'text-base' : 'text-lg'
          )}
        >
          {title ?? config.title}
        </h3>

        <p
          className={cn(
            'text-muted-foreground mb-4 sm:mb-6 max-w-md',
            isSm ? 'text-xs' : 'text-sm'
          )}
        >
          {description ?? config.description}
        </p>

        {resolvedAction && (
          <div>
            {resolvedAction.href ? (
              <Link
                href={
                  resolvedAction.href as React.ComponentProps<
                    typeof Link
                  >['href']
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                <ActionIcon className="w-4 h-4" />
                {resolvedAction.label}
              </Link>
            ) : resolvedAction.onClick ? (
              <button
                type="button"
                onClick={resolvedAction.onClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                <ActionIcon className="w-4 h-4" />
                {resolvedAction.label}
              </button>
            ) : null}
          </div>
        )}
      </motion.div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
```

Important behavior notes for implementer:
- Prefer caller `title`/`description`/`icon`/`action` over variant defaults (fix existing admin pages that pass props).
- `create` variant without `action.onClick`/`href` should not render a dead button — only render action UI when `href` or `onClick` exists (as above).
- Remove hard-coded `bg-tech-cyan` CTA in favor of `bg-primary` for theme consistency (aligns with Phase A/B tokens).

- [ ] **Step 3: Type-check EmptyState consumers still compile**

```bash
cd frontend && npx tsc --noEmit -p tsconfig.json 2>&1 | head -40
```

If admin pages only pass existing props, they must remain valid (new props optional).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/EmptyState.tsx
git commit -m "feat(ui): enhance EmptyState with size, compact, reduced-motion"
```

---

### Task 3: Message reactions + particles

**Files:**
- Modify: `frontend/src/components/messages/MessageReactions.tsx`

- [ ] **Step 1: Wire REACTION_CATALOG**

- Remove local `REACTION_TYPES` array.
- Import `REACTION_CATALOG`, `getReactionIcon`, `getReactionLabel` from `@/lib/emoji-icon-map`.
- Map buttons:

```tsx
{REACTION_CATALOG.map(({ key, icon: Icon, label }) => {
  const reaction = reactions.find((r) => r.emoji === key);
  const count = reaction?.count || 0;
  const isReacted = hasReacted(key);
  return (
    <motion.button
      key={key}
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => handleReactionClick(key, e)}
      className={cn(
        'relative flex items-center gap-1 px-2 py-1 rounded-full border text-sm transition-colors',
        isReacted
          ? 'bg-primary/15 text-primary border-primary/40'
          : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/30'
      )}
      whileHover={reducedMotion ? undefined : { scale: 1.05 }}
      whileTap={reducedMotion ? undefined : { scale: 0.95 }}
    >
      <Icon className="w-4 h-4" aria-hidden />
      {count > 0 && (
        <span className="text-xs font-medium tabular-nums">{count}</span>
      )}
      {/* keep active ring if present; no emoji span */}
    </motion.button>
  );
})}
```

- [ ] **Step 2: Replace emoji particles**

Change `Particle` type:

```ts
interface Particle {
  id: string;
  x: number;
  y: number;
  rotation: number;
  velocity: { x: number; y: number };
}
```

In particle render, use a small `div` with `bg-primary rounded-full w-2 h-2` (or Icon at small opacity) — **never** `{particle.emoji}`.

- [ ] **Step 3: Payload unchanged**

Confirm `onReaction?.(emoji)` still receives the unicode key (`key` from catalog).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/messages/MessageReactions.tsx
git commit -m "feat(messages): render reactions with lucide icons"
```

---

### Task 4: Composer pickers (QuickActions + MessageInput)

**Files:**
- Modify: `frontend/src/components/messages/QuickActions.tsx`
- Modify: `frontend/src/components/messages/MessageInput.tsx`

- [ ] **Step 1: QuickEmoji uses COMPOSER_EMOJI_CATALOG**

In `QuickActions.tsx`, remove `EMOJIS` string array. Implement:

```tsx
import { COMPOSER_EMOJI_CATALOG } from '@/lib/emoji-icon-map';

export function QuickEmoji({ onEmojiSelect }: QuickEmojiProps) {
  return (
    <div className="grid grid-cols-6 gap-2 p-2">
      {COMPOSER_EMOJI_CATALOG.map(({ key, icon: Icon, label }, index) => (
        <motion.button
          key={key + label}
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02 }}
          onClick={() => onEmojiSelect(key)}
          className="flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors text-foreground"
          title={label}
          aria-label={label}
        >
          <Icon className="w-5 h-5" aria-hidden />
        </motion.button>
      ))}
    </div>
  );
}
```

Keep phrase / shortcut tabs unchanged.

- [ ] **Step 2: MessageInput inline picker**

Replace the hard-coded emoji array around the `showEmojiPicker` block with the same catalog pattern; `insertEmoji(key)` still inserts unicode into textarea.

```tsx
import { COMPOSER_EMOJI_CATALOG } from '@/lib/emoji-icon-map';

// inside showEmojiPicker:
<div className="grid grid-cols-8 gap-2">
  {COMPOSER_EMOJI_CATALOG.map(({ key, icon: Icon, label }) => (
    <button
      key={key + label}
      type="button"
      onClick={() => insertEmoji(key)}
      className="flex items-center justify-center p-1.5 rounded-md hover:bg-background transition-colors"
      title={label}
      aria-label={label}
    >
      <Icon className="w-5 h-5 text-foreground" aria-hidden />
    </button>
  ))}
</div>
```

- [ ] **Step 3: Manual sanity**

- Open messages page in dev: picker shows icons; clicking inserts emoji character into the input value.
- Reaction buttons show icons; click still fires same key.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/messages/QuickActions.tsx frontend/src/components/messages/MessageInput.tsx
git commit -m "feat(messages): lucide composer emoji pickers with emoji insert keys"
```

---

### Task 5: ReportDialog Lucide icons

**Files:**
- Modify: `frontend/src/components/messages/ReportDialog.tsx`

- [ ] **Step 1: Replace reason icons**

```tsx
import {
  Flag,
  X,
  AlertCircle,
  Ban,
  Angry,
  AlertTriangle,
  FileWarning,
  FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const reportReasons: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'spam', label: '垃圾信息', icon: Ban },
  { id: 'harassment', label: '骚扰/辱骂', icon: Angry },
  { id: 'inappropriate', label: '不当内容', icon: AlertTriangle },
  { id: 'misleading', label: '误导信息', icon: FileWarning },
  { id: 'other', label: '其他原因', icon: FileText },
];
```

Where reasons are rendered, replace emoji text with:

```tsx
const Icon = reason.icon;
<Icon className="w-5 h-5" aria-hidden />
```

Keep `id` values submitted to `onSubmit` unchanged.

If `FileWarning` missing, use `AlertCircle`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/messages/ReportDialog.tsx
git commit -m "fix(messages): use lucide icons in report reasons"
```

---

### Task 6: Public empty states — articles & home

**Files:**
- Modify: `frontend/src/app/articles/articles-content.tsx`
- Modify: `frontend/src/components/home/FeaturedHighlights.tsx`
- Modify: `frontend/src/components/home/Portfolio.tsx`

- [ ] **Step 1: articles-content empty branch**

Replace the hand-rolled empty `motion.div` (「暂无文章」 block ~lines 217–230) with:

```tsx
import EmptyState from '@/components/ui/EmptyState';
import { BookOpen } from 'lucide-react';

// inside empty branch:
const hasFilters = Boolean(
  filters.selectedCategory || filters.selectedTag || filters.searchQuery
);
<EmptyState
  variant={hasFilters ? 'search' : 'default'}
  icon={BookOpen}
  title={hasFilters ? '未找到匹配文章' : '暂无文章'}
  description={
    hasFilters
      ? '没有找到匹配的文章，请尝试其他筛选条件'
      : '暂无文章发布，请稍后再来'
  }
  action={
    hasFilters
      ? {
          label: '清除筛选',
          onClick: () => {
            filters.handleCategoryChange?.('');
            filters.handleTagChange?.('');
            // if search clear helper exists, call it; else reload list defaults
          },
        }
      : { label: '返回首页', href: '/' }
  }
/>
```

Implementer: inspect `filters` API in the same file and wire clear handlers that actually exist (do not invent). If no clear-all helper, use:

```tsx
action={hasFilters ? undefined : { label: '返回首页', href: '/' }}
```

and rely on variant search description only — **do not** call `window.location.reload()` for filter clear if better handlers exist.

- [ ] **Step 2: FeaturedHighlights**

```tsx
import EmptyState from '@/components/ui/EmptyState';
import { BookOpen } from 'lucide-react';

// when highlights.length === 0:
<section className="relative overflow-hidden py-6">
  <div className="container mx-auto px-4">
    <EmptyState
      size="sm"
      compact
      icon={BookOpen}
      title="暂无精选文章"
      description="精选内容准备中，请稍后再来"
    />
  </div>
</section>
```

- [ ] **Step 3: Portfolio empty category**

```tsx
import EmptyState from '@/components/ui/EmptyState';
import { FolderOpen } from 'lucide-react';

{filteredProjects.length === 0 && (
  <EmptyState
    size="sm"
    compact
    icon={FolderOpen}
    title="该分类下暂无项目"
    description="试试其他分类或稍后再来"
  />
)}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/articles/articles-content.tsx \
  frontend/src/components/home/FeaturedHighlights.tsx \
  frontend/src/components/home/Portfolio.tsx
git commit -m "feat(frontend): use EmptyState on articles and home empty views"
```

---

### Task 7: Messages / comments empty states

**Files:**
- Modify: `frontend/src/components/messages/MessageList.tsx`
- Modify: `frontend/src/components/messages/VirtualMessageList.tsx`
- Modify: `frontend/src/components/messages/MessageReplies.tsx`
- Modify: `frontend/src/components/articles/CommentTree.tsx`

- [ ] **Step 1: MessageList**

```tsx
import EmptyState from '@/components/ui/EmptyState';
import { MessageSquare } from 'lucide-react';

if (messages.length === 0) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="暂无留言"
      description="快来发表第一条吧！"
      className={cn(themedClasses.cardBgClass, 'rounded-xl')}
    />
  );
}
```

- [ ] **Step 2: VirtualMessageList**

Replace dashed circle empty (~「暂无留言...」) with same EmptyState pattern (`size="sm"` if dense layout).

Ensure mock reactions (if still constructing `{ emoji: '❤️', ... }`) continue using emoji **keys**; display path goes through MessageReactions which already uses Lucide.

- [ ] **Step 3: MessageReplies empty**

```tsx
<EmptyState
  size="sm"
  compact
  icon={MessageSquare}
  title="暂无回复"
  description="快来抢沙发吧"
/>
```

- [ ] **Step 4: CommentTree empty**

```tsx
import EmptyState from '@/components/ui/EmptyState';

if (comments.length === 0) {
  return (
    <GlassCard className={cn(cardBgClass)}>
      <EmptyState
        size="sm"
        compact
        icon={MessageSquare}
        title="暂无评论"
        description="快来发表第一条评论吧！"
      />
    </GlassCard>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/messages/MessageList.tsx \
  frontend/src/components/messages/VirtualMessageList.tsx \
  frontend/src/components/messages/MessageReplies.tsx \
  frontend/src/components/articles/CommentTree.tsx
git commit -m "feat(frontend): EmptyState for messages and comments empty views"
```

---

### Task 8: Chat / music / prompts / profile / DataTable

**Files:**
- Modify: `frontend/src/components/chat/ChatSidebar.tsx`
- Modify: `frontend/src/components/ai/chat/ChatSidebar.tsx`
- Modify: `frontend/src/components/chat/PromptSettings.tsx`
- Modify: `frontend/src/components/music/SongList.tsx`
- Modify: `frontend/src/app/profile/components/ActivityView.tsx`
- Modify: `frontend/src/app/profile/components/SocialLinksCard.tsx`
- Modify: `frontend/src/components/ui/DataTable.tsx`

- [ ] **Step 1: Chat sidebars**

`components/chat/ChatSidebar.tsx` — replace 「暂无历史记录」 block:

```tsx
import EmptyState from '@/components/ui/EmptyState';
import { MessageSquare } from 'lucide-react';

{sessions.length === 0 && (
  <EmptyState
    size="sm"
    compact
    icon={MessageSquare}
    title="暂无历史记录"
    description="开始一段新对话吧"
    className="px-2"
  />
)}
```

`components/ai/chat/ChatSidebar.tsx` — replace 「暂无对话」 similarly (`title="暂无对话"`).

- [ ] **Step 2: PromptSettings empty**

```tsx
<EmptyState
  size="sm"
  compact
  variant={searchQuery ? 'search' : 'default'}
  title={searchQuery ? '未找到匹配的提示词' : '暂无提示词'}
  description={searchQuery ? '试试其他关键词' : '创建或导入提示词后在此显示'}
/>
```

- [ ] **Step 3: SongList**

```tsx
{songs.length === 0 && (
  <EmptyState size="sm" compact icon={Music} title="暂无歌曲" description="曲库空空如也" />
)}
```

- [ ] **Step 4: Profile ActivityView + SocialLinksCard**

```tsx
// ActivityView empty
<EmptyState size="sm" compact title="暂无活动记录" description="互动与动态会显示在这里" />

// SocialLinksCard empty
<EmptyState
  size="sm"
  compact
  title={isEditing ? '添加社交链接' : '暂无社交链接'}
  description={
    isEditing
      ? '添加社交链接以展示您的社交网络'
      : '还没有公开的社交链接'
  }
/>
```

- [ ] **Step 5: DataTable empty branch**

Replace the custom empty motion block (~lines 246–258) with:

```tsx
import EmptyState from '@/components/ui/EmptyState';

if (data.length === 0) {
  return (
    <EmptyState
      className={className}
      icon={Search}
      title={empty?.title || '暂无数据'}
      description={empty?.description || '这里暂时没有任何内容'}
    />
  );
}
```

Keep `empty` prop type as-is.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/chat/ChatSidebar.tsx \
  frontend/src/components/ai/chat/ChatSidebar.tsx \
  frontend/src/components/chat/PromptSettings.tsx \
  frontend/src/components/music/SongList.tsx \
  frontend/src/app/profile/components/ActivityView.tsx \
  frontend/src/app/profile/components/SocialLinksCard.tsx \
  frontend/src/components/ui/DataTable.tsx
git commit -m "feat(frontend): EmptyState across chat, music, profile, DataTable"
```

---

### Task 9: Decorative emoji cleanup (contact, profile labels, timeline placeholder)

**Files:**
- Modify: `frontend/src/app/contact/contact-content.tsx`
- Modify: `frontend/src/app/profile/components/ProfileView.tsx`
- Modify: `frontend/src/app/admin/timeline/page.tsx`

- [ ] **Step 1: contact-content**

Change:

```tsx
期待与你的交流 ✨
```

to either plain text:

```tsx
期待与你的交流
```

or with optional icon (prefer simple text to avoid layout shift):

```tsx
<span className="inline-flex items-center gap-1.5">
  期待与你的交流
  <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden />
</span>
```

- [ ] **Step 2: ProfileView username / social headers**

Replace:

```tsx
<span ...>👤</span>
```

with:

```tsx
<span className="w-5 h-5 flex items-center justify-center bg-primary/15 rounded-full text-primary">
  <User className="w-3.5 h-3.5" aria-hidden />
</span>
```

Replace `👥` with `<Users className="w-3.5 h-3.5" />` similarly. Import `User`, `Users` from `lucide-react`.

- [ ] **Step 3: admin timeline placeholder**

Change:

```tsx
placeholder="例如: 🚀, 🎉, ✨"
```

to:

```tsx
placeholder="例如: rocket、party 或短标签"
```

Do **not** migrate stored event icon values.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/contact/contact-content.tsx \
  frontend/src/app/profile/components/ProfileView.tsx \
  frontend/src/app/admin/timeline/page.tsx
git commit -m "fix(ui): replace decorative emoji with lucide or plain copy"
```

---

### Task 10: Verification sweep

**Files:** none new; repo-wide checks

- [ ] **Step 1: Grep decorative emoji in UI (allow catalog keys)**

```bash
cd frontend && rg -n --glob '!node_modules/**' --glob '!**/emoji-icon-map.ts' --glob '!**/*.test.ts' \
  -e '✨|👤|👥|🚫|😡|🤥|📝|😀|😂|🥰|😍|🤔|😎|🤩|🥳|😭|🤯|🥶|😱|🤠|🥴|😈|👻|🎉|🔥|💯|💪|👏|🙏|🤝|🌟|✅|❌|⭐|🌈|🚀|❤️|👍|👎' \
  src/app src/components 2>/dev/null | head -80
```

Expected remaining hits: only if still inside string catalogs you forgot to delete, or user-facing content samples. Fix any UI chrome leftovers (ReportDialog, pickers, profile, contact). **Allowed:** none in JSX as visible decorative icons; catalog file excluded.

- [ ] **Step 2: Unit tests**

```bash
cd frontend && npm test -- --testPathPattern=emoji-icon-map --no-coverage
```

Expected: PASS.

- [ ] **Step 3: Lint + type-check**

```bash
cd frontend && npm run lint 2>&1 | tail -30
cd frontend && npm run type-check 2>&1 | tail -40
```

Expected: 0 errors on touched files (warnings OK if pre-existing `any`).

- [ ] **Step 4: BrandLogo untouched**

```bash
git diff main -- frontend/src/components/navigation/BrandLogo.tsx
```

Expected: empty (or only if unrelated — should be no changes from this work).

- [ ] **Step 5: Final commit if grep cleanups remain**

```bash
git add -A frontend/src
git status
# if residual fixes:
git commit -m "chore(frontend): finish empty-state and emoji cleanup verification"
```

- [ ] **Step 6: Optional push** (only if user asked)

```bash
git push origin main
```

---

## Spec coverage checklist (self-review)

| Spec requirement | Task |
|------------------|------|
| Shared emoji→lucide map | Task 1 |
| EmptyState size/compact/reduced-motion | Task 2 |
| Reactions Lucide + key payload | Task 3 |
| Composer picker Lucide + insert key | Task 4 |
| ReportDialog icons | Task 5 |
| Articles/home EmptyState | Task 6 |
| Messages/comments EmptyState | Task 7 |
| Chat/music/profile/DataTable | Task 8 |
| Contact/profile/timeline decorative | Task 9 |
| Acceptance grep/lint/typecheck | Task 10 |
| No Lottie / no BrandLogo change | Explicit non-touch |
| No body emoji strip / no backend | Out of scope notes |
| ArticleTocRail keep light | Out of file map |

## Placeholder / consistency notes

- Reaction property remains `emoji` on data objects; catalog field is `key` — map with `r.emoji === entry.key`.
- Prefer `primary` / `muted` tokens over `tech-cyan` in **touched** empty/reaction UI for theme unity; do not mass-replace unrelated tech-cyan in whole messages module.
- If a Lucide icon name is missing in the locked version, substitute a verified icon from Task 1 verification command — do not leave broken imports.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-19-empty-state-emoji-cleanup.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks  
2. **Inline Execution** — run tasks in this session with executing-plans and checkpoints  

Which approach?
