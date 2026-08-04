# Skill 详情页：站内 SKILL.md 预览与下载

> 状态：待用户审阅规格  
> 日期：2026-07-25  
> 范围：`/tools/skills/[slug]` 详情页 + 静态内容托管  
> 相关代码：`frontend/src/app/tools/skills/`、`frontend/src/components/skills/`、`frontend/src/types/skill.ts`、`frontend/src/mock/skills.ts`

## 1. 背景与目标

当前 Skill 详情页仅展示策展文案（简介、亮点、场景、示例提示词）与 GitHub `sourceUrl`，**不能**在站内阅读或下载 skill 的 `SKILL.md` 正文。

**目标（已确认）：**

- 站内托管每个 skill 的 **一份** `SKILL.md`
- 详情页 **页内可展开预览** + **下载按钮**
- 下载文件名为 **`{slug}-SKILL.md`**
- 默认折叠，预览约 **16 行**

**非目标（YAGNI）：**

- 不从 GitHub 运行时拉取
- 不做多文件树 / zip 打包
- 不做在线编辑或后台 CMS 上传
- 不保证与上游仓库实时同步（策展副本 + 「查看来源」指向官方）

## 2. 方案选择

采用 **方案 A：`public/skills/<slug>/SKILL.md` 静态托管**。

| 项 | 决策 |
|----|------|
| 存储 | `frontend/public/skills/<slug>/SKILL.md` |
| 公开 URL | `/skills/<slug>/SKILL.md` |
| 下载文件名 | `{slug}-SKILL.md` |
| 预览数据 | Server 组件构建时读盘，经 props 下发 Markdown 字符串 |
| 下载方式 | 同源静态链接；需带自定义文件名时用小型下载触发（见 §4.3） |
| 无文件时 | 不展示预览/下载主区块，或显示「暂无托管正文」；`sourceUrl` 仍可用 |

**不选 B（content + Route Handler）**：多一层 API，对本期单文件预览过重。  
**不选 C（内嵌 mock）**：难维护、难当文件下载。

## 3. 数据模型

扩展 `ShowcaseSkill`（`frontend/src/types/skill.ts`）：

```ts
/** 站内托管的 skill 正文路径（站点根相对），如 /skills/taste/SKILL.md */
contentPath?: string;
```

- 有 `contentPath` 且构建时能读到文件 → 注入 `contentMarkdown: string`
- 有 `contentPath` 但文件缺失 → `contentMarkdown: null`，UI 空态
- 无 `contentPath` → 不渲染「Skill 文件」区块

`mock/skills.ts`：为现有 5 个 slug 填入对应 `contentPath`。

## 4. 内容存放与首批文件

### 4.1 目录约定

```
frontend/public/skills/
  taste/SKILL.md
  superpowers/SKILL.md
  brainstorm/SKILL.md
  frontend-design/SKILL.md
  webapp-testing/SKILL.md
```

### 4.2 内容来源与合规

- 从各 skill 的 `sourceUrl` 对应公开仓库整理/摘录可再分发的 `SKILL.md` 策展副本
- 详情页保留「查看来源」；可选短文案：「以下为站内策展副本，以官方仓库为准」
- 仅收录允许再分发的文本；实现阶段若某上游许可不清，可先放精简说明 md，不阻塞 UI

### 4.3 下载文件名

用户确认下载名为 **`{slug}-SKILL.md`**。

静态 `<a href="/skills/taste/SKILL.md" download>` 在跨路径时浏览器常忽略自定义名，且同源不同路径对 `download` 文件名支持不一致。实现约定：

1. **优先**：详情页「下载」按钮使用客户端轻量处理——`fetch(contentPath)` → `Blob` → 临时 `<a download="{slug}-SKILL.md">` 触发（同源、无额外后端）
2. **降级**：`fetch` 失败时 `window.open(contentPath)` 或普通链接打开原始 `SKILL.md`

不新增后端 API。

## 5. 页面与组件

### 5.1 Server：`[slug]/page.tsx`

在现有 `findSkill` / `generateStaticParams` / `generateMetadata` 之上：

1. 解析 `contentPath`（若存在）
2. 用 Node `fs` 读取 `path.join(process.cwd(), 'public', ...)` 对应文件（注意 `public` 前缀与 URL 路径映射）
3. 将 `contentMarkdown: string | null` 传入 `SkillDetailContent`

构建期读盘，静态导出/SSG 友好；客户端无需为预览再请求一次。

### 5.2 Client：`skill-detail-content.tsx`

在「示例提示词」与「查看来源」之间插入 **「Skill 文件」** 区块。

### 5.3 新组件：`SkillContentPanel`（建议路径 `frontend/src/components/skills/SkillContentPanel.tsx`）

**职责：** 折叠预览 + Markdown 渲染 + 下载。

**Props（示意）：**

```ts
interface SkillContentPanelProps {
  slug: string;
  /** 静态 URL，如 /skills/taste/SKILL.md */
  contentPath: string;
  /** Server 注入的全文；null 表示缺失 */
  contentMarkdown: string | null;
  /** 默认折叠预览行数，默认 16 */
  previewLines?: number;
}
```

**UI 行为：**

| 状态 | 行为 |
|------|------|
| `contentMarkdown == null` | 展示空态文案「暂无托管正文」，无下载或下载禁用 |
| 有内容、默认 | 折叠：展示前约 **16 行**（按 `\n` 切分；不足 16 行则全文且可不显示「展开」） |
| 展开 | 展示全文；按钮文案在「展开全文 / 收起」间切换 |
| 下载 | 见 §4.3，成功时文件名为 `{slug}-SKILL.md` |

**视觉：**

- `GlassCard` 承载，与 `SkillPromptCard` 风格一致
- 标题行：图标 + `SKILL.md` + 可选元信息
- 正文区：`font-mono` 或既有文章 Markdown 样式二选一；**优先复用站内已有 `react-markdown` + remark-gfm 配置**，只读
- 操作按钮：主色/描边按钮，带 `focus-visible` ring
- 动效：折叠高度可用 CSS/`grid-template-rows` 或既有 motion；遵守 `prefers-reduced-motion`（减少时直接切内容，无动画）

**无障碍：**

- 展开控件为 `<button type="button">`，`aria-expanded`
- 预览区域可用 `aria-label="SKILL.md 预览"`
- 下载控件可访问名称含「下载 {slug}-SKILL.md」

## 6. 数据流

```
public/skills/<slug>/SKILL.md
        │
        ├─ 静态服务 ──► GET /skills/<slug>/SKILL.md（下载 fetch 源）
        │
        └─ [slug]/page.tsx (Server fs.readFile)
                 │
                 ▼
         SkillDetailContent (props)
                 │
                 ▼
         SkillContentPanel
           ├─ 折叠/展开预览（Markdown）
           └─ 下载 → Blob + {slug}-SKILL.md
```

## 7. 错误与边界

| 情况 | 处理 |
|------|------|
| 文件不存在 | `contentMarkdown = null`，空态；不抛 500 导致整页 notFound |
| 文件为空 | 视为无有效正文，同空态或显示「文件为空」 |
| Markdown 极大 | 本期 skill 体量可控；若单文件 > 200KB 可后续加截断，本期不强制 |
| 无 `contentPath` | 不渲染 `SkillContentPanel` |
| 下载 fetch 失败 | 降级为新标签打开 `contentPath` |

## 8. 测试计划

1. **单元 / 组件**
   - `SkillContentPanel`：默认折叠只含前 16 行逻辑（可用短 fixture）；展开后含全文标记
   - `contentMarkdown === null` 显示空态
   - 下载触发函数对文件名 `{slug}-SKILL.md` 的约定（可测纯函数，不必真下文件）
2. **集成（可选）**
   - 有 `contentPath` 的 slug 页面 props 含非空 markdown（若易 mock fs）
3. **手动**
   - 五个详情页均可预览与下载
   - 硬刷新、移动端折叠按钮可用

## 9. 实现任务拆分（供 writing-plans 使用）

1. 扩展类型 + mock `contentPath`
2. 添加 5 份 `public/skills/.../SKILL.md` 策展内容
3. Server 读文件并传入详情页
4. 实现 `SkillContentPanel` 并挂到详情内容区
5. 测试 + 本地验证
6. 提交；按需部署前端

## 10. 验收标准

- [ ] 详情页在示例提示词下方可见「Skill 文件」区块（有托管内容时）
- [ ] 默认折叠，预览约 16 行；可展开全文
- [ ] 点击下载得到 `{slug}-SKILL.md`
- [ ] 文件缺失时不白屏，有空态
- [ ] 「查看来源」仍可用
- [ ] `tsc` 与既有前端测试通过

## 11. 已确认决策摘要

| 问题 | 结论 |
|------|------|
| 内容来源 | 站内托管 SKILL.md |
| 交互 | 页内可展开预览 + 下载 |
| 文件范围 | 每 skill 仅一份 SKILL.md |
| 实现方案 | A：`public/skills/<slug>/SKILL.md` |
| 下载文件名 | `{slug}-SKILL.md` |
| 默认预览行数 | 约 16 行 |
