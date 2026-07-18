# Homepage Non-Hero Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all homepage sections below the existing Hero while keeping `frontend/src/components/home/HeroSection.tsx` visually and structurally unchanged.

**Architecture:** Use `NexaCore` as the main structural reference: service-card grid, calm data hub, split statement section, and staircase-style timeline. Use `Liquid Glass Agency` only for glass surface details and muted section rhythm. Keep the implementation inside `frontend/src/components/home/`, centralize static homepage copy in one data file, and avoid adding new dependencies or new video-heavy sections.

**Tech Stack:** Next.js 16 App Router, React 18, TypeScript strict mode, Tailwind CSS 3, lucide-react, existing `GlassCard`, existing `Button`, existing animation utilities, Jest + Testing Library.

---

## Scope And Guardrails

- Keep `frontend/src/components/home/HeroSection.tsx` unchanged.
- Keep `frontend/src/app/page.tsx` rendering `<HeroSection />` first.
- Do not introduce MotionSites external videos, HLS streams, new fonts, or new packages.
- Use existing design tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-glass/30`, `border-glass-border`, `text-tech-cyan`, `from-tech-cyan`, `to-tech-sky`.
- Use Tailwind utility classes only. Do not add raw CSS unless a token already exists in project styles.
- Use stable keys from data IDs, not array indexes except explicit skeleton placeholders.
- Preserve light/dark mode compatibility.
- Respect `prefers-reduced-motion` for Framer Motion interactions.
- Keep homepage content in Chinese to match the current project.

## File Structure

**Create:**
- `frontend/src/components/home/homeContent.ts`
  - Static content source for redesigned homepage sections.
  - Exports typed arrays for focus pillars, metric cards, tech lanes, reading insights, timeline stages, and subscribe links.

- `frontend/src/components/home/HomeSectionHeader.tsx`
  - Shared non-Hero section heading component.
  - Responsible for eyebrow, title, description, optional action, and alignment.

**Modify:**
- `frontend/__tests__/home.test.tsx`
  - Locks the non-Hero section order and protects the Hero contract.

- `frontend/src/app/page.tsx`
  - Keeps Hero first and applies consistent section spacing/wrappers below it.

- `frontend/src/components/home/FeaturedHighlights.tsx`
  - Rebuilds the first post-Hero area as a NexaCore-style focus grid plus a compact latest-article strip.

- `frontend/src/components/home/StatsPanel.tsx`
  - Rebuilds the current high-motion mixed panel into a calm Liquid Glass data hub.

- `frontend/src/components/home/TechStack.tsx`
  - Rebuilds technology display into categorized lanes and a restrained logo rail.

- `frontend/src/components/home/ReadingStats.tsx`
  - Rebuilds reading stats into a Focus AI-style statement/split section with tabs.

- `frontend/src/components/home/Timeline.tsx`
  - Rebuilds timeline into a NexaCore-style staircase/roadmap section.

- `frontend/src/components/home/SubscribeCard.tsx`
  - Rebuilds bottom CTA as a compact glass subscription/contact panel.

**Do not modify:**
- `frontend/src/components/home/HeroSection.tsx`
- `frontend/src/components/home/TextType.tsx`
- `frontend/src/components/home/ScrollIndicator.tsx`
- Backend files

---

### Task 1: Add Tests For Homepage Redesign Contract

**Files:**
- Modify: `frontend/__tests__/home.test.tsx`

- [ ] **Step 1: Replace brittle homepage mocks with section-aware mocks**

Update `frontend/__tests__/home.test.tsx` so every homepage module mock exposes a stable section label. Keep `HeroSection` real enough to assert the welcome heading, but mock expensive visual dependencies.

```tsx
import { render, screen, within } from '@testing-library/react';
import Home from '@/app/page';
import { ThemeProvider } from '@/context/theme-context';
import { LoadingProvider } from '@/context/loading-context';

jest.mock('@/components/background/MatrixCodeRain', () => ({
  __esModule: true,
  default: () => <div data-testid="matrix-code-rain" aria-hidden="true" />,
}));

jest.mock('@/components/home/decorations/CursorGlow', () => ({
  __esModule: true,
  default: () => <div data-testid="cursor-glow" aria-hidden="true" />,
}));

jest.mock('@/components/home/MobileDrawer', () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-drawer" />,
}));

jest.mock('@/components/home/WeatherCard', () => ({
  __esModule: true,
  default: () => <div data-testid="weather-card" />,
}));

jest.mock('@/components/home/ScrollProgress', () => ({
  __esModule: true,
  default: () => <div data-testid="scroll-progress" />,
}));

jest.mock('@/components/home/TextType', () => ({
  __esModule: true,
  default: () => <span>POETIZE</span>,
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/home/FeaturedHighlights', () => ({
  __esModule: true,
  default: () => <section aria-label="精选内容">精选内容</section>,
}));

jest.mock('@/components/home/StatsPanel', () => ({
  __esModule: true,
  default: () => <section aria-label="数据概览">数据概览</section>,
}));

jest.mock('@/components/home/TechStack', () => ({
  __esModule: true,
  default: () => <section aria-label="技术栈">技术栈</section>,
}));

jest.mock('@/components/home/ReadingStats', () => ({
  __esModule: true,
  default: () => <section aria-label="阅读洞察">阅读洞察</section>,
}));

jest.mock('@/components/home/Timeline', () => ({
  __esModule: true,
  default: () => <section aria-label="成长路径">成长路径</section>,
}));

jest.mock('@/components/home/SubscribeCard', () => ({
  __esModule: true,
  default: () => <section aria-label="订阅更新">订阅更新</section>,
}));

const HomeWithProvider = () => (
  <ThemeProvider>
    <LoadingProvider>
      <Home />
    </LoadingProvider>
  </ThemeProvider>
);

describe('Home Page', () => {
  it('keeps the existing hero first', () => {
    render(<HomeWithProvider />);

    expect(screen.getByText('POETIZE')).toBeInTheDocument();
    const mainContent = screen.getByTestId('home-content');
    const firstSection = within(mainContent).getAllByRole('region')[0];
    expect(firstSection).toHaveAttribute('aria-label', '首页首屏');
  });

  it('renders redesigned non-hero sections in the intended order', () => {
    render(<HomeWithProvider />);

    const labels = screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'));
    expect(labels).toEqual([
      '首页首屏',
      '精选内容',
      '数据概览',
      '技术栈',
      '阅读洞察',
      '成长路径',
      '订阅更新',
    ]);
  });

  it('keeps the homepage background decorations mounted once', () => {
    render(<HomeWithProvider />);

    expect(screen.getByTestId('matrix-code-rain')).toBeInTheDocument();
    expect(screen.getByTestId('cursor-glow')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-progress')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the homepage test and confirm the contract fails before page wiring**

```bash
cd frontend
npm test -- --runTestsByPath __tests__/home.test.tsx
```

Expected: FAIL because `src/app/page.tsx` does not yet expose `data-testid="home-content"`, section `role="region"`, and the new section labels.

---

### Task 2: Wire Stable Homepage Section Regions

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Update homepage wrappers without changing HeroSection implementation**

Replace the return markup in `frontend/src/app/page.tsx` with this structure. Keep imports unchanged except remove imports that become unused after this replacement.

```tsx
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <MatrixCodeRain />
      <CursorGlow />

      <ScrollProgress />
      <MobileDrawer />
      <WeatherCard />

      <main id="main-content" data-testid="home-content" className="relative z-10">
        <section aria-label="首页首屏" role="region">
          <HeroSection />
        </section>

        <section aria-label="精选内容" role="region" className="relative py-16 sm:py-20 lg:py-24">
          <FeaturedHighlights />
        </section>

        <section aria-label="数据概览" role="region" className="relative py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <StatsPanel />
          </div>
        </section>

        <section aria-label="技术栈" role="region" className="relative py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <TechStack />
          </div>
        </section>

        <section aria-label="阅读洞察" role="region" className="relative py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ReadingStats />
          </div>
        </section>

        <section aria-label="成长路径" role="region" className="relative py-16 sm:py-20 lg:py-24">
          <Timeline />
        </section>

        <section aria-label="订阅更新" role="region" className="relative py-16 sm:py-20 lg:py-24">
          <SubscribeCard />
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Run the homepage test again**

```bash
cd frontend
npm test -- --runTestsByPath __tests__/home.test.tsx
```

Expected: PASS.

---

### Task 3: Create Shared Homepage Content Data

**Files:**
- Create: `frontend/src/components/home/homeContent.ts`

- [ ] **Step 1: Add typed content constants**

Create `frontend/src/components/home/homeContent.ts` with the following content. This file centralizes text and reduces duplicated copy in section components.

```ts
import type { ComponentType } from 'react';
import { BookOpen, Bot, Code2, Database, GitBranch, Layers3, MessageSquareText, Rocket, Server, Sparkles, TrendingUp, Zap } from 'lucide-react';

export interface HomeFocusPillar {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  meta: string;
}

export interface HomeMetricCard {
  id: string;
  value: string;
  label: string;
  description: string;
  trend: string;
}

export interface HomeTechLane {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  items: string[];
}

export interface HomeReadingInsight {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface HomeTimelineStage {
  id: string;
  step: string;
  title: string;
  description: string;
  items: string[];
}

export const focusPillars: HomeFocusPillar[] = [
  {
    id: 'engineering-notes',
    label: 'Engineering',
    title: '工程笔记沉淀',
    description: '记录前端体验、后端架构、部署运维中的真实问题和可复用方案。',
    href: '/articles',
    icon: Code2,
    gradient: 'from-tech-cyan to-tech-sky',
    meta: 'Next.js / FastAPI / DevOps',
  },
  {
    id: 'ai-lab',
    label: 'AI Lab',
    title: 'AI 实验场',
    description: '整理提示词、上下文记忆、对话系统和自动化工作流的探索过程。',
    href: '/ai/chat',
    icon: Bot,
    gradient: 'from-violet-500 to-fuchsia-500',
    meta: 'LLM / Memory / Prompt',
  },
  {
    id: 'project-review',
    label: 'Projects',
    title: '项目复盘',
    description: '把功能设计、性能优化和 UI/UX 打磨过程拆开讲清楚。',
    href: '/about',
    icon: Layers3,
    gradient: 'from-emerald-500 to-teal-500',
    meta: 'Design / Refactor / Review',
  },
  {
    id: 'life-log',
    label: 'Life',
    title: '生活与观察',
    description: '保留技术之外的输入、阅读、影像和阶段性思考。',
    href: '/messages',
    icon: MessageSquareText,
    gradient: 'from-amber-500 to-orange-500',
    meta: 'Reading / Notes / Timeline',
  },
];

export const homeMetrics: HomeMetricCard[] = [
  {
    id: 'articles',
    value: '100+',
    label: '文章与笔记',
    description: '覆盖前端、后端、AI、部署与产品体验。',
    trend: '持续更新',
  },
  {
    id: 'topics',
    value: '12',
    label: '主题方向',
    description: '用清晰分类让内容更容易被重新发现。',
    trend: '结构化整理',
  },
  {
    id: 'projects',
    value: '8',
    label: '项目实践',
    description: '从真实项目中提取可复用的工程经验。',
    trend: '复盘优先',
  },
  {
    id: 'signals',
    value: '24/7',
    label: '灵感捕捉',
    description: '把碎片输入沉淀成长期可搜索的知识资产。',
    trend: '持续积累',
  },
];

export const techLanes: HomeTechLane[] = [
  {
    id: 'frontend',
    title: '前端体验层',
    description: '关注性能、交互、可访问性与组件系统。',
    icon: Sparkles,
    items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
  },
  {
    id: 'backend',
    title: '服务与数据层',
    description: '保持 API、权限、缓存和数据模型清晰可靠。',
    icon: Server,
    items: ['FastAPI', 'PostgreSQL', 'Redis', 'SQLAlchemy'],
  },
  {
    id: 'ai',
    title: 'AI 能力层',
    description: '把模型调用、上下文、提示词和记忆系统产品化。',
    icon: Zap,
    items: ['LLM', 'Prompt', 'Memory', 'Vector DB'],
  },
  {
    id: 'delivery',
    title: '交付与运维层',
    description: '用容器化、自动化和观测能力减少维护成本。',
    icon: Rocket,
    items: ['Docker', 'Nginx', 'CI', 'Monitoring'],
  },
];

export const readingInsights: HomeReadingInsight[] = [
  {
    id: 'signal',
    label: '阅读信号',
    value: '高价值输入',
    description: '优先筛选能转化为工程决策、设计判断和长期复盘的内容。',
  },
  {
    id: 'shape',
    label: '内容形态',
    value: '短笔记 + 长文',
    description: '短笔记记录即时发现，长文沉淀完整推理过程。',
  },
  {
    id: 'loop',
    label: '反馈闭环',
    value: '实践验证',
    description: '每一类阅读最终都回到项目、代码和真实体验中验证。',
  },
];

export const timelineStages: HomeTimelineStage[] = [
  {
    id: 'capture',
    step: '01',
    title: '捕捉问题',
    description: '从开发、阅读和使用体验中记录值得追踪的问题。',
    items: ['灵感记录', '问题归档', '资料收集'],
  },
  {
    id: 'build',
    step: '02',
    title: '构建方案',
    description: '把零散输入组织成可执行的功能、组件或文章结构。',
    items: ['方案设计', '代码实现', '体验打磨'],
  },
  {
    id: 'verify',
    step: '03',
    title: '验证结果',
    description: '通过测试、构建、真实使用和复盘确认方案有效。',
    items: ['类型检查', '性能观察', '可访问性'],
  },
  {
    id: 'publish',
    step: '04',
    title: '发布沉淀',
    description: '将结果整理为文章、项目记录或可复用的知识模块。',
    items: ['文章发布', '项目复盘', '长期维护'],
  },
];

export const subscribeLinks = [
  { id: 'articles', label: '浏览文章', href: '/articles', icon: BookOpen },
  { id: 'timeline', label: '查看路径', href: '/about', icon: GitBranch },
  { id: 'data', label: '技术栈', href: '/articles?category=tech', icon: Database },
  { id: 'growth', label: '近期趋势', href: '/messages', icon: TrendingUp },
];
```

- [ ] **Step 2: Run TypeScript check for the new file**

```bash
cd frontend
npm run type-check
```

Expected: PASS.

---

### Task 4: Create Shared HomeSectionHeader

**Files:**
- Create: `frontend/src/components/home/HomeSectionHeader.tsx`

- [ ] **Step 1: Add the shared section header component**

Create `frontend/src/components/home/HomeSectionHeader.tsx`.

```tsx
import type React from 'react';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface HomeSectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
  className?: string;
}

export default function HomeSectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  action,
  className,
}: HomeSectionHeaderProps) {
  const isCentered = align === 'center';

  return (
    <div
      className={cn(
        'mb-8 sm:mb-10 lg:mb-12',
        isCentered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl text-left',
        className
      )}
    >
      <div
        className={cn(
          'mb-4 flex items-center gap-2',
          isCentered && 'justify-center'
        )}
      >
        <span className="h-px w-8 bg-tech-cyan/60" />
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-tech-cyan">
          {eyebrow}
        </span>
        <span className="h-px w-8 bg-tech-cyan/60" />
      </div>

      <div className={cn('flex flex-col gap-4', !isCentered && 'lg:flex-row lg:items-end lg:justify-between')}>
        <div>
          <h2 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>

        {action ? (
          <div className={cn('flex shrink-0', isCentered ? 'justify-center' : 'justify-start')}>
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function HomeTextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-macos-md border border-glass-border bg-glass/30 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-xl transition-colors duration-200 hover:border-tech-cyan/50 hover:text-tech-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-cyan/60"
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}
```

- [ ] **Step 2: Run file-level lint**

```bash
cd frontend
npx eslint src/components/home/HomeSectionHeader.tsx
```

Expected: no errors.

---

### Task 5: Rebuild FeaturedHighlights As Focus Grid

**Files:**
- Modify: `frontend/src/components/home/FeaturedHighlights.tsx`
- Uses: `frontend/src/components/home/homeContent.ts`
- Uses: `frontend/src/components/home/HomeSectionHeader.tsx`

- [ ] **Step 1: Replace heavy decorative card system with focus pillars**

Rewrite `FeaturedHighlights.tsx` around these implementation points:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

import HomeSectionHeader, { HomeTextLink } from '@/components/home/HomeSectionHeader';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { focusPillars } from '@/components/home/homeContent';
import { cn } from '@/lib/utils';
import { getPopularArticles } from '@/services/articleService';
import type { Article } from '@/types';

function FocusPillarCard({ pillar }: { pillar: (typeof focusPillars)[number] }) {
  const Icon = pillar.icon;

  return (
    <a
      href={pillar.href}
      className="group relative flex min-h-[260px] flex-col overflow-hidden rounded-macos-2xl border border-glass-border bg-glass/30 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-tech-cyan/50 hover:bg-glass/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-cyan/60 sm:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tech-cyan/70 to-transparent opacity-70" />
      <div className={cn('mb-8 flex h-12 w-12 items-center justify-center rounded-macos-md bg-gradient-to-br text-white shadow-macos-glass-1', pillar.gradient)}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="mt-auto">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-tech-cyan">{pillar.label}</p>
        <h3 className="text-xl font-bold text-foreground transition-colors duration-200 group-hover:text-tech-cyan">{pillar.title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{pillar.description}</p>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-glass-border/70 pt-4 text-xs text-muted-foreground">
          <span>{pillar.meta}</span>
          <ArrowRight className="h-4 w-4 text-tech-cyan transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </div>
    </a>
  );
}

function ArticleStrip({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <GlassCard className="mt-6 rounded-macos-2xl p-4 sm:p-5" hoverEffect={false}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-foreground">近期热门</h3>
        <a href="/articles" className="text-sm font-medium text-tech-cyan hover:text-tech-lightcyan">
          全部文章
        </a>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {articles.slice(0, 3).map((article) => (
          <a
            key={article.id}
            href={`/articles/${article.id}`}
            className="rounded-macos-md border border-glass-border/70 bg-background/30 p-4 transition-colors duration-200 hover:border-tech-cyan/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-cyan/60"
          >
            <p className="line-clamp-2 text-sm font-medium text-foreground">{article.title}</p>
            <p className="mt-2 text-xs text-muted-foreground">{article.categories?.[0]?.name || '未分类'}</p>
          </a>
        ))}
      </div>
    </GlassCard>
  );
}

export default function FeaturedHighlights() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getPopularArticles({ limit: 3 });
        if (mounted) {
          setArticles(result);
        }
      } catch {
        if (mounted) {
          setError('热门文章暂时加载失败');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadArticles();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <HomeSectionHeader
        eyebrow="Featured"
        title="从问题到沉淀的内容入口"
        description="首页不再堆叠炫技卡片，而是把最常访问的内容方向组织成可快速理解的入口。"
        action={<HomeTextLink href="/articles">查看更多精选</HomeTextLink>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {focusPillars.map((pillar) => (
          <FocusPillarCard key={pillar.id} pillar={pillar} />
        ))}
      </div>

      {loading ? (
        <GlassCard className="mt-6 rounded-macos-2xl p-5" hoverEffect={false}>
          <div className="grid gap-3 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div key={`article-strip-skeleton-${index}`} className="h-24 animate-pulse rounded-macos-md bg-glass/30" />
            ))}
          </div>
        </GlassCard>
      ) : error ? (
        <GlassCard className="mt-6 flex flex-col gap-3 rounded-macos-2xl p-5 sm:flex-row sm:items-center sm:justify-between" hoverEffect={false}>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-warning" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            重新加载
          </Button>
        </GlassCard>
      ) : (
        <ArticleStrip articles={articles} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run file-level lint**

```bash
cd frontend
npx eslint src/components/home/FeaturedHighlights.tsx
```

Expected: no errors.

---

### Task 6: Rebuild StatsPanel As Calm Data Hub

**Files:**
- Modify: `frontend/src/components/home/StatsPanel.tsx`
- Uses: `frontend/src/components/home/homeContent.ts`
- Uses: `frontend/src/components/home/HomeSectionHeader.tsx`

- [ ] **Step 1: Replace chart-heavy panel with Liquid Glass data hub**

The new `StatsPanel` should remove the large Recharts dependency from this homepage section. Keep Recharts installed for other files; do not change dependencies.

Use this component structure:

```tsx
'use client';

import { Activity, ArrowUpRight } from 'lucide-react';

import HomeSectionHeader from '@/components/home/HomeSectionHeader';
import GlassCard from '@/components/ui/GlassCard';
import { homeMetrics } from '@/components/home/homeContent';

function MetricCard({ metric }: { metric: (typeof homeMetrics)[number] }) {
  return (
    <div className="rounded-macos-xl border border-glass-border bg-background/30 p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-tech-cyan/30 bg-tech-cyan/10 px-2.5 py-1 text-xs text-tech-cyan">
          {metric.trend}
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </span>
      </div>
      <p className="text-3xl font-bold text-foreground sm:text-4xl">{metric.value}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{metric.description}</p>
    </div>
  );
}

export default function StatsPanel() {
  return (
    <div>
      <HomeSectionHeader
        eyebrow="Signals"
        title="用更少的噪声呈现更清晰的数据"
        description="统计区从复杂图表收敛为可扫描的内容信号，强调博客当前沉淀了什么，以及接下来还能探索什么。"
      />

      <GlassCard className="overflow-hidden rounded-macos-2xl p-4 sm:p-6 lg:p-8" hoverEffect={false}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tech-cyan/70 to-transparent" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homeMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-macos-xl border border-glass-border bg-background/30 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-macos-md bg-tech-cyan/15 text-tech-cyan">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">首页重构方向</h3>
                <p className="text-sm text-muted-foreground">从动效展示转向内容导航和长期信息架构。</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {['入口清晰', '动效克制', '内容优先'].map((label) => (
                <div key={label} className="rounded-macos-md border border-glass-border/70 bg-glass/20 px-4 py-3 text-sm font-medium text-foreground">
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-macos-xl border border-glass-border bg-background/30 p-5">
            <h3 className="text-base font-semibold text-foreground">设计来源</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              主结构借鉴 NexaCore 的企业级卡片和阶段路径，视觉表面保留当前项目的玻璃拟态与科技青色。
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
```

- [ ] **Step 2: Verify Recharts imports are removed from StatsPanel**

```bash
cd frontend
rg -n "recharts|ResponsiveContainer|AreaChart|BarChart" src/components/home/StatsPanel.tsx
```

Expected: no output.

- [ ] **Step 3: Run file-level lint**

```bash
cd frontend
npx eslint src/components/home/StatsPanel.tsx
```

Expected: no errors.

---

### Task 7: Rebuild TechStack Into Categorized Lanes

**Files:**
- Modify: `frontend/src/components/home/TechStack.tsx`
- Uses: `frontend/src/components/home/homeContent.ts`
- Uses: `frontend/src/components/home/HomeSectionHeader.tsx`

- [ ] **Step 1: Replace dense icon motion with categorized lanes**

Use this structure:

```tsx
'use client';

import HomeSectionHeader from '@/components/home/HomeSectionHeader';
import GlassCard from '@/components/ui/GlassCard';
import { techLanes } from '@/components/home/homeContent';

export default function TechStack() {
  return (
    <div>
      <HomeSectionHeader
        eyebrow="Stack"
        title="技术栈按能力分层，而不是只展示 logo"
        description="把工具放回它们承担的职责里：体验、服务、AI 和交付，每一层都服务于这个博客的长期维护。"
      />

      <div className="grid gap-4 lg:grid-cols-4">
        {techLanes.map((lane) => {
          const Icon = lane.icon;

          return (
            <GlassCard key={lane.id} className="rounded-macos-2xl p-5" hoverEffect>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-macos-md bg-tech-cyan/15 text-tech-cyan">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{lane.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{lane.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {lane.items.map((item) => (
                  <span key={`${lane.id}-${item}`} className="rounded-full border border-glass-border bg-glass/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no random-position decorative particles remain in TechStack**

```bash
cd frontend
rg -n "Math\.random|FloatingDots|animate=\{\{|whileHover" src/components/home/TechStack.tsx
```

Expected: either no output or only `whileHover` inherited through `GlassCard` usage. If direct Framer Motion animation remains in this file, remove it.

- [ ] **Step 3: Run file-level lint**

```bash
cd frontend
npx eslint src/components/home/TechStack.tsx
```

Expected: no errors.

---

### Task 8: Rebuild ReadingStats As Statement Split Section

**Files:**
- Modify: `frontend/src/components/home/ReadingStats.tsx`
- Uses: `frontend/src/components/home/homeContent.ts`
- Uses: `frontend/src/components/home/HomeSectionHeader.tsx`

- [ ] **Step 1: Replace chart/tabs-heavy reading panel with Focus AI-style split**

Use this structure:

```tsx
'use client';

import { BookOpen, CheckCircle2 } from 'lucide-react';

import HomeSectionHeader from '@/components/home/HomeSectionHeader';
import GlassCard from '@/components/ui/GlassCard';
import { readingInsights } from '@/components/home/homeContent';

export default function ReadingStats() {
  return (
    <div>
      <HomeSectionHeader
        eyebrow="Reading"
        title="阅读不是消费内容，而是训练判断"
        description="这个区块从复杂图表改为阅读方法说明，让首页更像一个个人知识系统的入口。"
      />

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <GlassCard className="flex min-h-[360px] flex-col justify-between rounded-macos-2xl p-6 sm:p-8" hoverEffect={false}>
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-macos-md bg-tech-cyan/15 text-tech-cyan">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              把输入整理成可以再次调用的知识。
            </h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              阅读区不再强调数字炫耀，而是说明这个博客如何筛选、组织、验证和沉淀内容。
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {['筛选', '实践', '复盘'].map((label) => (
              <div key={label} className="rounded-macos-md border border-glass-border bg-background/30 px-4 py-3 text-sm font-semibold text-tech-cyan">
                {label}
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-4">
          {readingInsights.map((insight) => (
            <GlassCard key={insight.id} className="rounded-macos-xl p-5" hoverEffect>
              <div className="flex gap-4">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-tech-cyan" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tech-cyan">{insight.label}</p>
                  <h3 className="mt-2 text-xl font-bold text-foreground">{insight.value}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify chart imports are removed from ReadingStats**

```bash
cd frontend
rg -n "recharts|AreaChart|ResponsiveContainer|AnimatePresence|activeTab|selectedPeriod" src/components/home/ReadingStats.tsx
```

Expected: no output.

- [ ] **Step 3: Run file-level lint**

```bash
cd frontend
npx eslint src/components/home/ReadingStats.tsx
```

Expected: no errors.

---

### Task 9: Rebuild Timeline As Staircase Roadmap

**Files:**
- Modify: `frontend/src/components/home/Timeline.tsx`
- Uses: `frontend/src/components/home/homeContent.ts`
- Uses: `frontend/src/components/home/HomeSectionHeader.tsx`

- [ ] **Step 1: Replace alternating animated timeline with stable roadmap cards**

Use this structure:

```tsx
'use client';

import { GitBranch } from 'lucide-react';

import HomeSectionHeader from '@/components/home/HomeSectionHeader';
import GlassCard from '@/components/ui/GlassCard';
import { timelineStages } from '@/components/home/homeContent';
import { cn } from '@/lib/utils';

export default function Timeline() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <HomeSectionHeader
        eyebrow="Roadmap"
        title="从捕捉问题到发布沉淀的路径"
        description="时间线改为更容易扫读的阶梯结构，强调这个博客内容产生和迭代的过程。"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="absolute left-5 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-tech-cyan via-tech-sky to-transparent lg:left-1/2 lg:block" aria-hidden="true" />

        <div className="grid gap-4 lg:grid-cols-4 lg:gap-3">
          {timelineStages.map((stage, index) => (
            <GlassCard
              key={stage.id}
              className={cn(
                'relative rounded-macos-2xl p-5 lg:min-h-[360px]',
                index % 2 === 1 && 'lg:mt-12'
              )}
              hoverEffect
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-tech-cyan">{stage.step}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-tech-cyan/30 bg-tech-cyan/10 text-tech-cyan">
                  <GitBranch className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground">{stage.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{stage.description}</p>
              <ul className="mt-5 space-y-2">
                {stage.items.map((item) => (
                  <li key={`${stage.id}-${item}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-tech-cyan" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify removed API dependency is not used by Timeline**

```bash
cd frontend
rg -n "timelineService|mockEvents|useEffect|setIsExpanded|AnimatePresence" src/components/home/Timeline.tsx
```

Expected: no output.

- [ ] **Step 3: Run file-level lint**

```bash
cd frontend
npx eslint src/components/home/Timeline.tsx
```

Expected: no errors.

---

### Task 10: Rebuild SubscribeCard As Compact Bottom CTA

**Files:**
- Modify: `frontend/src/components/home/SubscribeCard.tsx`
- Uses: `frontend/src/components/home/homeContent.ts`
- Uses: `frontend/src/components/home/HomeSectionHeader.tsx`

- [ ] **Step 1: Replace bottom section with restrained glass CTA**

Use this structure:

```tsx
'use client';

import { Mail } from 'lucide-react';

import HomeSectionHeader from '@/components/home/HomeSectionHeader';
import GlassCard from '@/components/ui/GlassCard';
import { subscribeLinks } from '@/components/home/homeContent';

export default function SubscribeCard() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <GlassCard className="relative overflow-hidden rounded-macos-2xl p-6 sm:p-8 lg:p-10" hoverEffect={false}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tech-cyan/70 to-transparent" />

        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <HomeSectionHeader
            eyebrow="Stay Updated"
            title="关注下一次重构、复盘和技术笔记"
            description="不做夸张营销，只保留一个清晰的入口：继续阅读、查看路径，或留下你的想法。"
            align="left"
            className="mb-0"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {subscribeLinks.map((link) => {
              const Icon = link.icon;

              return (
                <a
                  key={link.id}
                  href={link.href}
                  className="flex items-center justify-between rounded-macos-md border border-glass-border bg-background/30 px-4 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:border-tech-cyan/50 hover:text-tech-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-cyan/60"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {link.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-glass-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">也可以通过留言板告诉我你想看的主题。</p>
          <a
            href="/messages"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
            留下想法
          </a>
        </div>
      </GlassCard>
    </div>
  );
}
```

- [ ] **Step 2: Run file-level lint**

```bash
cd frontend
npx eslint src/components/home/SubscribeCard.tsx
```

Expected: no errors.

---

### Task 11: Remove Unused Imports And Confirm Hero Was Not Modified

**Files:**
- Inspect: `frontend/src/components/home/*.tsx`
- Inspect: `frontend/src/components/home/HeroSection.tsx`

- [ ] **Step 1: Search for unused legacy patterns in redesigned files**

```bash
cd frontend
rg -n "recharts|LogoLoop|Math\.random|timelineService|mockEvents|AnimatePresence|ImageTrail|LottieAnimation" src/components/home
```

Expected: no output from these files unless a pattern is still intentionally used by an untouched file. If output points to a redesigned file from Tasks 5-10, remove the import and related code.

- [ ] **Step 2: Confirm HeroSection has no diff**

```bash
cd frontend
git diff -- src/components/home/HeroSection.tsx
```

Expected: no output.

- [ ] **Step 3: Confirm homepage still renders Hero first**

```bash
cd frontend
rg -n "<HeroSection />|aria-label=\"首页首屏\"|FeaturedHighlights" src/app/page.tsx
```

Expected: output shows `aria-label="首页首屏"` and `<HeroSection />` before `FeaturedHighlights`.

---

### Task 12: Full Verification

**Files:**
- Verify: `frontend/__tests__/home.test.tsx`
- Verify: all modified homepage files

- [ ] **Step 1: Run homepage unit test**

```bash
cd frontend
npm test -- --runTestsByPath __tests__/home.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full frontend tests**

```bash
cd frontend
npm test
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript check**

```bash
cd frontend
npm run type-check
```

Expected: PASS.

- [ ] **Step 4: Run ESLint**

```bash
cd frontend
npm run lint
```

Expected: 0 errors. Existing warnings may remain if they are unrelated to this homepage work.

- [ ] **Step 5: Run production build**

```bash
cd frontend
npm run build
```

Expected: build completes successfully and generates all routes.

- [ ] **Step 6: Manual browser check**

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` and verify:

- Hero visual remains unchanged.
- The first section below Hero is the new four-card focus grid.
- Data, tech, reading, timeline, and subscribe sections use consistent glass surfaces.
- Text does not overflow on mobile width around 375px.
- Keyboard focus is visible on links and buttons.
- No section uses full-screen MotionSites video assets below Hero.

---

## Self-Review Checklist

- Spec coverage: The plan covers theme selection outcome: NexaCore structure, Liquid Glass surface treatment, Focus AI statement/split, and Hero preservation.
- Placeholder scan: The plan contains no unresolved placeholders or undefined future steps.
- Type consistency: Shared data interfaces match the consuming snippets: `focusPillars`, `homeMetrics`, `techLanes`, `readingInsights`, `timelineStages`, and `subscribeLinks`.
- Scope check: This is a single frontend homepage redesign. It does not require backend changes, database changes, new dependencies, or deployment config changes.
- Git rule: Do not commit during execution unless the user explicitly authorizes commits.
