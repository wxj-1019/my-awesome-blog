# 首页数据卡片 lieflat 单色编辑感重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页统计卡片从多彩仪表盘风重设计为 lieflat 单色编辑感（仅 primary 浓度 + 去网格 + 柱顶标值 + 衬线字体 + 底部生长入场 + hover 联动）。

**Architecture:** 改 `StatsSoftCard`（KPI 去框改顶线、标题衬线）与 `StatsCharts`（柱状图/面积图单色化 + hover 联动状态）。技术栈不变（recharts + Tailwind token）。

**Tech Stack:** recharts（Bar/Area/ReferenceLine/label）、Tailwind、React state（hover 联动）。

**Spec:** `docs/superpowers/specs/2026-07-25-home-stats-lieflat-redesign.md`

---

## File map

| 路径 | 职责 |
|------|------|
| `frontend/src/components/home/stats/StatsSoftCard.tsx` | KPI 去框改顶线、标题衬线、图标去底 |
| `frontend/src/components/home/stats/StatsCharts.tsx` | 柱状图/面积图单色 + 浓度 + 柱顶标值 + hover 联动 |

不改：`ReadingStats.tsx`、`StatsPanel.tsx`、`types.ts`、数据逻辑。

---

### Task 1: StatsSoftCard KPI 去框 + 衬线

**Files:**
- Modify: `frontend/src/components/home/stats/StatsSoftCard.tsx`

- [ ] **Step 1: 改 StatsKpiCell（去卡片框，改顶部细线）**

将 `StatsKpiCell` 的容器 className 从：

```tsx
      className={cn(
        'rounded-xl border border-glass-border/60 bg-glass/25 p-3 text-center',
        'transition-[border-color,background-color] duration-200',
        'hover:border-primary/30 hover:bg-glass/35',
        className
      )}
```

改为：

```tsx
      className={cn(
        'border-t border-primary/15 p-3 text-center',
        'transition-colors duration-200 hover:border-primary/40',
        className
      )}
```

并将数值 div 从：

```tsx
      <div className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
```

改为（加衬线字体）：

```tsx
      <div className="font-serif text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
```

并将 label div 从：

```tsx
      <div className="mb-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        {label}
      </div>
```

改为（大写 + letter-spacing 编辑感）：

```tsx
      <div className="mb-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
```

- [ ] **Step 2: 改标题区（衬线 + 图标去底色）**

在 `StatsSoftCard` 主体，将标题从：

```tsx
          <h3 className="truncate text-lg font-bold text-foreground sm:text-xl">
            {title}
          </h3>
```

改为：

```tsx
          <h3 className="truncate font-serif text-lg font-semibold text-foreground sm:text-xl">
            {title}
          </h3>
```

将图标容器从：

```tsx
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              {icon}
            </div>
```

改为（去背景，纯图标，更编辑感）：

```tsx
            <div className="flex h-9 w-9 shrink-0 items-center justify-center text-primary">
              {icon}
            </div>
```

- [ ] **Step 3: type-check + 冒烟**

```bash
cd frontend && npx tsc --noEmit
```

Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/home/stats/StatsSoftCard.tsx
git commit -m "style(stats): KPI 去框改顶线、标题衬线（lieflat 编辑感）"
```

---

### Task 2: 柱状图单色 + 浓度 + 柱顶标值 + hover 联动

**Files:**
- Modify: `frontend/src/components/home/stats/StatsCharts.tsx`

- [ ] **Step 1: 加 hover 状态 + 浓度计算**

在 `StatsCharts` 组件内 `return` 前，`const chartAnim = !reduced;` 之后加：

```ts
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  /** 按文章数线性映射柱浓度：最小 0.35、最大 0.95 */
  const monthlyValues = monthlyStatsData.map((d) => d.articles);
  const minVal = Math.min(...monthlyValues, 0);
  const maxVal = Math.max(...monthlyValues, 1);
  const opacityFor = (val: number) => {
    if (maxVal === minVal) return 0.65;
    return 0.35 + (0.6 * (val - minVal)) / (maxVal - minVal);
  };
```

import 区把 `useState` 加入 React import（文件顶部 `'use client'` 后）。当前文件未 import React，需加：

```ts
import { useState } from 'react';
```

（放在文件最顶部 import 区第一行）

- [ ] **Step 2: 替换柱状图配置**

找到 `<BarChart` 块（月度统计卡内），将整个 `<BarChart>...</BarChart>` 替换为：

```tsx
            <BarChart
              data={monthlyStatsData}
              margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* lieflat：去虚线网格，仅一条底部细基线 */}
              <ReferenceLine y={0} stroke="color-mix(in srgb, var(--primary) 20%, transparent)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={axisTick}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                width={32}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'color-mix(in srgb, var(--primary) 6%, transparent)' }}
              />
              <Bar
                dataKey="articles"
                fill="var(--primary)"
                radius={[6, 6, 2, 2]}
                name="文章数"
                maxBarSize={44}
                isAnimationActive={chartAnim}
                animationDuration={900}
                animationEasing="ease-out"
                onMouseEnter={(_, i) => setHoverIndex(i)}
              >
                {monthlyStatsData.map((entry, i) => {
                  const base = opacityFor(entry.articles);
                  const op = hoverIndex === null
                    ? base
                    : hoverIndex === i
                      ? Math.min(1, base + 0.15)
                      : 0.2;
                  return (
                    <Cell
                      key={`bar-${i}`}
                      fill="var(--primary)"
                      fillOpacity={op}
                    />
                  );
                })}
                <LabelList
                  dataKey="articles"
                  position="top"
                  fill="var(--primary)"
                  fontSize={11}
                  fontFamily="Georgia, serif"
                />
              </Bar>
            </BarChart>
```

import 区需从 recharts 补充导入 `Cell`、`LabelList`、`ReferenceLine`：

```ts
import {
  BarChart, Bar, Cell, LabelList, ReferenceLine,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
```

（移除不再使用的 `CartesianGrid` 导入）

- [ ] **Step 3: type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: exit 0（若有未使用变量警告，清理 `CartesianGrid`）

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/home/stats/StatsCharts.tsx
git commit -m "style(stats): 柱状图 lieflat 单色浓度 + 柱顶标值 + hover 联动"
```

---

### Task 3: 面积图单色（实线 + 虚线区分）

**Files:**
- Modify: `frontend/src/components/home/stats/StatsCharts.tsx`

- [ ] **Step 1: 替换面积图配置**

找到 `<AreaChart` 块（周活跃度卡内），将整个 `<AreaChart>...</AreaChart>` 替换为：

```tsx
            <AreaChart
              data={weeklyActivityData}
              margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="softAreaVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <ReferenceLine y={0} stroke="color-mix(in srgb, var(--primary) 20%, transparent)" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={axisTick}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                width={32}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
              {/* lieflat 单色：visitors 实线浓、engagement 虚线淡 */}
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="var(--primary)"
                strokeWidth={2.25}
                fill="url(#softAreaVisitors)"
                fillOpacity={hoverIndex === null ? 1 : 0.3}
                name={weeklyFallback ? '访客数' : '活跃度'}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive={chartAnim}
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke="var(--primary)"
                strokeWidth={1.75}
                strokeDasharray="4 3"
                fill="none"
                fillOpacity={hoverIndex === null ? 1 : 0.3}
                name="互动数"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={chartAnim}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </AreaChart>
```

（去掉 `softAreaEngagement` 渐变定义与 `CartesianGrid`）

- [ ] **Step 2: type-check + 全量测试**

```bash
cd frontend && npx tsc --noEmit && npx jest --no-coverage
```

Expected: tsc exit 0；全部测试绿

- [ ] **Step 3: 手动冒烟**

```bash
cd frontend && npm run dev
```

打开 `/`：滚动到统计区，确认：柱状图单色浓度渐变 + 柱顶标数值 + hover 联动；面积图实线+虚线；KPI 顶线分隔 + 衬线数值；reduced-motion 静态。

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/home/stats/StatsCharts.tsx
git commit -m "style(stats): 面积图 lieflat 单色（实线+虚线区分）"
```

---

### Task 4: 合并 + 部署

- [ ] **Step 1: 合并 main 并推送**

```bash
git checkout main
git merge feat/home-stats-lieflat
git push origin main
```

- [ ] **Step 2: 部署前端**

仓库根同步代码 + `bash scripts/server-redeploy.sh frontend`。

- [ ] **Step 3: 生产验证**

`http://49.234.190.85/` 滚动到统计区确认 lieflat 风格生效。

---

## Spec coverage checklist

| 规格要求 | 任务 |
|----------|------|
| 严格单色（仅 primary 浓度） | Task 2（柱 fill=primary + Cell fillOpacity）、Task 3（面积 stroke=primary） |
| 去虚线网格 + 细基线 | Task 2/3（删 CartesianGrid，加 ReferenceLine） |
| 柱顶直标数值 | Task 2（LabelList） |
| KPI 去框改顶线 | Task 1 |
| 衬线字体 | Task 1（KPI + 标题 font-serif） |
| 底部生长入场 | Task 2/3（animationDuration + ease-out） |
| hover 联动 | Task 2（hoverIndex state + Cell fillOpacity） |
| reduced-motion 静态 | Task 2/3（chartAnim） |

## Placeholder scan

无 TBD/TODO；每个步骤含完整代码；无「类似 Task N」。

## Type consistency

- `hoverIndex: number | null`、`setHoverIndex`
- `opacityFor(val) => number`（0.35–0.95）
- recharts `Cell`/`LabelList`/`ReferenceLine` 标准 API
- 移除 `CartesianGrid` 导入
