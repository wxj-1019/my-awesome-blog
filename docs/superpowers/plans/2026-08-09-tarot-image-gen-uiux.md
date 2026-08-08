# 塔罗牌与生图页面 UI/UX 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变塔罗占卜和 RunningHub 生图业务逻辑的前提下，重排两个工具页的首屏层级、参数密度、状态反馈和响应式布局。

**Architecture:** 保留两个页面现有的客户端状态机、API 调用、localStorage 历史和共享页面壳，只调整页面编排与展示组件。塔罗页以“当前阶段”为唯一主视觉；生图页以“提示词 + 生成”为主操作，将高级参数收拢到设置区，结果画布继续作为桌面端 sticky 工作区。

**Tech Stack:** Next.js 16 App Router、React、TypeScript strict、Tailwind CSS、现有 `GlassCard` / `PageActHeader`、Lucide、项目封装的 motion、Jest + Testing Library + axe-core。

---

## 文件地图

- 修改 `frontend/src/app/tools/tarot/tarot-content.tsx`：塔罗问牌首屏、今日之牌、引导、阶段布局和操作层级。
- 修改 `frontend/src/components/tarot/SpreadSlots.tsx`：翻牌结果的牌位/状态视觉层级与移动端尺寸。
- 修改 `frontend/src/components/tarot/TarotStepper.tsx`：阶段条的当前步骤可读性与桌面/移动间距。
- 修改 `frontend/src/app/tools/image-gen/image-gen-content.tsx`：生成输入区的核心操作与设置区编排。
- 修改 `frontend/src/components/tools/image-gen/CanvasStage.tsx`：结果画布的空态、进度态、成功态信息层级。
- 视需要修改 `frontend/src/components/tools/image-gen/HistoryList.tsx`：仅用于统一画布历史项的操作密度；若现有样式已满足则不改。
- 新增 `frontend/src/app/tools/__tests__/tarot-image-gen-uiux.test.tsx`：页面级静态交互验收，覆盖核心控件、状态文本和可访问名称。
- 新增 `docs/superpowers/plans/2026-08-09-tarot-image-gen-uiux.md`：本实施计划。

## 实施约束

- 不修改 API 请求字段、轮询 hook、历史记录数据结构、localStorage key 或后端代码。
- 不新增依赖；动画只使用现有 `@/lib/framer-motion` / motion 组件。
- 新样式只使用 Tailwind 语义 token，不能加入裸 hex 或 `isDark ? A : B` 色值分支。
- 触控目标保持至少 44×44px；新增/调整的输入保持显式 label 或 `aria-label`。
- 不使用数组索引作为业务列表 key；静态装饰列表可保留现有例外。

---

### Task 1: 建立页面级验收基线

**Files:**
- Create: `frontend/src/app/tools/__tests__/tarot-image-gen-uiux.test.tsx`
- Read: `frontend/src/app/tools/tarot/tarot-content.tsx`
- Read: `frontend/src/app/tools/image-gen/image-gen-content.tsx`

- [ ] **Step 1: 写失败测试，锁定塔罗主流程控件**

测试应 mock `PageShell`、`PageActHeader`、复杂牌面组件、浏览器 localStorage，并渲染 `TarotContent`。断言：初始状态存在问题输入、牌阵选择和“开始占卜”；存在“占卜 / 牌义速查” tab；问题输入有 `label` 关联。

```tsx
expect(screen.getByLabelText('你的问题（可选）')).toBeInTheDocument();
expect(screen.getByRole('button', { name: '开始占卜' })).toBeInTheDocument();
expect(screen.getByRole('tab', { name: /占卜/ })).toHaveAttribute('aria-selected', 'true');
```

- [ ] **Step 2: 写失败测试，锁定生图核心操作**

测试应 mock `createGenTask`、`getGenAccount`、`uploadFile`、`useTaskPolling`、`CanvasStage` 和 `GenDrawer`。断言：初始状态有生成类型切换、提示词 label、生成按钮；空提示词时生成按钮禁用；点击示例提示词会回填提示词。

```tsx
expect(screen.getByLabelText('提示词')).toBeInTheDocument();
expect(screen.getByRole('button', { name: '生成图片' })).toBeDisabled();
await user.click(screen.getByRole('button', { name: /月光下的静谧湖泊/ }));
expect(screen.getByLabelText('提示词')).toHaveValue(EXAMPLE_PROMPT);
```

- [ ] **Step 3: 运行基线测试确认测试可执行**

Run: `cd frontend && npm test -- --runInBand src/app/tools/__tests__/tarot-image-gen-uiux.test.tsx`

Expected: 新增断言在当前实现中至少有一项因文案/结构尚未调整而失败，确认测试不是空测试。

- [ ] **Step 4: 提交测试基线**

```bash
git add frontend/src/app/tools/__tests__/tarot-image-gen-uiux.test.tsx
git commit -m "test(ui): add tarot and image generation UX baseline"
```

---

### Task 2: 重排塔罗问牌首屏

**Files:**
- Modify: `frontend/src/app/tools/tarot/tarot-content.tsx:344-514`

- [ ] **Step 1: 将首次引导并入问牌主卡顶部**

保留 `showOnboard`、`dismissOnboard` 和 localStorage 行为，把当前独立横条替换成主卡内部的低强调提示行。提示只保留“问题 + 牌阵 + 开始”的必要信息；关闭按钮仍为 44px 触控目标，并保留 `aria-label="关闭引导"`。

- [ ] **Step 2: 压缩今日之牌为辅助入口**

保留 `dailyCard` 和 `startWithDaily`，将 `GlassCard` 改成紧凑横向布局：缩略牌面固定约 48px 宽，说明最多两行，操作按钮使用次级边框样式。移动端允许说明自然换行，但不让“今日之牌”高于问牌主卡的视觉权重。

- [ ] **Step 3: 强化问牌主卡层级**

在问题 textarea、牌阵选择和主 CTA 之间建立明确的垂直节奏；牌阵按钮补充牌数/适用场景的轻量辅助信息，不改变 `tarotSpreads` 数据结构。保持 `htmlFor="tarot-question"`、200 字限制和现有快捷键行为。

- [ ] **Step 4: 调整桌面/移动容器比例**

移动端让主卡先于右侧历史信息出现；桌面端将主流程宽度限制在可读范围，保持左侧 `TarotStepper` 和右侧历史栏 sticky。不要改变 `phase` 分支或定时器。

- [ ] **Step 5: 运行塔罗基线测试**

Run: `cd frontend && npm test -- --runInBand src/app/tools/__tests__/tarot-image-gen-uiux.test.tsx`

Expected: 塔罗初始问牌控件、tab 和可访问 label 测试 PASS。

- [ ] **Step 6: 提交塔罗问牌布局**

```bash
git add frontend/src/app/tools/tarot/tarot-content.tsx
git commit -m "refactor(tarot): focus reading setup on primary action"
```

---

### Task 3: 优化塔罗阶段反馈与结果牌位

**Files:**
- Modify: `frontend/src/components/tarot/TarotStepper.tsx:36-73`
- Modify: `frontend/src/components/tarot/SpreadSlots.tsx:17-40`
- Modify: `frontend/src/app/tools/tarot/tarot-content.tsx:559-675`

- [ ] **Step 1: 提升进度条当前步骤语义**

保留四步映射和 `aria-current="step"`，让当前步骤有更明显的背景、编号/勾选对比和辅助说明；compact 模式在 390px 宽度保持单行不溢出，桌面垂直模式保留 sticky。

- [ ] **Step 2: 优化抽牌区状态栏**

在牌堆上方将“凭直觉点击牌背”和“已选 n / total”拆成主提示 + 数字状态；操作按钮形成主次关系：`代我抽牌` 为次级主操作，`撤销上一张` 为普通操作，`重新开始` 保持低强调。

- [ ] **Step 3: 优化 SpreadSlots 牌位信息**

保留 `drawn.map` 的稳定 key、翻牌回调和逆位逻辑。牌位标签、牌面和“点击翻开/牌名 · 朝向”形成一致的三层结构；移动端保持牌面可点击且不被压缩，桌面端增加必要的牌间距但不放大到影响解读区。

- [ ] **Step 4: 优化解读区顶部层级**

在 `ReadingPanel` 外层增加当前牌阵/结果上下文的轻量标题或状态提示；不改 `ReadingPanel` props，不改自动保存历史与滚动锚点。统计和历史继续位于解读之后。

- [ ] **Step 5: 运行交互与无障碍检查**

Run: `cd frontend && npm test -- --runInBand src/app/tools/__tests__/tarot-image-gen-uiux.test.tsx`

Expected: 初始页面测试、tab 测试和牌面交互相关断言 PASS；无新增 axe 违规。

- [ ] **Step 6: 提交塔罗阶段反馈**

```bash
git add frontend/src/components/tarot/TarotStepper.tsx frontend/src/components/tarot/SpreadSlots.tsx frontend/src/app/tools/tarot/tarot-content.tsx
git commit -m "refactor(tarot): clarify draw and reveal states"
```

---

### Task 4: 重排生图输入工作台

**Files:**
- Modify: `frontend/src/app/tools/image-gen/image-gen-content.tsx:390-783`

- [ ] **Step 1: 保持类型切换为第一控制**

保留图片/视频按钮、`kind` 状态和切换时清空参考图的竞态保护。调整切换容器和按钮高度，保证移动端两个按钮都满足触控尺寸，并保持 `aria-pressed`。

- [ ] **Step 2: 强化提示词主输入区**

提示词 label、textarea、字符计数、清空和示例提示词作为连续核心区域；主 CTA 紧跟在核心区域之后。保留示例回填时将焦点送回 `gen-prompt` 的行为。

- [ ] **Step 3: 将图片高级参数收拢到“生成设置”**

使用原生 `details/summary` 或项目已有折叠模式承载模型、参考图、画幅和张数。默认图片模式可见但弱化；视频模式完全不渲染无关设置。不要新增状态来复制 `effectiveModel`、`refImageUrl` 或 `size`。

- [ ] **Step 4: 统一参考图状态**

参考图未设置、URL 应用成功、上传成功、加载失败和移除状态继续沿用现有逻辑；只调整容器层级与文字密度。保留上传 input 的 `accept="image/*"`、URL 校验和错误 `role="alert"`。

- [ ] **Step 5: 明确生成状态反馈**

生成按钮继续支持提交中/轮询中取消、错误重试；将等待说明放到按钮下方的状态区，不让其挤压输入控件。保留 `aria-busy`。

- [ ] **Step 6: 运行生图基线测试**

Run: `cd frontend && npm test -- --runInBand src/app/tools/__tests__/tarot-image-gen-uiux.test.tsx`

Expected: 类型切换、提示词 label、空提示禁用、示例回填测试 PASS。

- [ ] **Step 7: 提交生图输入区**

```bash
git add frontend/src/app/tools/image-gen/image-gen-content.tsx
git commit -m "refactor(image-gen): simplify creative input workspace"
```

---

### Task 5: 优化生图结果画布层级

**Files:**
- Modify: `frontend/src/components/tools/image-gen/CanvasStage.tsx:135-431`
- Modify only if required: `frontend/src/components/tools/image-gen/HistoryList.tsx:41-137`

- [ ] **Step 1: 调整结果/历史 tab 的语义和视觉层级**

保留现有两个 tab、`activeTab`、恢复历史自动切回结果的逻辑。结果 tab 作为默认主面板，历史 tab 显示记录数或轻量提示，不重复渲染第二份历史数据。

- [ ] **Step 2: 优化 idle 空态**

保留示例提示词回填回调；将“还没有结果”空态调整为更明确的创作起点，示例按钮保持可点击、可聚焦和两列/单列响应式布局。

- [ ] **Step 3: 优化生成中与错误状态**

保留 `ProgressSteps`、`phase` 映射、取消入口由父组件处理。为生成中状态增加当前媒体类型和等待时长提示的清晰层级；错误状态保留 `role="alert"` 与重试操作，不增加无依据的进度百分比。

- [ ] **Step 4: 优化成功结果信息**

保留图片 Lightbox 索引过滤、失败图占位、视频播放器和下载链接。调整结果标题、数量/类型标记和媒体网格间距，使结果成为画布主视觉；不能改变 `failedImages`、`activeEntryId` 或图片错误回调。

- [ ] **Step 5: 判断是否需要修改 HistoryList**

仅当 CanvasStage 的新 tab 层级与列表间距不一致时，调整 `HistoryList` 的 padding、按钮尺寸和文本层级；不复制 `GenDrawer` 的业务逻辑。

- [ ] **Step 6: 运行组件测试**

Run: `cd frontend && npm test -- --runInBand src/app/tools/__tests__/tarot-image-gen-uiux.test.tsx`

Expected: 结果空态、生成中、错误重试和历史恢复相关断言 PASS。

- [ ] **Step 7: 提交结果画布优化**

```bash
git add frontend/src/components/tools/image-gen/CanvasStage.tsx frontend/src/components/tools/image-gen/HistoryList.tsx
 git commit -m "refactor(image-gen): clarify canvas states and results"
```

---

### Task 6: 页面级响应式与可访问性验证

**Files:**
- Modify: any files from Tasks 2-5 only if verification finds a concrete issue
- Test: `frontend/src/app/tools/__tests__/tarot-image-gen-uiux.test.tsx`

- [ ] **Step 1: 运行 lint、类型检查和页面测试**

```bash
cd frontend
npm run lint
npm run type-check
npm test -- --runInBand src/app/tools/__tests__/tarot-image-gen-uiux.test.tsx
```

Expected: 三个命令均退出码 0；若仓库已有无关 warning，只记录，不扩大修改范围。

- [ ] **Step 2: 启动前端开发服务器**

Run: `cd frontend && npm run dev`

Expected: 本地服务在 `http://localhost:3000` 启动；若端口被占用，使用下一个可用端口。

- [ ] **Step 3: 用 Playwright 检查桌面布局**

访问 `/tools/tarot` 与 `/tools/image-gen`，在约 1280×900 视口检查：页头、主卡、侧栏和画布无重叠；主 CTA 在首屏可见；生图结果栏保持 sticky；塔罗侧轨不遮挡主流程。

- [ ] **Step 4: 用 Playwright 检查移动布局**

在约 390×844 视口检查：无横向滚动；问题 textarea、牌阵按钮、类型切换、提示词、设置控件和生成按钮文字不溢出；牌面可点击；结果画布自然位于输入区之后。

- [ ] **Step 5: 检查主题与 reduced-motion**

分别切换 light/dark，确认正文、边框、主 CTA 和玻璃表面仍使用语义 token；使用 `prefers-reduced-motion: reduce` 检查没有新增必须完成的持续动画。

- [ ] **Step 6: 运行最终 diff 与状态检查**

```bash
git diff --check
git status --short
git log -5 --oneline
```

Expected: 无空白错误；只包含本次计划涉及的代码/测试/文档改动，用户已有的未跟踪视频海报资源保持不变。

- [ ] **Step 7: 提交验证修复（如有）**

```bash
git add frontend/src/app/tools frontend/src/components/tarot frontend/src/components/tools/image-gen
git commit -m "fix(ui): address responsive and accessibility review findings"
```

仅在确有验证修复时执行；无修复时不创建空提交。

---

## 自检结果

- 设计说明中的塔罗首屏降噪、阶段反馈、结果连续阅读均覆盖于 Tasks 2-3。
- 设计说明中的生图核心输入、设置收拢、画布层级和历史入口均覆盖于 Tasks 4-5。
- 响应式、主题、reduced-motion、可访问性、lint、type-check 和页面验证均覆盖于 Task 6。
- 未引入新的 API、状态管理或依赖；所有任务使用现有组件和状态接口。
