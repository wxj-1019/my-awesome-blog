# 方案 E × motionsites 动效系统

> 最后更新：2026-07-18  
> 决策：**A1 科技深色** + **B1 先基建 Phase 0/1**  
> 气质：tech-cyan / glass + Manrope/Syne，不换品牌色/字体

## 1. 分层铁律

| 层级 | 引擎 | 职责 | 目录 |
|------|------|------|------|
| L1 微交互 | Framer Motion | hover/tap、入场、stagger 卡片 | `components/motion/*` |
| L2 页面过渡 | Framer Motion | 路由/弹层 AnimatePresence | `components/motion/*` + 现有 PageTransition |
| L3 滚动叙事 | GSAP + ScrollTrigger | pin/scrub/parallax、桥接段 | `components/gsap/*` |
| L4 装饰 | 现有 + 可选 GSAP | TextType、ImageTrail、标题 float | 现有组件 / gsap |
| L5 背景 | CSS / 条件渲染 | MatrixCodeRain、视频底 | `components/background/*` |

### 必须遵守

1. **同一 DOM 的 `transform` / `opacity` 只能由一个引擎驱动**
2. Motion 组件内禁止 `gsap.to`；GSAP 组件内禁止 `motion` 改同一属性
3. 所有入口：`useReducedMotion()` → 静态终态（无位移/缩放动画）
4. GSAP 插件：`lib/gsap/registry.ts` 幂等注册，仅客户端
5. 列表 **>20 项禁止 stagger**（用虚拟列表或取消入场动画）
6. 素材库外链视频 **不进生产**；只用 `/public/video/*` 或自有 CDN

## 2. 素材映射（只迁模式，不照搬皮肤）

| 区段 | 主参考 | 迁入内容 | 不迁入 |
|------|--------|----------|--------|
| Hero 入场 | automation + yacht | 标题/CTA Motion stagger | Spline / Orbitron |
| Hero→下屏 | crypto-wealth | `useScrollProgress` + 视频 scale / Hero fade | CloudFront 外链视频 |
| 桥接 | urban-jungle 思路 | Bridge 桌面 scrub（后续 Phase 2） | 全页 HLS 滚播 |
| 内容区 | veloce | BlurIn / Stagger | 橙品牌色 |
| 导航 | veloce | layoutId 下划线（Phase 1） | 整站换导航结构 |

## 3. 目录与入口

```
frontend/src/
├── lib/
│   ├── animation-utils.ts     # Motion tokens（EASE / TRANSITION / stagger）
│   └── gsap/
│       ├── registry.ts        # ScrollTrigger 幂等注册
│       └── scroll-presets.ts  # pin / scrub / reveal 预设
├── hooks/
│   ├── useReducedMotion.ts    # 已有
│   └── useScrollProgress.ts   # 滚动进度 0–1
├── components/
│   ├── motion/                # L1–L2 只允许 Framer Motion
│   │   ├── index.ts
│   │   ├── FadeIn.tsx
│   │   ├── BlurIn.tsx
│   │   ├── Stagger.tsx
│   │   ├── HoverLift.tsx
│   │   └── ModalMotion.tsx
│   ├── gsap/                  # L3 只允许 GSAP + useGSAP scope
│   │   ├── index.ts
│   │   ├── ScrollReveal.tsx
│   │   ├── ScrollFloat.tsx
│   │   └── ParallaxLayer.tsx
│   ├── ui/OptimizedMotion.tsx # 兼容 re-export
│   └── animations/PageTransition.tsx
```

**推荐导入：**

```ts
import { FadeIn, BlurIn, Stagger, HoverLift } from '@/components/motion';
import { ScrollReveal, ensureGsapPlugins } from '@/components/gsap';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { EASE, TRANSITION, STAGGER } from '@/lib/animation-utils';
```

## 4. 分阶段

| Phase | 内容 | 状态 |
|-------|------|------|
| **0 基建** | 目录、token、文档、BlurIn/Stagger/ScrollReveal/useScrollProgress | **进行中** |
| 1 L1/L2 | 全站列表/导航/按钮接入 motion | 待做 |
| 2 首页 L3 | Hero + Bridge 滚动旗舰 | 待做 |
| 3 内容页 | 文章/相册 layoutId、轻量 ScrollFloat | 按需 |

## 5. 验收清单（Phase 0）

- [x] `docs/motion-system-e.md` 存在且描述 A1+B1
- [x] `components/motion` 与 `components/gsap` 可导入
- [x] `ensureGsapPlugins()` 可重复调用
- [x] `useReducedMotion() === true` 时组件不位移
- [x] TypeScript 通过

## 6. 明确不迁入

- Spline 3D 全屏  
- urban 全页 HLS 滚播  
- 整站换字体/品牌色  
- Vite 工程结构原样复制  
- 外链演示视频  
