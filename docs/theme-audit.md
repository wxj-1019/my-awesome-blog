# 前端主题全面检查报告

> 日期：2026-07-19  
> 目标：主题内容统一管理，便于后续统一添加/修改  
> 策略：先统一 token（本阶段完成骨架 + 高优先级修复），暂不第二套皮肤

## 1. 统一管理架构（目标态）

```
┌─────────────────────────────────────────────────────┐
│  theme-config.ts     常量：STORAGE_KEY、fallback   │
│  theme-context.tsx   Mode 状态 + 写 html class      │
│  layout FOUC 脚本    与 STORAGE_KEY 一致            │
│  variables.css       色值唯一来源（:root/.light/.dark）│
│  tailwind.config     colors → var(--*)              │
│  theme-tokens.md     使用约定                        │
└─────────────────────────────────────────────────────┘
         ↑ 组件只读语义类 / useTheme.resolvedTheme（显隐）
```

**改色 / 加 mode 变量**：只动 `variables.css`（+ 必要时 tailwind 映射）。  
**改默认 mode / 存储键**：只动 `theme-config.ts` + FOUC 字符串。

## 2. 扫描摘要（检查时点）

| 类别 | 数量级 | 风险 |
|------|--------|------|
| `getThemeClass(` 调用 | ~120 | 双分支，阻碍换肤 |
| `useThemedClasses` 引用 | ~20 文件 | 兼容层，应逐步减 |
| `resolvedTheme ===` / `isDark ?` 分支 | ~20+ | 仅允许装饰显隐 |
| 组件内 `bg-[#…]` 硬编码 | 导航/音乐/文章多处 | 绕过 token |
| `Theme` 类型双定义 | context / types / constants | 已部分统一 |
| `ThemeCustomizer` | 仅自身引用 | 半成品，未挂路由 |

## 3. 本轮已落地的统一项

- [x] `lib/theme-config.ts`：STORAGE_KEY、fallback、`readCssVar`
- [x] `ThemeProvider` 使用 `THEME_STORAGE_KEY`；meta theme-color 读 `--background`
- [x] FOUC 写 `data-mode` + `data-theme`（解析后的 light/dark）
- [x] `variables.css` 语义 token 契约 + `--destructive`
- [x] `GlassCard` / `FriendLinkCard` / `PostGrid` 去掉亮暗色分支
- [x] `useThemedClasses` 映射到语义 Tailwind 类
- [x] 高频硬编码：`QuickNav` / `BreadcrumbDropdown` / `ReportDialog` 面板 → `bg-popover`
- [x] `HoloCard` 粉红硬编码 → `primary` token
- [x] 文档：`theme-tokens.md`、本审计文件、ui-design-rules §2

## 4. 待清理清单（按优先级，分批 PR）

### P0 — 继续消 `getThemeClass`（高流量页）

- [ ] `components/articles/CommandBar.tsx`（调用最多）
- [ ] `components/messages/MessagePagination.tsx`
- [ ] `app/articles/**` 侧栏组件（HotArticles、CategoryNav…）
- [ ] `app/profile/**`
- [ ] `components/form/PasswordField.tsx`、`FileUploader.tsx`

替换模式：

```tsx
// before
getThemeClass('text-white', 'text-gray-800')
// after
'text-foreground'
```

### P1 — 消灭 `bg-[#…]` 面板色

- [ ] `components/music/*`（`#1a1a2e` / `#0f0f23`）→ `bg-card` / `bg-background` 或 music 专用 token
- [ ] 若 music 需要独立品牌红：在 `variables.css` 增加 `--music-primary` 并映射 tailwind `music.primary`（已有部分）

### P2 — 装饰分支收敛

允许保留（非色值）：

- `theme-wrapper`：dark → Matrix / light → DynamicBackground  
- `HeroSection` 换视频源  

应收敛：

- [ ] `Wave.tsx` / `WaveStack.tsx` 硬编码 stopColor → CSS 变量  
- [ ] `UserProfileMenu` 红字用 `text-destructive`

### P3 — 工程收敛

- [ ] `constants/theme.ts` 仅保留类型 re-export 或删除  
- [ ] 删除未使用的 `ThemeCustomizer` 或挂到 settings 并只调 `setTheme`  
- [ ] ESLint 规则（可选）：限制 `getThemeClass` 新增、限制 `bg-[#`  
- [ ] 留言用户色板（`messageService` 彩虹色）保持「内容色」而非「主题色」，文档标明边界

## 5. 如何统一修改主题色（操作手册）

1. 打开 `frontend/src/styles/base/variables.css`  
2. 改 `.light` / `.dark` 中的 `--primary`、`--background`、`--glass-*` 等  
3. 刷新页面；**无需**改业务 TSX  
4. 若 Tailwind 没有对应 key，再在 `tailwind.config.js` 增加 `colors.xxx: 'var(--xxx)'`

## 6. 验证命令

```bash
cd frontend
npx tsc --noEmit
# 反模式计数（应随迁移下降）
rg -n "getThemeClass\(" src -g'*.{ts,tsx}' | wc -l
rg -n "bg-\[#" src -g'*.{ts,tsx}' | wc -l
```

## 7. 结论

| 问题 | 状态 |
|------|------|
| 是否有唯一色值来源 | **是**：`variables.css` |
| Mode 状态是否集中 | **是**：`theme-context` + `theme-config` |
| 组件是否全部 token 化 | **进行中**：核心路径已改，~100+ `getThemeClass` 待消 |
| 能否方便加/改主题 | **改色可以**；加第二皮肤需再引入 `theme-pack`（刻意未做） |

后续建议：按 §4 P0 每批清 3–5 个文件的 `getThemeClass`，计数归零后主题即可「只改 CSS」。
