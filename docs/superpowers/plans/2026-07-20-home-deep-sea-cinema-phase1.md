# Home Deep-Sea Cinema Phase 1 Implementation Plan

> **For agentic workers:** Implement task-by-task. Checkboxes for tracking.

**Goal:** Wire homepage into 深海×电影 narrative skeleton: Act labels (中文), DiveTransition, remove Matrix rain mounts, unify comfort budget.

**Architecture:** `page.tsx` orchestrates Hero + DiveTransition + HomeActSection wrappers around existing sections. Shared `homeMotion` tokens. No Matrix on page or theme-wrapper.

**Tech Stack:** Next.js, existing FadeIn/BlurIn, WaveStack/BubbleField.

**Spec:** `docs/superpowers/specs/2026-07-20-home-deep-sea-cinema-phase1-design.md`

---

### Task 1: narrative primitives

- [x] Create `frontend/src/components/home/narrative/homeMotion.ts`
- [x] Create `frontend/src/components/home/narrative/HomeActSection.tsx`
- [x] Create `frontend/src/components/home/narrative/DiveTransition.tsx`

### Task 2: page + atmosphere

- [x] Rewrite `frontend/src/app/page.tsx` with acts (中文幕标)
- [x] Remove Matrix from `page.tsx` and `theme-wrapper.tsx`
- [x] Delete unused `MatrixCodeRain.tsx`
- [x] CursorGlow softer opacity
- [x] Avoid double container around StatsPanel/TechStack

### Task 3: Hero / Tech polish

- [x] Hero comments + BubbleField desktop 16 / mobile 8
- [x] reducedMotion on wave entrance
- [x] TechStack: remove pulse bars; gray → muted/foreground; slower LogoLoop

### Task 4: verify

- [x] Update `__tests__/home.test.tsx`
- [x] `npm run type-check`
- [x] `npm test -- --testPathPattern=home.test`

### Task 5: review iteration

- [x] WaveStack prefers-reduced-motion 停循环
- [x] Hero 后备渐变 / 骨架 shimmer 尊重 RM
- [x] HomeActSection 无嵌套 landmark
- [x] 第三幕拆 航迹 / 洋流
- [x] LogoLoop 默认静止悬停滚动
- [x] CursorGlow / ScrollIndicator RM
- [x] 删除 MatrixCodeRain.tsx
