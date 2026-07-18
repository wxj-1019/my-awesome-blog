# Component Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate five duplicate component pairs by merging admin versions into `ui/`, updating ~17 admin page imports.

**Architecture:** Copy `admin/` component source into `ui/` counterpart, delete originals, batch-replace import paths across admin pages. No API changes — only file paths change.

**Tech Stack:** TypeScript, React, Next.js App Router, existing `@/` path aliases.

---

### Task 1: Merge EmptyState

**Files:**
- Overwrite: `frontend/src/components/ui/EmptyState.tsx`
- Delete: `frontend/src/components/admin/EmptyState.tsx`
- Update imports: 14 files (see step 3)

- [ ] **Step 1: Overwrite ui/EmptyState with admin version**

```bash
cp frontend/src/components/admin/EmptyState.tsx frontend/src/components/ui/EmptyState.tsx
```

- [ ] **Step 2: Delete admin/EmptyState.tsx**

```bash
rm frontend/src/components/admin/EmptyState.tsx
```

- [ ] **Step 3: Update all import paths**

```bash
cd frontend/src
sed -i "s|from '@/components/admin/EmptyState'|from '@/components/ui/EmptyState'|g" \
  app/admin/users/page.tsx \
  app/admin/timeline/page.tsx \
  app/admin/typewriter/page.tsx \
  app/admin/test/page.tsx \
  app/admin/tags/page.tsx \
  app/admin/subscriptions/page.tsx \
  app/admin/prompts/page.tsx \
  app/admin/portfolios/page.tsx \
  app/admin/memories/page.tsx \
  app/admin/friend-links/page.tsx \
  app/admin/conversations/page.tsx \
  app/admin/comments/page.tsx \
  app/admin/categories/page.tsx \
  app/admin/audit-logs/page.tsx
```

- [ ] **Step 4: Verify no remaining admin/EmptyState imports**

```bash
cd frontend
rg -rn "admin/EmptyState" src -g "*.tsx"
```

Expected: no output.

---

### Task 2: Merge LoadingState

**Files:**
- Overwrite: `frontend/src/components/ui/LoadingState.tsx`
- Delete: `frontend/src/components/admin/LoadingState.tsx`
- Update imports: 14 files

- [ ] **Step 1: Overwrite ui/LoadingState with admin version**

```bash
cp frontend/src/components/admin/LoadingState.tsx frontend/src/components/ui/LoadingState.tsx
```

- [ ] **Step 2: Delete admin/LoadingState.tsx**

```bash
rm frontend/src/components/admin/LoadingState.tsx
```

- [ ] **Step 3: Update all import paths**

```bash
cd frontend/src
sed -i "s|from '@/components/admin/LoadingState'|from '@/components/ui/LoadingState'|g" \
  app/admin/users/page.tsx \
  app/admin/timeline/page.tsx \
  app/admin/typewriter/page.tsx \
  app/admin/test/page.tsx \
  app/admin/tags/page.tsx \
  app/admin/subscriptions/page.tsx \
  app/admin/prompts/page.tsx \
  app/admin/portfolios/page.tsx \
  app/admin/memories/page.tsx \
  app/admin/friend-links/page.tsx \
  app/admin/conversations/page.tsx \
  app/admin/comments/page.tsx \
  app/admin/categories/page.tsx \
  app/admin/audit-logs/page.tsx
```

- [ ] **Step 4: Verify no remaining admin/LoadingState imports**

```bash
cd frontend
rg -rn "admin/LoadingState" src -g "*.tsx"
```

Expected: no output.

---

### Task 3: Merge DataTable

**Files:**
- Overwrite: `frontend/src/components/ui/DataTable.tsx`
- Delete: `frontend/src/components/admin/DataTable.tsx`
- Update imports: 1 file

- [ ] **Step 1: Overwrite ui/DataTable with admin version**

```bash
cp frontend/src/components/admin/DataTable.tsx frontend/src/components/ui/DataTable.tsx
```

- [ ] **Step 2: Delete admin/DataTable.tsx**

```bash
rm frontend/src/components/admin/DataTable.tsx
```

- [ ] **Step 3: Update import path**

```bash
cd frontend/src
sed -i "s|from '@/components/admin/DataTable'|from '@/components/ui/DataTable'|g" \
  app/admin/test/page.tsx
```

- [ ] **Step 4: Verify no remaining admin/DataTable imports**

```bash
cd frontend
rg -rn "admin/DataTable" src -g "*.tsx"
```

Expected: no output.

---

### Task 4: Merge ConfirmDialog

**Files:**
- Overwrite: `frontend/src/components/ui/ConfirmDialog.tsx`
- Delete: `frontend/src/components/admin/ConfirmDialog.tsx`, `frontend/src/components/feedback/ConfirmDialog.tsx`
- Update imports: 18 files

- [ ] **Step 1: Overwrite ui/ConfirmDialog with admin version**

```bash
cp frontend/src/components/admin/ConfirmDialog.tsx frontend/src/components/ui/ConfirmDialog.tsx
```

- [ ] **Step 2: Delete old ConfirmDialog files**

```bash
rm frontend/src/components/admin/ConfirmDialog.tsx
rm frontend/src/components/feedback/ConfirmDialog.tsx
```

- [ ] **Step 3: Update admin import paths**

```bash
cd frontend/src
sed -i "s|from '@/components/admin/ConfirmDialog'|from '@/components/ui/ConfirmDialog'|g" \
  app/admin/users/page.tsx \
  app/admin/timeline/page.tsx \
  app/admin/typewriter/page.tsx \
  app/admin/test/page.tsx \
  app/admin/tags/page.tsx \
  app/admin/subscriptions/page.tsx \
  app/admin/prompts/page.tsx \
  app/admin/portfolios/page.tsx \
  app/admin/memories/page.tsx \
  app/admin/images/page.tsx \
  app/admin/friend-links/page.tsx \
  app/admin/conversations/page.tsx \
  app/admin/comments/page.tsx \
  app/admin/categories/page.tsx \
  app/admin/articles/page.tsx
```

- [ ] **Step 4: Update feedback import paths**

```bash
cd frontend/src
sed -i "s|from '@/components/feedback/ConfirmDialog'|from '@/components/ui/ConfirmDialog'|g" \
  components/messages/MessageReplies.tsx \
  components/messages/MessageList.tsx
```

- [ ] **Step 5: Update chat import path**

```bash
cd frontend/src
sed -i "s|from '@/components/admin/ConfirmDialog'|from '@/components/ui/ConfirmDialog'|g" \
  components/chat/PromptSettings.tsx
```

- [ ] **Step 6: Verify no remaining old ConfirmDialog imports**

```bash
cd frontend
rg -rn "admin/ConfirmDialog|feedback/ConfirmDialog" src -g "*.tsx"
```

Expected: no output.

---

### Task 5: Clean up GlassCard

**Files:**
- Delete: `frontend/src/components/ui/AdminGlassCard.tsx`
- Modify: `frontend/src/app/admin/timeline/page.tsx`

- [ ] **Step 1: Delete unused AdminGlassCard**

```bash
rm frontend/src/components/ui/AdminGlassCard.tsx
```

- [ ] **Step 2: Update timeline import**

```bash
cd frontend/src
sed -i "s|from '@/components/ui/AdminGlassCard'|from '@/components/ui/GlassCardAdmin'|g" \
  app/admin/timeline/page.tsx
```

- [ ] **Step 3: Verify**

```bash
cd frontend
rg -rn "AdminGlassCard" src -g "*.tsx"
```

Expected: no output.

---

### Task 6: Full Verification

- [ ] **Step 1: Run TypeScript check**

```bash
cd frontend
npx tsc --noEmit --pretty false
```

Expected: EXIT_CODE=0.

- [ ] **Step 2: Run production build**

```bash
cd frontend
npx next build
```

Expected: build succeeds, 43 pages generated.

- [ ] **Step 3: Verify no stale admin component files**

```bash
cd frontend/src/components/admin
ls EmptyState.tsx LoadingState.tsx DataTable.tsx ConfirmDialog.tsx 2>&1
```

Expected: "No such file or directory" for all four.

- [ ] **Step 4: Verify no stale feedback/ConfirmDialog**

```bash
ls frontend/src/components/feedback/ConfirmDialog.tsx 2>&1
```

Expected: "No such file or directory".

---

## Self-Review

**Spec coverage:**
- EmptyState: Task 1
- LoadingState: Task 2
- DataTable: Task 3
- ConfirmDialog: Task 4
- GlassCard: Task 5
- Verification: Task 6

**Placeholder scan:** No TBD/TODO. All paths, commands, and expected outputs are concrete.

**Type consistency:** All import path replacements use the same pattern. No new types or APIs introduced — only file paths change.
