# 公共组件收敛设计

> 目标：消除 `ui/` 和 `admin/` 之间五组功能重复的组件，统一维护入口。

## 1. 范围

| 组件 | 现状 | 目标 |
|---|---|---|
| EmptyState | `ui/EmptyState`（18行） + `admin/EmptyState`（130行） | 保留 admin 版，迁入 `ui/EmptyState` |
| LoadingState | `ui/LoadingState`（18行） + `admin/LoadingState`（80行） | 保留 admin 版，迁入 `ui/LoadingState` |
| DataTable | `ui/DataTable`（100行） + `admin/DataTable`（300行） | 保留 admin 版，迁入 `ui/DataTable` |
| ConfirmDialog | `ui/ConfirmDialog` + `feedback/ConfirmDialog` + `admin/ConfirmDialog` | 保留 admin 版，迁入 `ui/ConfirmDialog` |
| GlassCard | `ui/GlassCard`（已归一化） + `ui/GlassCardAdmin` + `ui/AdminGlassCard` | 删 `AdminGlassCard`，保留 `GlassCardAdmin` |

不动的：`admin/Button`（API 完全不同，留到后续）。

## 2. 迁移规则

- 保留组件的 **Props API 不变**，只是文件位置变动
- 所有导入从 `@/components/admin/X` 改为 `@/components/ui/X`
- 原 `admin/X.tsx` 删除
- 原 `ui/X.tsx` 内容被 admin 版覆盖

## 3. 分组件说明

### 3.1 EmptyState

**保留版本**: `admin/EmptyState.tsx`

**API**:
```tsx
interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType;
  action?: { label: string; href?: string; onClick?: () => void };
  variant?: 'default' | 'search' | 'error' | 'create';
}
```

**迁移**:
- `admin/EmptyState.tsx` 内容覆盖写入 `ui/EmptyState.tsx`
- 删除 `admin/EmptyState.tsx`
- 所有 `@/components/admin/EmptyState` → `@/components/ui/EmptyState`

### 3.2 LoadingState

**保留版本**: `admin/LoadingState.tsx`

**API**:
```tsx
interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
}
```

**迁移**: 同上模式。

### 3.3 DataTable

**保留版本**: `admin/DataTable.tsx`

**API**:
```tsx
interface Column<T> {
  key: string; title: string; width?: string | number;
  sortable?: boolean; filterable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}
interface DataTableProps<T> {
  data: T[]; columns: Column<T>[];
  loading?: boolean; pagination?: boolean; selectable?: boolean;
  pageSize?: number; onRowClick?: (row: T, index: number) => void;
}
```

**迁移**: 同上模式。目前只有 `admin/test/page.tsx` 引用 admin 版 DataTable。

### 3.4 ConfirmDialog

**保留版本**: `admin/ConfirmDialog.tsx`

**API**:
```tsx
interface ConfirmDialogProps {
  isOpen: boolean; onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string; description?: string;
  confirmText?: string; cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}
```

**迁移**:
- `admin/ConfirmDialog.tsx` → `ui/ConfirmDialog.tsx`
- 删除 `admin/ConfirmDialog.tsx` 和 `feedback/ConfirmDialog.tsx`
- 所有 `@/components/admin/ConfirmDialog` 和 `@/components/feedback/ConfirmDialog` → `@/components/ui/ConfirmDialog`

### 3.5 GlassCard

**保留版本**: `ui/GlassCardAdmin.tsx`（继续维护）

**删除**: `ui/AdminGlassCard.tsx`

**迁移**: `admin/timeline/page.tsx` 中 `AdminGlassCard` → `GlassCardAdmin`

## 4. 影响面

| 改动类型 | 数量 |
|---|---|
| 组件文件覆盖 | 5 个（`ui/X.tsx`） |
| 组件文件删除 | 6 个（`admin/X.tsx` × 4 + `feedback/ConfirmDialog` + `ui/AdminGlassCard`） |
| 页面导入更新 | ~20 个后台页面 |
| 导入路径替换 | `@/components/admin/{EmptyState,LoadingState,DataTable,ConfirmDialog}` → `@/components/ui/*` |

## 5. 验证

- `npx tsc --noEmit` 通过
- `npx next build` 通过
- 无残留 `@/components/admin/{EmptyState,LoadingState,DataTable,ConfirmDialog}` 导入
- 无残留 `@/components/feedback/ConfirmDialog` 导入
