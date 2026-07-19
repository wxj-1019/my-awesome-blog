# 前端主题全面检查报告

> 日期：2026-07-19  
> 目标：主题内容统一管理，便于后续统一添加/修改  
> 策略：统一 light/dark 语义 token，**暂不**第二套皮肤

## 1. 统一管理架构（已落地）

```
┌─────────────────────────────────────────────────────┐
│  theme-config.ts     STORAGE_KEY、fallback、readCssVar│
│  theme-context.tsx   Mode 状态 + 写 html class/data  │
│  layout FOUC 脚本    与 STORAGE_KEY 一致             │
│  variables.css       色值唯一来源（:root/.light/.dark）│
│  tailwind.config     colors → var(--*)               │
│  theme-tokens.md     使用约定                         │
│  eslint              限制 constants/theme 与 bg-[#]  │
└─────────────────────────────────────────────────────┘
         ↑ 组件只读语义类 / useTheme（仅 mode / 装饰显隐）
```

**改色 / 加变量**：只动 `variables.css`（+ 必要时 tailwind 映射）。  
**改默认 mode / 存储键**：只动 `theme-config.ts` + FOUC 字符串。

## 2. 扫描对比

| 类别 | 迁移前 | 迁移后（审查时） |
|------|--------|------------------|
| 业务 `getThemeClass(` 调用 | ~120 | **0**（仅 hook 定义保留） |
| `useThemedClasses` | 字符串表错位 | 映射语义 token |
| 导航/文章/表单双分支色 | 大量 | **已清** |
| 音乐/游戏 `bg-[#1a1a2e]` 等 | 多处 | **改为 card/background** |
| Wave 硬编码 stopColor | 有 | **CSS 变量 --wave-fill-*** |
| `constants/theme.ts` | 完整色板 | **仅类型 re-export** |
| Admin 外观 | 本地假设置 | **接线 setTheme** |
| ESLint 护栏 | 仅 framer | **+ 禁 constants/theme 引用 + warn bg-[#]** |

## 3. 完成清单（对照原 §4）

### P0 — 消除 getThemeClass（高流量）

- [x] `CommandBar.tsx` / `ArchiveDrawer.tsx` / `HoloCard` / `FeaturedCarousel` / `CommentTree` / `ArticleHeroStage`
- [x] `MessagePagination` / `ReportDialog`
- [x] `FocusCards` / `QuickNav` / `BreadcrumbDropdown`
- [x] `PasswordField` / `FileUploader`
- [x] `articles-content` / 文章侧栏 / `article-detail-content`
- [x] `profile-content` / `ProfileView`

### P1 — 消灭面板硬编码

- [x] `music/*` → `bg-card` / `bg-background` / `music-primary`
- [x] `games/*` / `contact` sidebar → 语义背景
- [x] `chat` ModelSelector / MessageBubble 面板 → `popover`/`muted`（交通灯装饰色保留）
- [x] `useCodeBlockEnhancement` → `bg-muted`

### P2 — 装饰分支

- [x] `Wave.tsx` / `WaveStack.tsx` → `--wave-fill-from/to`
- [x] `UserProfileMenu` 退出 → `text-destructive`
- [x] `theme-wrapper` Matrix/DynamicBackground **保留**（显隐非色值）

### P3 — 工程收敛

- [x] `constants/theme.ts` 收成 re-export
- [x] Admin 外观设置 → `useTheme().setTheme`
- [x] ESLint：禁 `@/constants/theme` 新引用；warn 任意 `bg-[#hex]`
- [x] 文档同步（本文件 + theme-tokens）

### 明确保留（边界）

- 留言用户彩虹色（`messageService`）= **内容色**，非主题 token
- macOS 设计 token 在 tailwind（可选后续并入变量）
- `ThemeCustomizer.tsx` 组件仍闲置；Admin 已用内联 mode 切换，无需强制删除

## 4. 如何统一修改主题色

1. 编辑 `frontend/src/styles/base/variables.css` 中 `.light` / `.dark`
2. 改 `--primary`、`--background`、`--glass-*`、`--wave-fill-*` 等
3. 刷新即可；**无需**改业务 TSX
4. 新 key：先加 CSS 变量，再在 `tailwind.config.js` 映射

## 5. 验证命令

```bash
cd frontend
npx tsc --noEmit
# 应为 0 业务调用：
rg -n "getThemeClass\(" src -g'*.{ts,tsx}' | rg -v "useThemedClasses"
# 硬编码色（存量 warn，应持续下降）：
rg -n "bg-\[#|text-\[#" src -g'*.{ts,tsx}' | rg -v "constants/theme" | wc -l
```

## 6. 审查迭代记录（2026-07-19）

| 检查项 | 结果 |
|--------|------|
| getThemeClass 业务调用 | 0 |
| tsc | 通过 |
| 暗色 wave 变量 | 已写入 `.dark` |
| FOUC / Provider 同源 | `theme` + `data-mode` |
| 单一色值来源 | `variables.css` |
| 新代码护栏 | ESLint |

**结论：** theme-audit 所列 P0–P3 **已完成**。主题可统一改 CSS 维护；后续仅需按 ESLint warn 继续消零星 `bg-[#]`，以及可选删除闲置 `ThemeCustomizer.tsx`。
