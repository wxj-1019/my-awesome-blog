# 文章详情页沉浸 UI/UX 设计

> 日期：2026-07-19  
> 状态：已确认并实施  
> 范围：`/articles/[id]` 详情页 only  
> 路径：方案 1 · 渐进增强现有详情（双轨沉浸）

## 决策摘要

| 项 | 选择 |
|----|------|
| 范围 | B 详情页 |
| 气质 | C 沉浸特效 |
| 移动/长文 | A 激进保性能 |
| 布局 | B 双轨（左 TOC，右正文） |
| 特效优先级 | 3 TOC → 1 章节舞台 → 2 正文 reveal → 5 互动微粒 |
| 实现路径 | 方案 1 |

## 结构

- 顶栏 `ReadingProgressBar` + 共享 `useReadingProgress`
- 章节舞台：封面区 + 标题 `layoutId` + meta
- `lg+`：左轨 sticky TOC + 进度；右轨正文/互动/评论
- 移动：单栏；TOC 抽屉/折叠；无视差、无段落 reveal

## 动效与预算

- TOC：IO 高亮 + smooth scroll（reduced → auto）
- 舞台：标题 BlurIn≤1；meta FadeIn；封面桌面轻 progress 视差（单节点单引擎）
- 正文：桌面前 12 块级 once reveal；移动/reduced 关
- 互动：HoverLift / spring，无粒子场
- 无 pin；BlurIn 每页 ≤1

## 不做

列表大改、代码扫光、背景氛围、GSAP pin、改 API/Markdown 协议

## 验收

见实施 PR 自测：双轨、TOC、进度一致、降级、type-check/lint

## 审查迭代（2026-07-19）

已修复：

1. 阅读进度改用 `getBoundingClientRect` + 启动延迟测量  
2. TOC / BodyReveal 在 Markdown 挂载后重试绑定  
3. `GlassCard padding="none"` 避免与外层 `p-6` 双倍内边距  
4. 正文 `ref` 绑在内容根，而非整张卡  
5. 相关文章去掉假 `read_time` 转换，展示分类 + 阅读量  
6. 标题字体 `font-display`（映射 Syne）  
7. 全站裸 `framer-motion` 仍仅 `lib/framer-motion.ts` 一处
