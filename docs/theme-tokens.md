# 主题 Token 约定（统一 light/dark）

> 更新：2026-07-19  
> 范围：先统一语义 token，**暂不**引入第二套皮肤（`themeId`）。

## 目标

- 组件只消费 **语义 token**，不写 `isDark ? A : B` 色值分支。
- light / dark 仅通过 CSS 变量切换（`html.light` / `html.dark`）。
- 将来加皮肤时：新增 `[data-theme="…"]` 覆盖变量，组件零改或极少改。

## 权威来源

| 层 | 路径 |
|----|------|
| CSS 变量 | `frontend/src/styles/base/variables.css` |
| Tailwind 映射 | `frontend/tailwind.config.js` → `colors.*` |
| Mode 状态 | `frontend/src/context/theme-context.tsx` |
| FOUC | `frontend/src/app/layout.tsx` 内联脚本 |

## 语义 Token 清单（组件优先用这些）

| Token | Tailwind 示例 | 用途 |
|-------|----------------|------|
| background / foreground | `bg-background` `text-foreground` | 页面底、主文字 |
| card / card-foreground | `bg-card` `text-card-foreground` | 卡片 |
| primary / primary-foreground | `bg-primary` `text-primary` | 主操作、强调 |
| secondary / secondary-foreground | `bg-secondary` | 次要面 |
| muted / muted-foreground | `text-muted-foreground` | 辅助文字 |
| accent / accent-foreground | `text-accent` | 点缀 |
| border / input / ring | `border-border` `ring-ring` | 边框、焦点 |
| popover | `bg-popover` | 浮层/下拉 |
| glass / glass-border / glass-glow | `bg-glass` `border-glass-border` | 玻璃拟态 |
| destructive | `bg-destructive` | 危险操作（= error 语义） |
| tech-* | `text-tech-cyan` | 品牌科技色（尽量少用，优先 primary） |

## 使用规范

```tsx
// ✅ 推荐
<div className="bg-background text-foreground">
  <div className="bg-card border border-border text-card-foreground rounded-xl">
    <span className="text-muted-foreground">辅助</span>
    <button className="bg-primary text-primary-foreground">确定</button>
  </div>
</div>

// ❌ 避免（新代码）
const c = isDark ? 'text-cyan-300' : 'text-blue-600'
getThemeClass('bg-black text-white', 'bg-white text-black')
```

## 兼容层

- `useThemedClasses()`：`cardBgClass` / `textClass` 等已映射到上表语义类，供存量页面使用。
- `getThemeClass(dark, light)`：**迁移期**保留，新代码勿增。
- `constants/theme.ts`：历史色板，勿再扩展；以 CSS 变量为准。

## 切换 Mode

1. `setTheme('light' | 'dark' | 'auto')`
2. Provider 写 `html` 的 `light`/`dark` class + `data-theme`
3. `variables.css` 中 `.light` / `.dark` 覆盖变量
4. 组件自动变色（无需重算 class 字符串）

## 以后加皮肤（预留，本迭代不做）

```css
/* 示例：不改组件 */
html[data-theme-pack="aurora"].dark {
  --primary: #a78bfa;
  --ring: #a78bfa;
  --tech-cyan: #a78bfa;
}
```

Context 届时增加 `themePack` / `data-theme-pack`，与 mode 正交。

## 相关

- UI 规则：`docs/rules/ui-design-rules.md` §2
- 玻璃组件：`GlassCard` 已纯 token
