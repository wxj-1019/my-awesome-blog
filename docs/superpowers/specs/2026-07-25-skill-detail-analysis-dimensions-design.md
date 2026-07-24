# Skill 详情页：详细解析维度

> 状态：已确认  
> 日期：2026-07-25  
> 范围：`/tools/skills/[slug]` 详情页 + 数据模型  
> 相关：`frontend/src/types/skill.ts`、`frontend/src/mock/skills.ts`、`frontend/src/app/tools/skills/[slug]/`

## 1. 背景与目标

当前详情页内容区块：简介 → 能力亮点 → 适用场景 → 示例提示词 → SKILL.md → 来源。维度偏少，单个 skill 没讲透。

**目标（已确认）：**

- 为每个 skill 增加 4 个解析维度：**工作原理、最佳实践、适合/不适合对比、关联 skill 互链**
- 内容写进数据模型（结构化字段），详情页从 props 渲染
- 把单个 skill 讲透，并形成 skill 间的知识网

**非目标（YAGNI）：**

- 不扩 skill 数量（本期只讲透现有 5 个）
- 不做后台编辑/CMS
- 不改 Hero、索引页、SkillContentPanel、SKILL.md 文件、背景系统
- 解析内容不写进 SKILL.md（避免两套来源割裂）

## 2. 数据模型扩展（`frontend/src/types/skill.ts`）

`ShowcaseSkill` 新增 4 个可选字段：

```ts
/** 工作原理：在 Agent 工作流中的运作机制（2-4 条要点） */
howItWorks?: string[];
/** 最佳实践 / 上手建议（3-5 条） */
bestPractices?: string[];
/** 适合 / 不适合对比 */
fitMatrix?: { fit: string[]; notFit: string[] };
/** 关联 skill：馆内 slug 列表，详情页互链 */
relatedSlugs?: string[];
```

`mock/skills.ts`：为 5 个 skill 补齐这 4 个字段。`relatedSlugs` 指向 `showcaseSkills` 中已存在的 slug。

## 3. 详情页区块顺序

调整后完整顺序：

```
Hero
└ 简介
└ 能力亮点
└ 工作原理          ← 新增
└ 最佳实践          ← 新增
└ 适合 / 不适合      ← 新增
└ 适用场景
└ 示例提示词
└ SKILL.md 预览
└ 关联 skill        ← 新增
└ 来源外链
└ 底部导航（上/下/返回）
```

「工作原理」「最佳实践」复用既有亮点列表样式（换图标），不新建组件。

## 4. 新组件

### 4.1 `SkillFitMatrix`（`frontend/src/components/skills/SkillFitMatrix.tsx`）

两列对比卡片：

- 左列「适合」（绿色 ✓，`CheckCircle` 图标，`fit` 数组）
- 右列「不适合」（灰色 ✗，`XCircle` 图标，`notFit` 数组）
- `GlassCard` 承载，移动端单列堆叠、桌面端两列
- props：`fit: string[]`、`notFit: string[]`

### 4.2 `SkillRelated`（`frontend/src/components/skills/SkillRelated.tsx`）

关联 skill 卡片链：

- 横向排列的卡片，每个含名称 + 领域徽章，点击跳 `/tools/skills/{slug}`
- props：`related: { slug: string; name: string; domain: ShowcaseSkill['domain'] }[]`
- 空数组时不渲染（由详情页控制）

## 5. 关联 skill 解析逻辑

slug → 卡片数据的解析在 **Server**（`[slug]/page.tsx`）完成，避免 Client 反查 mock：

```ts
const related = (skill.relatedSlugs ?? [])
  .map((s) => showcaseSkills.find((x) => x.slug === s))
  .filter((x): x is ShowcaseSkill => Boolean(x))
  .map((x) => ({ slug: x.slug, name: x.name, domain: x.domain }));
```

传入 `SkillDetailContent` 的新 prop `related`。`relatedSlugs` 缺失或 slug 不存在时 `related` 为空数组，区块不渲染。

## 6. 空态与兼容

- 所有新字段可选；缺失时不渲染对应区块（与现有 `scenes?` 一致）
- `fitMatrix` 的 `fit`/`notFit` 任一为空时仍渲染该列（空列显示「—」或省略，实现时定）
- 旧数据不补字段也不报错

## 7. 测试

- `SkillFitMatrix.test.tsx`：两列分别渲染 fit/notFit；空数组不崩
- `SkillRelated.test.tsx`：渲染卡片、链接 href 为 `/tools/skills/{slug}`、领域徽章正确
- 既有测试不回归（Hero/索引/SkillContentPanel 不动）

## 8. 范围与不做

- **改**：`types/skill.ts`、`mock/skills.ts`、`skill-detail-content.tsx`、`[slug]/page.tsx`
- **新增**：`SkillFitMatrix.tsx`、`SkillRelated.tsx` 及其测试
- **不改**：Hero、索引页、SkillContentPanel、SKILL.md 文件、背景、token

## 9. 验收标准

- [ ] 详情页出现 4 个新维度区块（有数据时）
- [ ] 适合/不适合为两列对比
- [ ] 关联 skill 可点击跳转对应详情页
- [ ] 缺失字段不渲染对应区块，不报错
- [ ] `tsc` 通过；前端测试全绿

## 10. 已确认决策摘要

| 问题 | 结论 |
|------|------|
| 优化方向 | 单个 skill 讲更透（加解析维度） |
| 解析维度 | 工作原理 / 最佳实践 / 适合不适合 / 关联互链 |
| 内容存放 | 写进数据模型（结构化字段） |
| 是否扩数量 | 否，本期只讲透 |
