# 公开页系统统一设计（PageShell 批次）

> 日期：2026-07-20  
> 状态：已批准并实施  
> 路径：A · 轻量 Shell + 渐进落地  
> 用户指示：spec → plan → 直接执行，不二次确认  

## 1. 范围

**包含**
- 新建 `PageShell`、`PageHeader`
- About、Login、`/home`、`/tools`、Unauthorized 接入

**排除**
- Contact 及子组件（二期）
- 首页 `/` 大动效、articles 沉浸、messages、admin

## 2. 目标

| 目标 | 验收 |
|------|------|
| 统一内容型页面外层 | 目标页使用 `PageShell` |
| 统一页头 | hub/about 使用 `PageHeader` |
| 语义 token | 目标页主文案无 `text-gray-*` / login 卡片无 inline rgba |
| 玻璃气质 | About 用 `GlassCard`；Login 卡片语义 glass |
| 最小改动 | 不改 API；login 浮动 label 结构尽量保留 |

## 3. 组件 API

### PageShell — `frontend/src/components/layout/PageShell.tsx`

- `children`, `className`, `containerClassName`
- `contained` 默认 `true`；`false` 仅外层（login 全屏居中）
- `density`: `default` | `narrow` | `flush`
- 外层：`min-h-[70vh]` + `bg-background text-foreground`
- default 内容：`container mx-auto px-4 sm:px-6 pt-24 pb-12 md:pb-16`

### PageHeader — `frontend/src/components/layout/PageHeader.tsx`

- `title`, `description?`, `icon?` (LucideIcon), `align`: `center` | `left`
- 图标底：`bg-primary/15 text-primary`
- About：`align="left"`；hubs：`align="center"`

## 4. 各页

- **About**：PageShell + PageHeader left + GlassCard 替换 Card
- **Login**：去 inline rgba；语义色；GlassCard 或等价 class；Button primary
- **home/tools**：PageShell + PageHeader，列表不变
- **Unauthorized**：PageShell + destructive token + Button asChild Link

## 5. 验证

- `cd frontend && npm run type-check`
- 目视 light/dark：about、login、home、tools、unauthorized

## 6. 审查迭代（2026-07-20）

| 级别 | 问题 | 处理 |
|------|------|------|
| Critical | PageShell 默认 main 嵌套根 main | 默认改为 `as="div"` |
| Critical | login/layout 额外 main | 改为 `div` |
| Important | login-form 硬编码白/青 | focus/valid/placeholder/underline 改 CSS 变量 |
| Important | home 未用 Route 类型 | 与 tools 对齐 |
| Important | narrow 底距偏紧 | 恢复 md 呼吸感 |
| Important | about 标题变小 | PageHeader `size="lg"` |
| Minor | min-h 类冲突 | 互斥 class |
| Minor | 无必要 use client | PageShell/PageHeader 去掉 |
| Minor | 联系我们 button | 改为 Link |
