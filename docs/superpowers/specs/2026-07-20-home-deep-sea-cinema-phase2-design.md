# 首页 · 深海 × 电影 · 二期（重型电影）

> 日期：2026-07-20  
> 状态：已批准并实施  
> 范围：精选横向卷轴 + 时间线洋流路径  
> 决策：自动漂移默认关；RM 无 drift / path 动画  

## 1. 目标

1. 第一幕展厅：电影胶片式横向 reel（拖拽 / 键盘 / 箭头 / snap / 焦点景深）
2. 第三幕洋流：中轴 SVG 路径 + 滚动描边进度
3. 延续一期预算：无矩阵雨、默认持续循环不增加自动 drift

## 2. 非目标

订阅片尾、全页色温、API 变更、Timeline 业务逻辑重写

## 3. 组件

- `narrative/FeaturedReel.tsx` + `ReelCard.tsx`
- `narrative/TimelineCurrentPath.tsx`
- `homeMotion.ts` 扩展 `HOME_REEL_*` / `HOME_CURRENT_*`
- `FeaturedHighlights` / `Timeline` 接入

## 4. 验收

- 卷轴可拖键箭浏览；焦点明确
- RM：无 drift、path 满绘静态
- type-check + home tests

## 5. 审查迭代（2026-07-20）

| 级别 | 问题 | 处理 |
|------|------|------|
| Critical | React onWheel preventDefault 可能无效 | 原生 `wheel` + `{ passive: false }` |
| Important | 触控与自定义 drag 冲突 | touch/coarse 跳过 pointer drag，用原生 snap |
| Important | pathLength=0 时 dash 闪断 | 测得长度前进度层 opacity 0 |
| Minor | RM 仍带 scroll-smooth | 仅 `!reduced` 时加 class |
| Minor | endDrag 后 pointerId 清理 | 显式置 null |
