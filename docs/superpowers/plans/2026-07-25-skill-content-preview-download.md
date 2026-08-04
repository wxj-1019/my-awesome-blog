# Skill 详情页 SKILL.md 预览与下载 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/tools/skills/[slug]` 详情页提供站内托管的 `SKILL.md` 折叠预览（默认约 16 行）与下载（文件名 `{slug}-SKILL.md`）。

**Architecture:** 正文放在 `frontend/public/skills/<slug>/SKILL.md`；Server 组件构建时 `fs.readFile` 注入 Markdown 字符串；Client `SkillContentPanel` 负责折叠/展开与 Blob 下载。复用既有 `MarkdownRenderer`。

**Tech Stack:** Next.js 16 App Router、React 18、TypeScript、`MarkdownRenderer`（react-markdown）、Jest + Testing Library。

**Spec:** `docs/superpowers/specs/2026-07-25-skill-content-preview-download-design.md`

---

## File map

| 路径 | 职责 |
|------|------|
| `frontend/src/types/skill.ts` | 增加 `contentPath?: string` |
| `frontend/src/mock/skills.ts` | 五个 skill 填 `contentPath` |
| `frontend/public/skills/<slug>/SKILL.md` | 五个策展正文（新建） |
| `frontend/src/lib/skill-content.ts` | Server 读盘 + 预览行切分/下载文件名纯函数（可单测） |
| `frontend/src/components/skills/SkillContentPanel.tsx` | 折叠预览 + 下载 UI |
| `frontend/__tests__/skill-content.test.ts` | 纯函数测试 |
| `frontend/__tests__/SkillContentPanel.test.tsx` | 面板交互测试 |
| `frontend/src/app/tools/skills/[slug]/page.tsx` | 读文件并传入详情 |
| `frontend/src/app/tools/skills/[slug]/skill-detail-content.tsx` | 挂载面板 |

---

### Task 1: 类型 + mock `contentPath`

**Files:**
- Modify: `frontend/src/types/skill.ts`
- Modify: `frontend/src/mock/skills.ts`

- [ ] **Step 1: 扩展 `ShowcaseSkill`**

在 `ShowcaseSkill` 中 `scenes?` 后增加：

```ts
  /** 站内托管的 skill 正文路径（站点根相对），如 /skills/taste/SKILL.md */
  contentPath?: string;
```

- [ ] **Step 2: 为五个 skill 写入 `contentPath`**

每个对象增加一行（路径与 slug 一致）：

```ts
contentPath: '/skills/taste/SKILL.md',
// superpowers → '/skills/superpowers/SKILL.md'
// brainstorm → '/skills/brainstorm/SKILL.md'
// frontend-design → '/skills/frontend-design/SKILL.md'
// webapp-testing → '/skills/webapp-testing/SKILL.md'
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/skill.ts frontend/src/mock/skills.ts
git commit -m "feat(skills): 为 ShowcaseSkill 增加 contentPath"
```

---

### Task 2: 纯函数库 + 失败测试（TDD）

**Files:**
- Create: `frontend/src/lib/skill-content.ts`
- Create: `frontend/__tests__/skill-content.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `frontend/__tests__/skill-content.test.ts`：

```ts
import {
  previewMarkdownLines,
  skillDownloadFilename,
  contentPathToPublicFile,
} from '@/lib/skill-content';

describe('skill-content helpers', () => {
  it('previewMarkdownLines 默认截取前 16 行并标记截断', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `L${i + 1}`);
    const md = lines.join('\n');
    const { text, truncated } = previewMarkdownLines(md, 16);
    expect(truncated).toBe(true);
    expect(text.split('\n')).toHaveLength(16);
    expect(text.startsWith('L1')).toBe(true);
    expect(text.endsWith('L16')).toBe(true);
  });

  it('previewMarkdownLines 不足 maxLines 时不截断', () => {
    const md = 'a\nb\nc';
    const { text, truncated } = previewMarkdownLines(md, 16);
    expect(truncated).toBe(false);
    expect(text).toBe(md);
  });

  it('skillDownloadFilename 使用 {slug}-SKILL.md', () => {
    expect(skillDownloadFilename('taste')).toBe('taste-SKILL.md');
  });

  it('contentPathToPublicFile 映射站点路径到 public 相对路径', () => {
    expect(contentPathToPublicFile('/skills/taste/SKILL.md')).toBe(
      'skills/taste/SKILL.md',
    );
  });

  it('contentPathToPublicFile 拒绝路径穿越', () => {
    expect(contentPathToPublicFile('/skills/../.env')).toBeNull();
    expect(contentPathToPublicFile('skills/taste/SKILL.md')).toBeNull();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx jest __tests__/skill-content.test.ts --no-coverage
```

Expected: FAIL（模块不存在或导出缺失）

- [ ] **Step 3: 实现 `frontend/src/lib/skill-content.ts`**

```ts
import fs from 'node:fs/promises';
import path from 'node:path';

/** 默认折叠预览行数（规格约定约 16） */
export const DEFAULT_SKILL_PREVIEW_LINES = 16;

/**
 * 将站点根相对 contentPath（必须以 /skills/ 开头）转为 public 下相对路径。
 * 非法或穿越返回 null。
 */
export function contentPathToPublicFile(contentPath: string): string | null {
  if (!contentPath.startsWith('/skills/')) return null;
  const rel = contentPath.replace(/^\//, '');
  const normalized = path.posix.normalize(rel);
  if (normalized.startsWith('..') || normalized.includes('/../')) return null;
  if (!normalized.startsWith('skills/')) return null;
  return normalized;
}

/** 下载文件名：{slug}-SKILL.md */
export function skillDownloadFilename(slug: string): string {
  return `${slug}-SKILL.md`;
}

/**
 * 按行截取 Markdown 预览。
 * @returns text 预览正文；truncated 是否发生截断
 */
export function previewMarkdownLines(
  markdown: string,
  maxLines: number = DEFAULT_SKILL_PREVIEW_LINES,
): { text: string; truncated: boolean } {
  const lines = markdown.split('\n');
  if (lines.length <= maxLines) {
    return { text: markdown, truncated: false };
  }
  return {
    text: lines.slice(0, maxLines).join('\n'),
    truncated: true,
  };
}

/**
 * Server 专用：从 frontend 工程根（cwd 一般为 frontend）读取 public 下 skill 正文。
 * 文件不存在或路径非法返回 null，不抛错。
 */
export async function readSkillMarkdown(
  contentPath: string | undefined,
): Promise<string | null> {
  if (!contentPath) return null;
  const rel = contentPathToPublicFile(contentPath);
  if (!rel) return null;
  const abs = path.join(process.cwd(), 'public', rel);
  try {
    return await fs.readFile(abs, 'utf8');
  } catch {
    return null;
  }
}
```

注意：`readSkillMarkdown` 仅在 Server 组件调用；纯函数测试不 import `fs` 路径逻辑以外的部分时，Jest 在 node 环境可测前三个导出。若 `fs` 导致浏览器 bundle 误打包，保持本文件 **仅被 Server 的 page.tsx 与 node 测试引用**；Client 组件只从本文件 import `previewMarkdownLines` / `skillDownloadFilename` / `DEFAULT_SKILL_PREVIEW_LINES`（不要 import `readSkillMarkdown`）。

若担心 Client 误引 `fs`：将 `readSkillMarkdown` 放到 `frontend/src/lib/skill-content.server.ts`，纯函数留在 `skill-content.ts`。**推荐拆成两个文件：**

- `frontend/src/lib/skill-content.ts` — 仅纯函数（Client 安全）
- `frontend/src/lib/skill-content.server.ts` — `readSkillMarkdown` + `import 'server-only'`（若项目有 `server-only` 包）或仅 Server 引用

本计划采用 **拆分**：

`skill-content.ts` 只含纯函数；`skill-content.server.ts`：

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { contentPathToPublicFile } from '@/lib/skill-content';

export async function readSkillMarkdown(
  contentPath: string | undefined,
): Promise<string | null> {
  if (!contentPath) return null;
  const rel = contentPathToPublicFile(contentPath);
  if (!rel) return null;
  const abs = path.join(process.cwd(), 'public', rel);
  try {
    return await fs.readFile(abs, 'utf8');
  } catch {
    return null;
  }
}
```

测试只测 `skill-content.ts`。

- [ ] **Step 4: 跑测试确认通过**

```bash
cd frontend && npx jest __tests__/skill-content.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/skill-content.ts frontend/src/lib/skill-content.server.ts frontend/__tests__/skill-content.test.ts
git commit -m "feat(skills): skill 正文路径与预览纯函数 + 测试"
```

---

### Task 3: 五个 `public/skills/.../SKILL.md` 策展文件

**Files:**
- Create: `frontend/public/skills/taste/SKILL.md`
- Create: `frontend/public/skills/superpowers/SKILL.md`
- Create: `frontend/public/skills/brainstorm/SKILL.md`
- Create: `frontend/public/skills/frontend-design/SKILL.md`
- Create: `frontend/public/skills/webapp-testing/SKILL.md`

- [ ] **Step 1: 创建目录与文件**

每个文件至少 **20 行以上**（保证默认折叠能测截断），结构示例（按 skill 改写，勿抄袭受限全文；可用策展摘要）：

```markdown
# taste

> 站内策展副本，以官方仓库为准。

## 定位
把「一眼 AI」的模板味，炼成真正的设计品味。

## 何时使用
- 新页面临启动，怕写出来一股模板味
- …

## 核心约束
1. …
2. …

## 示例
\`\`\`
用 taste 的标准审视这个落地页…
\`\`\`

## 来源
https://github.com/Leonxlnx/taste-skill
```

其余四个 slug 按 `mock/skills.ts` 中 tagline/highlights/scenes 扩写。

- [ ] **Step 2: 确认静态路径**

本地 `cd frontend && npm run dev` 后访问：  
`http://localhost:3000/skills/taste/SKILL.md` 应返回 Markdown 文本。

- [ ] **Step 3: Commit**

```bash
git add frontend/public/skills
git commit -m "content(skills): 托管五份策展 SKILL.md"
```

---

### Task 4: `SkillContentPanel` 组件 + 测试（TDD）

**Files:**
- Create: `frontend/src/components/skills/SkillContentPanel.tsx`
- Create: `frontend/__tests__/SkillContentPanel.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import SkillContentPanel from '@/components/skills/SkillContentPanel';

const longMd = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');

jest.mock('@/components/ui/MarkdownRenderer', () => {
  return function MockMarkdown({ content }: { content: string }) {
    return <pre data-testid="md">{content}</pre>;
  };
});

describe('SkillContentPanel', () => {
  it('空正文显示暂无托管', () => {
    render(
      <SkillContentPanel
        slug="taste"
        contentPath="/skills/taste/SKILL.md"
        contentMarkdown={null}
      />,
    );
    expect(screen.getByText(/暂无托管正文/)).toBeInTheDocument();
  });

  it('默认折叠只展示约 16 行逻辑下的预览', () => {
    render(
      <SkillContentPanel
        slug="taste"
        contentPath="/skills/taste/SKILL.md"
        contentMarkdown={longMd}
      />,
    );
    const md = screen.getByTestId('md');
    expect(md.textContent?.split('\n')).toHaveLength(16);
    expect(screen.getByRole('button', { name: /展开全文/ })).toBeInTheDocument();
  });

  it('点击展开后显示全文', () => {
    render(
      <SkillContentPanel
        slug="taste"
        contentPath="/skills/taste/SKILL.md"
        contentMarkdown={longMd}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /展开全文/ }));
    expect(screen.getByTestId('md').textContent?.split('\n')).toHaveLength(20);
    expect(screen.getByRole('button', { name: /收起/ })).toBeInTheDocument();
  });

  it('下载按钮可访问名称包含文件名', () => {
    render(
      <SkillContentPanel
        slug="taste"
        contentPath="/skills/taste/SKILL.md"
        contentMarkdown={longMd}
      />,
    );
    expect(
      screen.getByRole('button', { name: /下载 taste-SKILL\.md/ }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx jest __tests__/SkillContentPanel.test.tsx --no-coverage
```

- [ ] **Step 3: 实现 `SkillContentPanel.tsx`**

要点：

- `'use client'`
- props: `slug`, `contentPath`, `contentMarkdown: string | null`, `previewLines?: number`（默认 `DEFAULT_SKILL_PREVIEW_LINES`）
- `useState` 控制 `expanded`
- 用 `previewMarkdownLines` 算预览
- `MarkdownRenderer` 渲染当前显示的 markdown
- 展开按钮：`aria-expanded={expanded}`
- 下载：`async` 函数 `fetch(contentPath)` → `blob()` → 创建 object URL → `<a download={skillDownloadFilename(slug)}>` click → revoke；失败则 `window.open(contentPath, '_blank')`
- `GlassCard` + 文案「以下为站内策展副本，以官方仓库为准」
- `null` 内容时只显示空态，下载按钮不渲染或 `disabled`

参考结构：

```tsx
'use client';

import { useState, useCallback } from 'react';
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import {
  DEFAULT_SKILL_PREVIEW_LINES,
  previewMarkdownLines,
  skillDownloadFilename,
} from '@/lib/skill-content';
import { cn } from '@/lib/utils';

export interface SkillContentPanelProps {
  slug: string;
  contentPath: string;
  contentMarkdown: string | null;
  previewLines?: number;
}

export default function SkillContentPanel({
  slug,
  contentPath,
  contentMarkdown,
  previewLines = DEFAULT_SKILL_PREVIEW_LINES,
}: SkillContentPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const onDownload = useCallback(async () => {
    const filename = skillDownloadFilename(slug);
    setDownloading(true);
    try {
      const res = await fetch(contentPath);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(contentPath, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }, [contentPath, slug]);

  if (contentMarkdown == null || contentMarkdown.trim() === '') {
    return (
      <GlassCard padding="md" role="region" aria-label="Skill 文件">
        <p className="text-sm text-muted-foreground">暂无托管正文</p>
      </GlassCard>
    );
  }

  const { text: preview, truncated } = previewMarkdownLines(
    contentMarkdown,
    previewLines,
  );
  const shown = expanded || !truncated ? contentMarkdown : preview;

  return (
    <GlassCard padding="md" className="space-y-4" role="region" aria-label="Skill 文件">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <FileText className="w-4 h-4 text-primary" aria-hidden />
          <h2 className="font-display text-lg font-bold tracking-tight">SKILL.md</h2>
        </div>
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
            'border border-glass-border bg-glass text-foreground',
            'hover:border-primary/40 hover:text-primary transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:opacity-60',
          )}
          aria-label={`下载 ${skillDownloadFilename(slug)}`}
        >
          <Download className="w-4 h-4" aria-hidden />
          下载
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        以下为站内策展副本，以官方仓库为准。
      </p>
      <div className="rounded-lg border border-glass-border/60 bg-background/30 p-3 sm:p-4 overflow-x-auto">
        <MarkdownRenderer content={shown} className="text-sm" />
      </div>
      {truncated ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md',
          )}
        >
          {expanded ? (
            <>
              收起 <ChevronUp className="w-4 h-4" aria-hidden />
            </>
          ) : (
            <>
              展开全文 <ChevronDown className="w-4 h-4" aria-hidden />
            </>
          )}
        </button>
      ) : null}
    </GlassCard>
  );
}
```

若 `MarkdownRenderer` 对短文本样式过重，可接受；不要新写一套 markdown 管线。

- [ ] **Step 4: 跑测试通过**

```bash
cd frontend && npx jest __tests__/SkillContentPanel.test.tsx __tests__/skill-content.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/skills/SkillContentPanel.tsx frontend/__tests__/SkillContentPanel.test.tsx
git commit -m "feat(skills): SkillContentPanel 折叠预览与下载"
```

---

### Task 5: 接入详情页 Server + Client

**Files:**
- Modify: `frontend/src/app/tools/skills/[slug]/page.tsx`
- Modify: `frontend/src/app/tools/skills/[slug]/skill-detail-content.tsx`

- [ ] **Step 1: Server 读文件并传 props**

在 `page.tsx`：

```ts
import { readSkillMarkdown } from '@/lib/skill-content.server';
```

在 `return` 前：

```ts
const contentMarkdown = await readSkillMarkdown(skill.contentPath);
```

传入：

```tsx
<SkillDetailContent
  skill={skill}
  prev={{ slug: prevSkill.slug, name: prevSkill.name }}
  next={{ slug: nextSkill.slug, name: nextSkill.name }}
  contentMarkdown={contentMarkdown}
/>
```

- [ ] **Step 2: 扩展 `SkillDetailContentProps`**

```ts
  /** Server 注入的 SKILL.md 正文；null 表示缺失；无 contentPath 时可不传 */
  contentMarkdown?: string | null;
```

在「示例提示词」`FadeIn` 与「查看来源」之间：

```tsx
{skill.contentPath ? (
  <FadeIn delay={0.1} className="mt-12">
    <SkillContentPanel
      slug={skill.slug}
      contentPath={skill.contentPath}
      contentMarkdown={contentMarkdown ?? null}
    />
  </FadeIn>
) : null}
```

并 `import SkillContentPanel from '@/components/skills/SkillContentPanel'`。

解构 props 增加 `contentMarkdown = null`。

- [ ] **Step 3: type-check + 全量测试**

```bash
cd frontend && npx tsc --noEmit && npx jest --no-coverage
```

Expected: tsc exit 0；既有测试 + 新测试全绿。

- [ ] **Step 4: 手动冒烟**

```bash
cd frontend && npm run dev
```

打开 `/tools/skills/taste`：可见 Skill 文件区、默认折叠、展开、下载为 `taste-SKILL.md`。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/tools/skills/\[slug\]/page.tsx frontend/src/app/tools/skills/\[slug\]/skill-detail-content.tsx
git commit -m "feat(skills): 详情页接入 SKILL.md 预览与下载"
```

---

### Task 6: 合并与部署（可选，按用户要求）

- [ ] **Step 1:** 合并到 `main` 并 `git push origin main`
- [ ] **Step 2:** 仅重建前端（与既有 deploy 流程一致）：

```bash
# 仓库根：tar 同步 + server-redeploy.sh frontend
```

- [ ] **Step 3:** 生产验证  
`http://49.234.190.85/tools/skills/taste` 与  
`http://49.234.190.85/skills/taste/SKILL.md`

---

## Spec coverage checklist

| 规格要求 | 任务 |
|----------|------|
| `public/skills/<slug>/SKILL.md` | Task 3 |
| `contentPath` 字段 | Task 1 |
| Server 读盘注入 | Task 2 server + Task 5 |
| 折叠约 16 行 + 展开 | Task 2 纯函数 + Task 4 |
| 下载 `{slug}-SKILL.md` | Task 2 + Task 4 |
| 缺失空态 | Task 4 |
| 查看来源保留 | Task 5 不删既有区块 |
| 测试 | Task 2、4 |
| 策展声明文案 | Task 4 UI |

## Placeholder scan

无 TBD/TODO；无「自行补充测试」空步骤。

## Type consistency

- `contentPath?: string`（站点根相对，以 `/skills/` 开头）
- `contentMarkdown: string | null`（Server → Client）
- `skillDownloadFilename(slug) => \`${slug}-SKILL.md\``
- `DEFAULT_SKILL_PREVIEW_LINES = 16`
