# 首页 · 深海 × 电影 · 一期骨架设计

> 日期：2026-07-20  
> 状态：已批准并实施  
> 气质：D 深海 × 电影 · 范围：一期骨架  
> 决策：矩阵雨默认关闭并可移除挂载；Act 文案中文（如「第一幕 · 展厅」）

## 1. 叙事弧线

| 幕 | 区块 | 中文 Act | 隐喻 |
|----|------|----------|------|
| 0 | Hero | （片头，无 Act 条） | 云海 / 林光 |
| 入水 | Wave + Bubble + DiveTransition | — | 浪线潜入 |
| 1 | FeaturedHighlights | 第一幕 · 展厅 | 水下展柜 |
| 2a | StatsPanel | 第二幕 · 仪表 | 舱内数据 |
| 2b | TechStack | 第二幕 · 栈 | 舱内工具（同幕可共用或分标） |
| 3a | ReadingStats | 第三幕 · 航迹 | 阅读痕迹 |
| 3b | Timeline | 第三幕 · 洋流 | 时间线 |
| 4 | SubscribeCard | 第四幕 · 靠岸 | 订阅浮标 |

## 2. 组件

- `HomeActSection`：`actLabel` + 可选 `title`/`description` + children；默认 `as="section"`
- `DiveTransition`：Hero 下色带融合
- `homeMotion.ts`：统一 ease / duration / stagger / viewport
- `page.tsx`：装配；**不挂载 MatrixCodeRain**
- CursorGlow：降低默认透明度；移动端仍不显示（组件内已有）

## 3. 动效预算

- L0 reduced：无循环
- L1 移动：无矩阵、无光晕、气泡减半
- L2 桌面：浪 + 气泡 + 淡光晕
- L3：现有 MOTION_L3 视频缩放

舒适：同时持续循环默认仅浪+气泡；TechStack 去 pulse 边条。

## 4. 非目标（二期）

精选卷轴、订阅大改、Timeline 重写、全页 GSAP 大片。

## 5. 验收

- 有分幕中文标与入水过渡
- 无矩阵雨挂载
- reduced-motion 安全（浪/气泡/光晕/后备渐变）
- type-check 通过

## 6. 审查迭代（2026-07-20）

| 项 | 处理 |
|----|------|
| Critical：Hero 后备 gradient-move 忽略 RM | 仅 `!reducedMotion` 时设 animation |
| Critical：嵌套 landmark | HomeActSection 去掉 role=region，用 data-act + 可见文案 |
| Important：LogoLoop 第三路循环 | 默认 speed=0，hoverSpeed 悬停才动 |
| Important：第三幕拆标 | 航迹 / 洋流 分两个 Act |
| Important：homeMotion 实际引用 | act/wave/bubbles/glow；content 入场沿用各子组件 |
| Minor：ScrollIndicator / 骨架 shimmer / banner role | 已收紧 |
