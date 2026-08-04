# Skill 详情页详细解析维度 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 skill 详情页增加 4 个解析维度（工作原理、最佳实践、适合/不适合对比、关联 skill 互链），把单个 skill 讲透。

**Architecture:** 数据模型加 4 个可选字段；详情页加对应区块；`SkillFitMatrix`/`SkillRelated` 为独立组件；关联 slug 在 Server 解析为卡片数据传 Client。

**Tech Stack:** Next.js 16 App Router、React 18、TypeScript、Jest + Testing Library。

**Spec:** `docs/superpowers/specs/2026-07-25-skill-detail-analysis-dimensions-design.md`

---

## File map

| 路径 | 职责 |
|------|------|
| `frontend/src/types/skill.ts` | 加 4 个可选字段 |
| `frontend/src/mock/skills.ts` | 5 个 skill 补 4 维度数据 |
| `frontend/src/components/skills/SkillFitMatrix.tsx` | 新：适合/不适合两列对比 |
| `frontend/src/components/skills/SkillRelated.tsx` | 新：关联 skill 卡片链 |
| `frontend/src/app/tools/skills/[slug]/page.tsx` | Server 解析 relatedSlugs |
| `frontend/src/app/tools/skills/[slug]/skill-detail-content.tsx` | 挂载新区块 |
| `frontend/__tests__/SkillFitMatrix.test.tsx` | 新：组件测试 |
| `frontend/__tests__/SkillRelated.test.tsx` | 新：组件测试 |

---

### Task 1: 数据模型 + mock 数据

**Files:**
- Modify: `frontend/src/types/skill.ts`
- Modify: `frontend/src/mock/skills.ts`

- [ ] **Step 1: 扩展 `ShowcaseSkill`**

在 `contentPath` 字段后追加：

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

- [ ] **Step 2: 为 5 个 skill 补数据**

为每个 skill 对象追加 4 个字段（文案按 skill 定位撰写）。示例（taste）：

```ts
howItWorks: [
  '把设计师对布局、配色、排版、动效的判断写成 SKILL.md 约束规则',
  'Agent 在生成代码前先读取并内化这些规则，按规则做设计决策',
  '生成后可对照规则自检，标记「一眼 AI」的模板化产出并重构',
],
bestPractices: [
  '在项目启动时挂载 taste，让规则成为 Agent 的默认审美底座',
  '遇到不满意的设计，先问 Agent「按 taste 标准哪里最像 AI」，再让它改',
  '按项目气质选择不同审美人格，而非一套规则走天下',
  '定期更新规则以匹配你不断进化的品味',
],
fitMatrix: {
  fit: [
    '对设计有要求、不想让 AI 输出模板味的前端项目',
    '需要快速出原型但又要保持专业感的场景',
    '希望 Agent 像设计师一样「先想后做」的团队',
  ],
  notFit: [
    '只需要功能性界面、不在意审美的内部工具',
    '已有严格设计系统、Agent 只需按 token 执行的场景',
    '纯后端或无界面的项目',
  ],
},
relatedSlugs: ['frontend-design', 'superpowers'],
```

其余 4 个（superpowers/brainstorm/frontend-design/webapp-testing）按各自定位补齐。`relatedSlugs` 指向已有 slug（superpowers↔brainstorm 互指、frontend-design↔taste 互指、webapp-testing→superpowers 等）。

- [ ] **Step 3: type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/skill.ts frontend/src/mock/skills.ts
git commit -m "feat(skills): 数据模型增加 4 个解析维度字段"
```

---

### Task 2: SkillFitMatrix 组件 + 测试（TDD）

**Files:**
- Create: `frontend/__tests__/SkillFitMatrix.test.tsx`
- Create: `frontend/src/components/skills/SkillFitMatrix.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
import { render, screen } from '@testing-library/react';
import SkillFitMatrix from '@/components/skills/SkillFitMatrix';

describe('SkillFitMatrix', () => {
  it('渲染两列：适合与不适合', () => {
    render(
      <SkillFitMatrix
        fit={['追求设计品质的前端项目', '快速出原型']}
        notFit={['纯后端项目', '已有严格设计系统']}
      />,
    );
    expect(screen.getByText('适合')).toBeInTheDocument();
    expect(screen.getByText('不适合')).toBeInTheDocument();
    expect(screen.getByText('追求设计品质的前端项目')).toBeInTheDocument();
    expect(screen.getByText('已有严格设计系统')).toBeInTheDocument();
  });

  it('空数组不崩溃', () => {
    render(<SkillFitMatrix fit={[]} notFit={[]} />);
    expect(screen.getByText('适合')).toBeInTheDocument();
    expect(screen.getByText('不适合')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx jest __tests__/SkillFitMatrix.test.tsx --no-coverage
```

Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `SkillFitMatrix.tsx`**

```tsx
import { CheckCircle, XCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

export interface SkillFitMatrixProps {
  fit: string[];
  notFit: string[];
}

/**
 * 适合 / 不适合 两列对比卡片。
 * 移动端单列堆叠，桌面端两列。
 */
export default function SkillFitMatrix({ fit, notFit }: SkillFitMatrixProps) {
  const Column = ({
    title,
    items,
    icon: Icon,
    tone,
  }: {
    title: string;
    items: string[];
    icon: typeof CheckCircle;
    tone: 'fit' | 'notFit';
  }) => (
    <div
      className={cn(
        'rounded-lg p-4',
        tone === 'fit'
          ? 'bg-emerald-500/5 border border-emerald-500/20'
          : 'bg-muted/30 border border-glass-border',
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon
          className={cn(
            'w-4 h-4',
            tone === 'fit' ? 'text-emerald-500' : 'text-muted-foreground',
          )}
          aria-hidden
        />
        <h3 className="font-display text-base font-bold text-foreground">
          {title}
        </h3>
      </div>
      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">—</li>
        ) : (
          items.map((item) => (
            <li key={item} className="text-sm text-foreground/85 leading-relaxed">
              {item}
            </li>
          ))
        )}
      </ul>
    </div>
  );

  return (
    <GlassCard padding="md" className="grid gap-4 sm:grid-cols-2">
      <Column title="适合" items={fit} icon={CheckCircle} tone="fit" />
      <Column title="不适合" items={notFit} icon={XCircle} tone="notFit" />
    </GlassCard>
  );
}
```

- [ ] **Step 4: 跑测试通过**

```bash
cd frontend && npx jest __tests__/SkillFitMatrix.test.tsx --no-coverage
```

Expected: PASS（2 tests）

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/skills/SkillFitMatrix.tsx frontend/__tests__/SkillFitMatrix.test.tsx
git commit -m "feat(skills): SkillFitMatrix 适合/不适合对比组件"
```

---

### Task 3: SkillRelated 组件 + 测试（TDD）

**Files:**
- Create: `frontend/__tests__/SkillRelated.test.tsx`
- Create: `frontend/src/components/skills/SkillRelated.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
import { render, screen } from '@testing-library/react';
import SkillRelated from '@/components/skills/SkillRelated';
import type { ShowcaseSkill } from '@/types/skill';

const related = [
  { slug: 'frontend-design', name: 'frontend-design', domain: '前端' as ShowcaseSkill['domain'] },
  { slug: 'superpowers', name: 'superpowers', domain: '后端' as ShowcaseSkill['domain'] },
];

describe('SkillRelated', () => {
  it('渲染关联 skill 卡片与跳转链接', () => {
    render(<SkillRelated related={related} />);
    expect(screen.getByText('frontend-design')).toBeInTheDocument();
    expect(screen.getByText('superpowers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /frontend-design/ })).toHaveAttribute(
      'href',
      '/tools/skills/frontend-design',
    );
    expect(screen.getByRole('link', { name: /superpowers/ })).toHaveAttribute(
      'href',
      '/tools/skills/superpowers',
    );
  });

  it('空数组不渲染', () => {
    const { container } = render(<SkillRelated related={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx jest __tests__/SkillRelated.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: 实现 `SkillRelated.tsx`**

```tsx
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { ShowcaseSkill } from '@/types/skill';
import { cn } from '@/lib/utils';

export interface RelatedSkillRef {
  slug: string;
  name: string;
  domain: ShowcaseSkill['domain'];
}

export interface SkillRelatedProps {
  related: RelatedSkillRef[];
}

const DOMAIN_VARIANT: Record<ShowcaseSkill['domain'], 'default' | 'secondary' | 'outline'> = {
  前端: 'default',
  后端: 'secondary',
  通用: 'outline',
};

/**
 * 关联 skill 卡片链：点击跳对应详情页，形成知识网。
 */
export default function SkillRelated({ related }: SkillRelatedProps) {
  if (related.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {related.map((r) => (
        <Link
          key={r.slug}
          href={`/tools/skills/${r.slug}` as Route}
          className={cn(
            'group flex items-center justify-between gap-3 rounded-xl p-4',
            'border border-glass-border bg-glass transition-colors',
            'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <div className="min-w-0">
            <span className="block font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              {r.name}
            </span>
            <Badge variant={DOMAIN_VARIANT[r.domain]} className="mt-1.5">
              {r.domain}
            </Badge>
          </div>
          <ArrowUpRight
            className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
            aria-hidden
          />
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 跑测试通过**

```bash
cd frontend && npx jest __tests__/SkillRelated.test.tsx --no-coverage
```

Expected: PASS（2 tests）

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/skills/SkillRelated.tsx frontend/__tests__/SkillRelated.test.tsx
git commit -m "feat(skills): SkillRelated 关联互链组件"
```

---

### Task 4: 详情页接入新区块

**Files:**
- Modify: `frontend/src/app/tools/skills/[slug]/page.tsx`
- Modify: `frontend/src/app/tools/skills/[slug]/skill-detail-content.tsx`

- [ ] **Step 1: Server 解析 relatedSlugs**

在 `page.tsx`，`return` 前加：

```ts
const related = (skill.relatedSlugs ?? [])
  .map((s) => showcaseSkills.find((x) => x.slug === s))
  .filter((x): x is ShowcaseSkill => Boolean(x))
  .map((x) => ({ slug: x.slug, name: x.name, domain: x.domain }));
```

并在 import 区加 `import type { ShowcaseSkill } from '@/types/skill';`（若未有）。

`<SkillDetailContent>` 增加 prop：

```tsx
related={related}
```

- [ ] **Step 2: 扩展 `SkillDetailContentProps`**

```ts
import SkillFitMatrix from '@/components/skills/SkillFitMatrix';
import SkillRelated, { type RelatedSkillRef } from '@/components/skills/SkillRelated';
import { Workflow, CheckCircle } from 'lucide-react';
```

props 增加：

```ts
  /** 关联 skill（Server 解析后） */
  related?: RelatedSkillRef[];
```

- [ ] **Step 3: 插入新区块**

在「能力亮点」FadeIn 之后、「适用场景」之前，插入工作原理与最佳实践：

```tsx
{/* 工作原理（可选） */}
{skill.howItWorks && skill.howItWorks.length > 0 ? (
  <FadeIn delay={0.1} className="mt-12">
    <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
      工作原理
    </h2>
    <ul className="mt-6 space-y-3">
      {skill.howItWorks.map((point) => (
        <li key={point} className="flex items-start gap-3">
          <span className="mt-0.5 p-1 rounded-md bg-primary/15 text-primary shrink-0">
            <Workflow className="w-4 h-4" aria-hidden />
          </span>
          <span className="text-foreground/90 leading-relaxed">{point}</span>
        </li>
      ))}
    </ul>
  </FadeIn>
) : null}

{/* 最佳实践（可选） */}
{skill.bestPractices && skill.bestPractices.length > 0 ? (
  <FadeIn delay={0.1} className="mt-12">
    <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
      最佳实践
    </h2>
    <ul className="mt-6 space-y-3">
      {skill.bestPractices.map((tip) => (
        <li key={tip} className="flex items-start gap-3">
          <span className="mt-0.5 p-1 rounded-md bg-emerald-500/15 text-emerald-500 shrink-0">
            <CheckCircle className="w-4 h-4" aria-hidden />
          </span>
          <span className="text-foreground/90 leading-relaxed">{tip}</span>
        </li>
      ))}
    </ul>
  </FadeIn>
) : null}

{/* 适合 / 不适合（可选） */}
{skill.fitMatrix ? (
  <FadeIn delay={0.1} className="mt-12">
    <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mb-6">
      适合 / 不适合
    </h2>
    <SkillFitMatrix fit={skill.fitMatrix.fit} notFit={skill.fitMatrix.notFit} />
  </FadeIn>
) : null}
```

在「SKILL.md 预览」之后、「来源外链」之前，插入关联 skill：

```tsx
{/* 关联 skill（可选） */}
{related && related.length > 0 ? (
  <FadeIn delay={0.1} className="mt-12">
    <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mb-6">
      关联 skill
    </h2>
    <SkillRelated related={related} />
  </FadeIn>
) : null}
```

解构 props 增加 `related = []`。

- [ ] **Step 4: type-check + 全量测试**

```bash
cd frontend && npx tsc --noEmit && npx jest --no-coverage
```

Expected: tsc exit 0；全部测试绿（含新增 4 个）

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/tools/skills/\[slug\]/page.tsx frontend/src/app/tools/skills/\[slug\]/skill-detail-content.tsx
git commit -m "feat(skills): 详情页接入 4 个解析维度区块"
```

---

### Task 5: 合并 + 部署

- [ ] **Step 1: 合并 main 并推送**

```bash
git checkout main
git merge feat/skill-detail-analysis
git push origin main
```

- [ ] **Step 2: 部署前端**

仓库根同步代码 + `bash scripts/server-redeploy.sh frontend`。

- [ ] **Step 3: 生产验证**

`http://49.234.190.85/tools/skills/taste` 确认 4 个新区块可见、关联 skill 可跳转。

---

## Spec coverage checklist

| 规格要求 | 任务 |
|----------|------|
| `howItWorks` 字段 + 区块 | Task 1 + Task 4 |
| `bestPractices` 字段 + 区块 | Task 1 + Task 4 |
| `fitMatrix` 字段 + SkillFitMatrix | Task 1 + Task 2 + Task 4 |
| `relatedSlugs` 字段 + SkillRelated | Task 1 + Task 3 + Task 4 |
| Server 解析 relatedSlugs | Task 4 Step 1 |
| 区块顺序（亮点→原理→实践→适合不适合→场景→提示词→SKILL.md→关联→来源） | Task 4 Step 3 |
| 空态兼容（缺失不渲染） | Task 4 各 `&& length>0` 守卫 |
| 测试 | Task 2、3 |

## Placeholder scan

无 TBD/TODO；每个代码步骤含完整代码；无「类似 Task N」省略。

## Type consistency

- `howItWorks?: string[]`、`bestPractices?: string[]`
- `fitMatrix?: { fit: string[]; notFit: string[] }`
- `relatedSlugs?: string[]`
- `RelatedSkillRef = { slug: string; name: string; domain: ShowcaseSkill['domain'] }`
- `SkillRelatedProps.related: RelatedSkillRef[]`
- `SkillFitMatrixProps: { fit: string[]; notFit: string[] }`
- DOMAIN_VARIANT 映射与 SkillCard/SkillDetailHero 一致
