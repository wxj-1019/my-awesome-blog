# Skill 详情页 Hero 减重

> 状态：已确认  
> 日期：2026-07-25  
> 范围：仅 `frontend/src/components/skills/SkillDetailHero.tsx`

## 背景与问题

当前详情页 Hero 过于浮夸，三个来源：

1. **标题过大**：`clamp(2.75rem, 11vw, 7.5rem)` + `break-all`，长名（`frontend-design`/`webapp-testing`）断成 4–5 行占满整屏
2. **逐字错落动效**：每字独立 `rotate:4 + y:0.55em`，台词延迟到 1.1s 才出现，拖沓
3. **背景过重**：聚光 + 左光束 + 右光束 + 底部暗角共 4 层，视觉嘈杂

详情页重点应是内容（SKILL.md 预览/下载），Hero 不应喧宾夺主。

## 设计（减重方案）

保留轻量开场，砍掉浮夸元素；仍遵守项目「克制的惊艳」「深海×电影」设计语言。

| 维度 | 现在 | 改为 |
|------|------|------|
| 标题尺寸 | `clamp(2.75rem, 11vw, 7.5rem)` | `clamp(2.25rem, 7vw, 4.5rem)` |
| 标题换行 | `break-all`（断字） | 去 `break-all`，`break-words` 自然换行 |
| 标题动效 | 逐字错落 | 整体一次淡入上浮 |
| 背景 | 聚光 + 双光束 + 暗角（4 层） | 仅顶部聚光 1 层 |
| 高度 | `min-h-screen` | `min-h-[70vh]` |
| 台词延迟 | `delay: 1.1` | `delay: 0.3` |
| 滚动提示延迟 | `delay: 1.6` | `delay: 0.6` |
| 台词字号 | `xl sm:2xl lg:3xl` | `lg xl sm:2xl`（降一档） |

去掉的「哇点」：逐字标题、双光束。  
保留的「哇点」：大标题 + 顶部聚光 + 标语电影字幕感的引号包裹。

## 动效（全部走现有 token）

| 元素 | 动效 | transition |
|------|------|------------|
| 聚光背景 | opacity 0→1, scale 0.95→1 | `TRANSITION.SLOW` |
| 徽章/标题/台词/线 | opacity 0→1, y 12→0 | `TRANSITION.DEFAULT` |
| 滚动提示 | opacity 0→1 | `TRANSITION.DEFAULT` |

一次性、只动 transform/opacity，无无限循环。`reduced-motion` 全部 `initial:false` 直接呈现（同现状回退策略）。

## 范围与不做

- **只改** `SkillDetailHero.tsx`
- **不动** `SkillDetailContent`、数据层、`SkillContentPanel`、索引页
- **不新增/删组件**
- Hero 无现有单测；本次不强制补测试

## 验收标准

- [ ] 长名（`frontend-design`/`webapp-testing`）不再 `break-all` 断字，自然换行 1–2 行
- [ ] 首屏可见内容更快（总动效 < 1s）
- [ ] `reduced-motion` 下静态可读
- [ ] `tsc` 通过，既有前端测试不回归
