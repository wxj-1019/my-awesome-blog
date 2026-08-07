# image-gen 创作台重构 · 设计文档

> 日期：2026-08-08 · 状态：已获用户批准
> 页面：`/tools/image-gen`（图片·视频生成工具页）
> 前置修复：2026-08-08 已修复前后端 payload 契约（workflow_inputs / 视频参数），本次为纯 UI/UX 优化

## 1. 背景与目标

页面功能已恢复（生图/生视频可用），但 UI/UX 存在粗糙点：

**真实性问题**
1. GenDrawer「账户」Tab 文案承诺"数据每 30 秒自动刷新"，实际只在抽屉打开时加载一次（无轮询）——UI 说谎
2. 生成中只有静态文案"正在排队生成…"，无阶段/进度反馈
3. 视频结果无封面帧，加载中黑屏

**视觉/交互粗糙点**
4. 类型切换（图片/视频）是裸文字按钮，无图标、无滑移指示，切换时表单内容突变
5. 尺寸/张数选择器只是小文字按钮，视觉层级弱
6. 提示词输入区无字数统计、无一键清空
7. 结果图片无骨架屏、无渐进出现感
8. 生成按钮为普通 primary，无"开始创作"氛围

**目标**：在不动后端、不破坏现有功能的约束下，将页面重构为「创作台」模式（左表单 + 右画布），修复真实性问题，打磨交互细节，全程遵守项目「深海 × 电影 / 克制的惊艳」设计语言。

## 2. 设计决策

### 2.1 布局（创作台模式）

- 保留 `PageShell` + `PageActHeader` 幕标页头与返回面包屑（叙事完整性，不动）
- **lg+ 双栏**：`grid lg:grid-cols-[minmax(280px,36%)_minmax(0,64%)] lg:items-start`，与现布局一致
- 画布列（右）`lg:sticky top-24` 视口自适应：`lg:h-[calc(100dvh-8rem)] lg:overflow-y-auto`，生成过程中输入区始终可滚动可操作
- **移动端**：单列堆叠（输入 → 画布）；画布定高 `min-h-[420px]`，内部滚动

### 2.2 输入区（左列）

| 元素 | 设计 |
|---|---|
| 类型切换 | 图标化（`ImageIcon` / `Clapperboard`）+ 滑动指示器：`motion.div layoutId="gen-kind-indicator"` 背景滑移（`bg-primary` 胶囊），`aria-pressed` 保留；reduced-motion 时 `layoutId={undefined}` |
| 提示词 | 保留 textarea（maxLength 1000）+ 新增字数统计 `n/1000`（`tabular-nums`）+ 有内容时显示一键清空（`X` 图标按钮，`aria-label="清空提示词"`） |
| 示例提示词 | 保留 chips（现状） |
| 尺寸/张数 | 尺寸预设带图形图标：小矩形示意（`aspect-square` / `aspect-[3/4]` / `aspect-[4/3]` 的 `w-3 h-*` 装饰块）；张数保留 1/2/4 胶囊 |
| 生成按钮 | 氛围渐变 `bg-gradient-to-r from-tech-cyan to-tech-sky`（token 类，禁止裸 hex）+ 三态：idle「✦ 生成图片/视频」→ submitting「提交中…」→ polling「生成中… 可取消」；`disabled` 与 `aria-busy` 语义保留；图标 `Loader2 animate-spin` 保留 |
| 错误 | 保留 `role=alert` + 重试按钮（现状已合规） |

### 2.3 画布（右列，核心改动）

**四态阶段**：

1. **空态（idle）**：灵感引导——4 张示例提示词卡片（`GlassCard` 小卡，点击直接填入输入区并聚焦）+ 历史恢复入口（有历史时显示"查看历史"tab 提示）
2. **生成中（submitting/polling）**：三节点步进条 `排队中 → 生成中 → 完成`：
   - `submitting`（任务创建中）→ 节点 1 激活（`Loader2 animate-spin`）
   - `polling` + 轮询状态 `pending` → 节点 1 完成、节点 2 激活
   - `polling` + 轮询状态 `running` → 节点 2 完成、节点 3 激活（脉冲点）
   - 节点动效只动 opacity/transform；reduced-motion 静态
3. **成功（done）**：结果 reveal（现有 `Stagger` 保留）——图片网格骨架屏 → 渐次淡入；视频播放器（`preload="metadata"`）+ 加载中 spinner 覆盖层（`video.onWaiting`/onLoadStart 驱动）而非黑屏 + 下载按钮保留
4. **失败/无结果**：现状 `role=alert` + 重试；`done` 且无结果保留 `EmptyState` 空态

**Tab：「结果 / 历史」**（画布顶部小 tab）：
- 历史 tab 复用现有 `localStorage` 数据源（`GenHistoryEntry`，`loadHistory`），列表项 = 缩略图 + 提示词截断 + 类型/张数 + 相对时间；点击恢复（回填表单并切到结果 tab）、删除、清空——逻辑与 GenDrawer 历史 tab 一致，抽共用渲染或保持两份（最小改动：抽小组件 `HistoryList`，两处复用）
- 结果 tab 展示当前任务结果
- 与 GenDrawer 悬浮抽屉互补：抽屉 = 全局入口（历史 + 账户），画布 tab = 工作区内切换

### 2.4 真实性修复

- **账户 30s 自动轮询**：`image-gen-content.tsx` 中 `useEffect` 依赖 `drawerOpen`——打开时 `setInterval(refreshAccount, 30_000)` + 立即一次，关闭时 `clearInterval`；幂等（请求失败静默保留上次成功数据，仅在错误态显示）
- 视频播放器加载 spinner（见 2.3）

### 2.5 动效与规范红线

- 动效只从 `@/components/motion`（FadeIn / Stagger / HoverLift）与 `@/lib/framer-motion` 取；过渡时长用 `TRANSITION` 令牌（`MICRO/FAST`），不写裸数值
- 只动画 `transform`/`opacity`
- 颜色/阴影/圆角 100% 令牌类；禁止裸 hex、禁止 `dark:` 双色分支
- 触摸目标 ≥ 44×44px；`focus-visible` 靠全局兜底，不自写第三套焦点色
- 键盘全覆盖：tab 可切类型/tab/清空按钮；`aria-pressed` / `role="tablist"`+`role="tab"` 语义正确
- axe 0 critical/serious（a11y 套件更新）

### 2.6 拆分与文件

单文件过大时拆 `frontend/src/components/tools/image-gen/`：

- `HistoryList.tsx`（历史列表：缩略图 + 提示词截断 + 类型/张数 + 相对时间 + 恢复/删除/清空。画布 tab 优先复用它；GenDrawer 的 HistoryTab 若布局差异过大（抽屉窄版 14×14 缩略图）则保留各自实现，不强行合并）
- `CanvasStage.tsx`（画布四态：空态/进度/结果/失败）
- `ProgressSteps.tsx`（三节点步进条）
- `PromptInput.tsx`（提示词 + 字数 + 清空，可选，若输入区过大再拆）

**改动文件清单**：
- `frontend/src/app/tools/image-gen/image-gen-content.tsx`（重构主体）
- `frontend/src/components/ui/GenDrawer.tsx`（HistoryTab 复用 HistoryList，如有需要）
- 新增 `frontend/src/components/tools/image-gen/*`（按需）
- `frontend/__tests__/image-gen-content.test.tsx`（更新：tab 切换、进度状态、清空按钮、画布空态、30s 轮询）
- `frontend/__tests__/a11y/image-gen.a11y.test.tsx`（更新）

## 3. 测试与验证

1. 更新单元测试：画布 tab 切换、类型切换指示器、进度节点状态、字数/清空、账户 30s 轮询（fake timers）
2. 更新 a11y 套件：0 critical/serious
3. 本地四道闸：`npm run type-check` → `npm run lint`（0 error）→ `npm test` → `npm run build`
4. 部署（tar 同步 + `nohup server-redeploy.sh frontend`，遵循记忆中的部署流程）→ 线上验证：页面 200、生图/生视频任务创建成功（payload 不变）、构建产物含新组件

## 4. 不做的事（YAGNI）

- 不加负面词/风格/seed 等新参数（方案 C 范畴，本次不做）
- 不改后端 API、不改 payload 契约
- 不引入新依赖、不做全屏工作台
- 不迁移 GenDrawer 悬浮按钮（保留现状全局入口）
