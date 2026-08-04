# 首页数据卡片 · lieflat 单色编辑感重设计

> 状态：已确认  
> 日期：2026-07-25  
> 范围：首页统计卡片视觉风格（`StatsCharts` + `StatsSoftCard`）  
> 设计来源：借鉴 [lieflat-charts](https://github.com/larashero3-dotcom/lieflat-charts) 的**设计理念**（不使用其代码——该项目为 PolyForm Noncommercial 许可，不适用于公开运营站点）

## 1. 背景与目标

当前首页统计卡片（月度柱状图 + 周活跃面积图 + KPI）采用多彩（青+紫+粉+琥珀）、虚线网格、渐变填充、KPI 卡片框。视觉较"仪表盘风"，不够编辑感。

**目标（已确认）：**

- 借鉴 lieflat-charts 的单色编辑感设计语言，重设计视觉
- **严格单色**：仅 `--primary` 的浓度变化区分系列，不用多色相
- 去虚线网格，只留一条细基线
- 数值直标在柱顶（编辑杂志感）
- KPI 去卡片框、改顶部细线分隔
- 衬线字体强化"编辑出版物"气质
- 动画：**底部生长入场 + hover 某柱时该柱加亮、其余变淡（联动）**

**非目标（YAGNI）：**

- 不换技术栈（仍 recharts）
- 不动数据源 / 数据结构
- 不改 StatsSoftCard 的对外 API（保持 props 兼容）
- 不引入 lieflat-charts 代码（许可证冲突）
- 不改其他页面（articles/admin 的统计）

## 2. 关键决策（视觉伴侣已确认）

| 维度 | 现状 | 改为 |
|------|------|------|
| 配色 | 青+紫+粉+琥珀多色 | 严格单色：仅 `--primary` 浓度 0.35→0.95 |
| 网格 | 虚线网格 3 条 | 去除，只留 1 条底部细基线 |
| 数值标注 | 仅 tooltip | 柱顶直接标数值（保留 tooltip 作补充） |
| KPI 容器 | 卡片框 + hover 背景 | 去框，顶部细线分隔 |
| 字体 | sans-serif | 数值用衬线（`font-serif`，Georgia 系） |
| 入场动画 | recharts 默认 | 底部 `scaleY` 生长（recharts 原生支持） |
| hover | 无 | 联动：hover 柱加亮 + drop-shadow，其余柱 opacity 降至 0.3 |

## 3. 实现位置

| 文件 | 改动 |
|------|------|
| `frontend/src/components/home/stats/StatsCharts.tsx` | 重设计柱状图/面积图视觉 + hover 联动 |
| `frontend/src/components/home/stats/StatsSoftCard.tsx` | KPI 去框改顶线；标题衬线 |

**不改**：`ReadingStats.tsx`、`StatsPanel.tsx`、`types.ts`、数据获取逻辑。

## 4. 视觉细节

### 4.1 月度柱状图（StatsCharts 左卡）

- **柱色**：所有柱 `fill="var(--primary)"`，每根按数据值映射 opacity（最小值 0.35，最大值 0.95，线性插值）
- **网格**：删 `CartesianGrid`，改加一条 `<ReferenceLine y={0} stroke="color-mix(primary 20%)" />`
- **数值标注**：`<Bar label={{ position: 'top', fill: 'var(--primary)', fontSize: 11 }}>` 直接标柱顶
- **轴**：XAxis/YAxis 文字用 `var(--muted-foreground)`，去 `tickLine`/`axisLine`
- **hover 联动**：`onMouseEnter` 记录 hoverIndex → 其他 Bar `fillOpacity` 降至 0.25，hover 项保持高 opacity + 加 `filter: drop-shadow`
- **入场**：`isAnimationActive` + `animationDuration={900}` + `animationEasing="ease-out"`（recharts 默认即底部生长）

### 4.2 周活跃面积图（StatsCharts 右卡）

面积图双色（visitors + engagement）在严格单色下区分度低。处理：
- 两条线都用 `var(--primary)`，visitors 用 opacity 0.7、engagement 用 opacity 0.35 + 虚线 `strokeDasharray="4 3"`
- 即"同色实线 + 同色虚线淡"，靠线型而非色相区分

### 4.3 KPI 单元（StatsKpiCell）

- 去掉 `rounded-xl border bg-glass` 卡片框
- 改为 `border-t border-primary/15`（顶部细线）+ `pt-3`
- 数值 `font-serif tabular-nums`
- label 大写 + letter-spacing（编辑感）

### 4.4 卡片标题（StatsSoftCard）

- 标题 `font-serif`（Georgia 系衬线）
- 去掉左侧图标圆角框的 `bg-primary/12` 背景，改为纯图标（更编辑感）
- 顶边柔光线保留

## 5. hover 联动状态管理

在 `StatsCharts` 组件内：

```ts
const [hoverIndex, setHoverIndex] = useState<number | null>(null);
// Bar onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}
// 每根柱 fillOpacity = hoverIndex === null ? baseOpacity : (hoverIndex === i ? baseOpacity : 0.25)
```

面积图同理（hover 某点时另一条线变淡）。

## 6. reduced-motion

`useReducedMotion()` 为 true 时：`isAnimationActive={false}`，直接静态呈现；hover 联动仍保留（非动画）。

## 7. 测试

- `StatsCharts`：柱色为 `var(--primary)`、无 CartesianGrid、有 ReferenceLine
- `StatsKpiCell`：含 `border-t`、不含旧卡片框 class
- 现有测试若有断言旧 class，同步更新
- hover 联动：hoverIndex 状态正确（可选，若易测）

## 8. 验收

- [ ] 柱状图/面积图为严格单色（仅 primary 浓度/线型区分）
- [ ] 无虚线网格，只有底部细基线
- [ ] 柱顶直标数值
- [ ] KPI 去框改顶线，数值衬线
- [ ] 入场为底部生长
- [ ] hover 柱时联动变淡
- [ ] reduced-motion 静态
- [ ] tsc + 测试通过

## 9. 合规说明

本设计**不使用** lieflat-charts 项目的任何代码、模板或受版权保护的表达，仅借鉴其公开的设计理念（单色、编辑感、去装饰——这些是设计思想，不受版权保护）。实现完全基于项目自有技术栈（recharts + Tailwind token）独立编写。

## 10. 已确认决策摘要

| 问题 | 结论 |
|------|------|
| 视觉方向 | lieflat 单色编辑感（右） |
| 动画 | D：底部生长 + hover 联动 |
| 单色策略 | 严格单色（仅 --primary 浓度） |
| 是否用 lieflat 代码 | 否（许可证冲突，仅借鉴理念） |
