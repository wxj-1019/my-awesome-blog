# 方案 E × motionsites 动效系统

> 最后更新：2026-07-19  
> 决策锁定：**A1 科技深色** + **B1 先基建再窄范围落地**  
> 气质：tech-cyan / glass + Manrope/Syne，不换品牌色/字体

## 1. 分层铁律

| 层级 | 引擎 | 职责 | 目录 |
|------|------|------|------|
| L1 微交互 | Framer Motion | hover/tap、入场、stagger 卡片 | `components/motion/*` |
| L2 页面过渡 | Framer Motion | 路由/弹层 AnimatePresence | `components/motion/*` + PageTransition |
| L3 滚动叙事 | GSAP + ScrollTrigger | pin/scrub/parallax、桥接段 | `components/gsap/*` |
| L4 装饰 | 现有 + 可选 GSAP | TextType、ImageTrail | 现有组件 |
| L5 背景 | CSS / 条件渲染 | MatrixCodeRain、视频底 | `components/background/*` |

### 必须遵守

1. **同一 DOM 的 `transform` / `opacity` 只能由一个引擎驱动**
2. Motion 组件内禁止 `gsap.to`；GSAP 组件内禁止 `motion` 改同一属性
3. 所有入口：`useReducedMotion()` → 静态终态（无位移/缩放）
4. GSAP 插件：`lib/gsap/registry.ts` 幂等注册，仅客户端
5. 列表 stagger：**桌面 ≤12、移动 ≤6**（硬上限 20，见 `MAX_STAGGER_ITEMS`）
6. 素材库外链视频 **不进生产**；只用 `/public/video/*` 或自有 CDN
7. **`BlurIn` 仅用于标题/少量节点**，禁止整页网格 `filter: blur`

### Code review 三问

- [ ] 这个节点的 transform/opacity 是否只由一个引擎驱动？
- [ ] stagger 子项数量是否超限？
- [ ] 是否引入外链演示视频？

## 2. 迁移政策

| 类型 | 规则 |
|------|------|
| **新代码** | 只允许 `@/components/motion`、`@/components/gsap` |
| **旧代码** | 改到哪个文件就迁哪个；不强制一轮清完裸 `framer-motion` |
| **兼容层** | `OptimizedMotion` / `PageTransition` 仅 re-export，**新调用禁止** |
| **动效 PR** | 不与内容真实性/API 修复绑同一 PR |

## 3. 性能预算

| 项 | 阈值 |
|----|------|
| 首页同时 pin 区 | ≤ 1 |
| 同时 scrub 的重节点 | ≤ 2–3 |
| 首屏额外装饰（矩阵雨） | 移动端默认弱/关 |
| 列表 stagger | 桌面 ≤12 / 移动 ≤6 |
| BlurIn | 每屏 ≤3 处标题级 |

## 4. 移动端矩阵

| 能力 | 桌面 | 移动 |
|------|------|------|
| pin | 可 | 否 |
| scrub 重视差 | 可弱 | 否或极弱 |
| 视频 zoom | 可 | 仅 opacity 或关 |
| Matrix 雨 | 可 | 默认关或降采样 |
| stagger | ≤12 | ≤6 或关 |

## 5. 进度源约定

| 场景 | 进度源 | 说明 |
|------|--------|------|
| Hero 视差/淡出 | `useScrollProgress` | rAF，轻量 |
| Bridge pin/scrub | ScrollTrigger | 经 `ensureGsapPlugins` |
| 同一节点 | **禁止** hook 与 ST 同时改 transform |

## 6. 素材映射（只迁模式）

| 区段 | 主参考 | 迁入 | 不迁入 |
|------|--------|------|--------|
| Hero 入场 | automation + yacht | 文案 Motion stagger | Spline / Orbitron |
| Hero→下屏 | crypto-wealth | scrollProgress + 视频 scale | 外链视频 |
| 桥接 | urban-jungle 思路 | 桌面轻量 scrub | 全页 HLS |
| 内容区 | veloce | 标题 BlurIn + 卡片 Stagger | 橙品牌色、网格 blur |
| 导航 | veloce | 抽屉 AnimatePresence | 整站换导航 |

### 默认实现链路（A1）

```text
Hero 文案 stagger（Phase 2）
  → scrollProgress 视频 scale + Hero 淡出（Phase 2）
  → Bridge 桌面 scrub（Phase 2）
  → Featured / Tech / Timeline / Subscribe：标题 BlurIn + 区块 FadeIn（Phase 1）
```

## 7. 分阶段

| Phase | 范围 | 状态 |
|-------|------|------|
| **0 基建** | 目录、token、文档、原子组件 | **完成** |
| **1 L1 收窄** | 首页 Featured / Tech / Timeline / Subscribe + MobileDrawer | **完成** |
| **1.1** | Featured 真数据、Drawer 稳定 exit、Timeline cap 12 | **完成** |
| **2 首页 L3** | Hero + Bridge 滚动旗舰；不做 Stats 深度联动 | **完成** |
| **3 内容页** | 文章/相册 layoutId、轻量 ScrollFloat | 按需 |

### Phase 1 验收（收窄）

- [x] 文档含迁移政策、预算、移动端表
- [x] Featured / Tech / Timeline / Subscribe 使用 `@/components/motion`
- [x] MobileDrawer 开合使用 AnimatePresence（Motion）
- [x] `prefers-reduced-motion` 下组件回退（FadeIn/BlurIn/Stagger/HoverLift）
- [x] type-check 通过

### Phase 1.1 验收（可见收益 + 结构稳定）

#### 功能

- [x] Featured 优先 `getFeaturedArticles(6)`，空则 `getPopularArticles(6)`
- [x] Featured 有数据时渲染 `featured-hero-card` + `featured-satellite-card`
- [x] Featured 无数据时保留「暂无精选文章」
- [x] MobileDrawer：`AnimatePresence` 下 **overlay / panel 分两个树**（稳定 exit，避免 fragment 问题）
- [x] Timeline 标题 `BlurIn`；事件列表渲染上限 **12**（stagger 预算）

#### 工程闸门（必须全部绿）

- [x] `npm run type-check` — 通过（2026-07-19）
- [x] `npm test` — 25 passed（FeaturedHighlights 3 cases）
- [x] `npm run lint` — 0 errors（仅既有 warnings）
- [x] 首页相关 API / 页面 HTTP 抽检 — featured/popular/stats/health + `/` `/articles` 均为 200

#### 人工 / 行为清单（审查用）

1. 桌面打开首页：精选区有真实卡片或明确空态，无控制台 `ENOTFOUND backend`
2. 滚动 Tech / Timeline / Subscribe：标题入场来自 motion 入口
3. 窄屏打开/关闭 MobileDrawer：开合动画完整，关闭后无残留遮罩
4. 系统开启「减少动态效果」：无大位移/缩放入场（允许极短 opacity）
5. 网络断开精选 API：应降级 popular 或空态，不白屏崩溃

#### 明确未做（Phase 1 边界，已移交 Phase 2）

- ~~Hero L3 / pin / 视频 zoom~~ → Phase 2 已做（无 pin）
- StatsPanel 深度动效与拆分
- 全站清除裸 `framer-motion`

### Phase 2 验收（Hero + Bridge L3）

#### 功能 / 架构

- [x] Hero **视频层**与**文案层**分节点（`data-hero-video-layer` / `data-hero-copy-layer`）
- [x] Hero 进度源：`useScrollProgress(heroRef)`（非 ScrollTrigger）
- [x] 桌面：视频 `scale` 随进度；文案 `opacity` + `translateY`
- [x] 移动：无视频 zoom（scale=1），文案淡出减弱
- [x] `prefers-reduced-motion` 或 `NEXT_PUBLIC_MOTION_L3=0`：静态（无 zoom/位移）
- [x] Bridge：`ensureGsapPlugins()`；桌面 scrub 线条/节点；**无 pin**
- [x] 移动 / reduced-motion：Bridge 仅入场或静态，无 scrub
- [x] MatrixCodeRain：移动端与 reduced-motion 不启动

#### 工程闸门

- [x] `npm run type-check` — 通过（2026-07-19）
- [x] `npm test` — 25 passed / 8 suites
- [x] `npm run lint` — 0 errors（6 既有 warnings）

#### 人工清单

1. 桌面滚动首页：视频轻微放大、Hero 文案上移淡出，Bridge 线条有 scrub 感  
2. 窄屏：视频不 zoom，抽屉与内容仍可用  
3. 系统「减少动态效果」：Hero/Bridge 无滚动联动变形  
4. `NEXT_PUBLIC_MOTION_L3=0` 重启 dev：Hero/Bridge 回退为无 L3 滚动  
5. 控制台无 GSAP/代理新错误；不与 Stats 同 PR 大改  

#### Phase 2 明确不做

- Stats 图表与 scroll 联动  
- pin 全屏区  
- 全站清除裸 `motion`  
- 文章/相册 layoutId（Phase 3）

### Phase 1 明确不做（历史）

- Stats 图表与 scroll 联动  
- 全站清除裸 `motion`  
- Navbar 已稳定纯 CSS 下拉：**不强行改**

## 8. 目录与导入

```ts
import { FadeIn, BlurIn, Stagger, StaggerItem, HoverLift, ModalMotion } from '@/components/motion';
import { ScrollReveal, ensureGsapPlugins } from '@/components/gsap';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { EASE, TRANSITION, STAGGER } from '@/lib/animation-utils';
```

## 9. 明确不迁入

- Spline 3D 全屏  
- urban 全页 HLS 滚播  
- 整站换字体/品牌色  
- Vite 工程原样复制  
- 外链演示视频  

## 10. 回滚

- L3 异常：设置 `NEXT_PUBLIC_MOTION_L3=0` 并重启前端，Hero/Bridge 跳过滚动联动  
- 或回退 `HeroSection` / `HomeVisualBridge` 提交，保留 L1 区块动效
