# 首页统计卡 · 柔雾仪表（Soft Luminous Console）

> 日期：2026-07-23  
> 状态：实现中（用户确认方案 2，授权完整落地）  
> 范围：`StatsCharts`（月度/周活跃）+ `ReadingStats`（内容统计）

## 1. 目标

将首页三块统计从「硬仪表盘 + 弱动效」升级为统一 **柔雾仪表卡**：

- 壳层更柔、无装饰圆环/硬网格抢读
- 动效完整：入场 stagger · KPI count-up · 图表柔入 · Tab/周期过渡
- 数据接口与 fallback 逻辑不变
- `prefers-reduced-motion` 直接终态

## 2. 非目标

- 不改后端统计 API
- 不做电影 KPI 砍图表重排（方案 3）
- 不新增第三方图表库（继续 Recharts）

## 3. 信息架构

| 卡 | 结构 | 主视觉 |
|----|------|--------|
| 月度统计 | 标题行 + 3 KPI + 圆角柱图 | 柱 stagger 入场感（Recharts isAnimationActive） |
| 周活跃度 | 标题行 + 3 KPI + 双面积线 | 面积渐变 + 细线，无无限脉冲点 |
| 内容统计 | 标题 + 周期 chips + Tab + 面板 | 概览 KPI 柔玻璃 / 热力 token 色 / 趋势面积 |

## 4. 壳层（StatsSoftCard）

- 基于 `GlassCard` 或等价语义：`bg-glass/30`、`border-glass-border`、`rounded-2xl`、`backdrop-blur-xl`
- 顶边极淡 `via-primary/40` 高光一线（非圆环）
- Hover：阴影略升，**不** scale 整卡、**不** 旋转图标
- 禁止：空心 `rounded-full border`、高对比网格底、硬色 KPI 实心砖（概览改柔玻璃）

## 5. 动效预算

| 类型 | 规范 |
|------|------|
| 卡入场 | FadeIn / whileInView，once，y≤12，~0.45s，`EASE.SMOOTH` |
| KPI | `Stagger` + `StaggerItem`，间隔 ≤0.08s；数字用现有 `AnimatedNumber` |
| 图表 | Recharts `isAnimationActive={!reduced}`，duration ~800–1000ms |
| Tab | 内容 `AnimatePresence mode="wait"` 或 CSS opacity 交叉，≤0.28s |
| 循环 | **禁止** 无限 scale/opacity 脉冲（如绿点） |
| RM | 全关动画与 spring，静态终态 |

## 6. 图表 token

- 轴/网格：`muted-foreground` 低透明，不用纯白 `rgba(255,255,255,*)` 硬编码为主
- 主序列：`primary` / tech-cyan 语义；次序列粉可用固定 brand 但 tooltip 走玻璃面板
- Tooltip：`bg-card/95 border-glass-border backdrop-blur`

## 7. 测试

- 保留 `HomeCyberLayers` 的 `reading-cockpit-layer` testid（可保留极淡顶线层）
- 烟测：首页渲染、KPI 文案、Tab 切换不报错
- 类型检查通过

## 8. 文件

- 新增：`frontend/src/components/home/stats/StatsSoftCard.tsx`（可选轻量壳）
- 改：`StatsCharts.tsx`、`ReadingStats.tsx`
- 文档：本文件 + `docs/previews/stats-cards-redesign-directions.html`（方向对照）
