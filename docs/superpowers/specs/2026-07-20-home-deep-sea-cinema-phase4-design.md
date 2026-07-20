# 首页 · 深海 × 电影 · 四期氛围优化设计

> 日期：2026-07-20
> 状态：**已实施**（含审查修补：Dive opacity 单一来源、多源气泡预算入规）
> 气质：D 深海 × 电影 · 范围：入水装置 + 分幕环境 + 展厅光影 + 全局 Ambient
> 上游：一期（骨架）/ 二期（卷轴·洋流）/ 三期（航标）；本期不重写叙事结构，只补「潜下去」的氛围
> 依据：`docs/motion-system-e.md`、`docs/rules/ui-design-rules.md` §14.1、`E:\A_skill\frontend\animation/*`

## 0. 背景 · 为什么需要本期

一至三期已把「分幕中文标 + 入水色带 + 胶片卷轴 + 洋流描边 + 港口航标」的叙事骨架搭好，但深海视觉**只出现在 Hero 出口**：

- 浪（`WaveStack`）与气泡（`BubbleField`）仅贴 Hero 底部溢出层
- `DiveTransition` 仅 `h-24~32` 渐变 + 一条细线 + 一点 blur，入水感太薄
- 入水之后各幕回到 `bg-background` + 玻璃卡，**玻璃没有「水」可透，显得廉价且单调**
- L3 GSAP 基建（`lib/gsap/*`、`components/gsap/*`）已就绪但首页几乎未挂

本期目标：**让「潜下去」发生在 Hero 之下**，用滚动驱动的氛围层把电影叙事从片头延续到靠岸，且不破坏现有预算与无障碍策略。

## 1. 设计目标与非目标

### 1.1 目标

1. **入水装置（P0）**：`DiveTransition` 升级为多层入水装置，色带 + 折光 + 残影气泡 + 可选光柱
2. **分幕环境层（P1）**：`HomeActSection` 接入 `DepthAmbience`，按深度差异化背景（浅水 / 舱内 / 洋流 / 靠岸）
3. **展厅光影（P2）**：第一幕 Reel 区加顶光 + 暗角 + 焦点卡柔光，让「水下展柜」成立
4. **滚动电影感**：以 GSAP ScrollTrigger scrub 串起入水色温与光斑位移，桌面为主、移动静态
5. **符合 A_skill 清单**：用 `gsap-react / scrolltrigger / timeline / core(matchMedia) / performance / ui-animation / 12-principles / fixing-motion-performance` 指导写法

### 1.2 非目标

- 不重写 `FeaturedReel` 横滑逻辑、不替换 `TimelineCurrentPath` 描边
- 不引入 Three.js / Canvas 粒子海 / Lenis / ScrollSmoother
- 不新增矩阵雨、不开启 Reel 自动漂移、不为靠岸再加无限循环
- 不改后端 API、不改 Reel/Act 业务数据流
- 不替换品牌色与字体（`motion-system-e.md` A1 锁定）

## 2. 叙事弧线（沿用并细化）

| 幕 | 区块 | 中文 Act | 深度 | 环境运动目标 |
|----|------|----------|------|----------------|
| 0 | Hero | 片头 | 海面 | 视频 scale + 文案淡出（已有） |
| 入水 | Wave + Bubble + DiveTransition | — | 水面 → 中层 | **色温灌入 + 气泡上涌（本期重点）** |
| 1 | FeaturedHighlights | 第一幕 · 展厅 | 浅水 | 顶光定住、卷轴横移 |
| 2a | StatsPanel | 第二幕 · 仪表 | 舱内 | 环境变暗一档、网格更「舱」 |
| 2b | TechStack | 第二幕 · 栈 | 舱内 | 同幕共用或略提亮 |
| 3a | ReadingStats | 第三幕 · 航迹 | 中层 | 静态读数、轻入场 |
| 3b | Timeline | 第三幕 · 洋流 | 深层 | 中轴描边 + 两侧水色晕 |
| 4 | ShoreBeacon | 第四幕 · 靠岸 | 上浮 | 环境略提亮、锚点静 |

> 深度递进是「观感目标」，不是物理坐标；通过 `DepthAmbience` 的透明度/暗角色阶表达。

## 3. 技术选型与约束

### 3.1 引擎职责（沿用方案 E）

| 层 | 引擎 | 本期职责 |
|----|------|----------|
| L1/L2 | Framer Motion（`@/components/motion`） | 幕标、块入场（保持现状） |
| L3 | GSAP + ScrollTrigger（`@/components/gsap`） | **Dive scrub 光柱 / 环境光斑视差** |
| CSS | keyframes | 浪、气泡、暗角、焦散斑（静态为主） |
| L0 | `useReducedMotion` | 全部静态终态 |

铁律（`motion-system-e.md`）：

1. **同一 DOM 的 transform / opacity 只能由一个引擎驱动**
2. GSAP 装饰节点与 Framer 内容节点**分离**
3. `useReducedMotion()` → 静态终态
4. GSAP 插件走 `lib/gsap/registry.ts` 幂等注册
5. 列表 stagger 桌面 ≤12 / 移动 ≤6
6. `BlurIn` 仅标题级，每屏 ≤3 处

### 3.2 A_skill 清单映射

| A_skill | 本期用途 |
|---------|----------|
| `gsap-react` | 所有新 GSAP 组件用 `useGSAP` + `scope` + 自动 cleanup |
| `gsap-scrolltrigger` | Dive 光柱 / 环境光斑 scrub；少 pin，`scrub: 1` |
| `gsap-timeline` | 入水多段（色带→折光→光柱）一条 timeline + scrub |
| `gsap-core` | `gsap.matchMedia()` 分桌面 / 移动 / reduceMotion |
| `gsap-performance` | 只动 `x/y/scale/opacity/autoAlpha`；慎用 will-change |
| `ui-animation` | 决策：CSS（简单）vs GSAP（scroll/序列） |
| `framer-motion-animator` | 幕标/卡入场 once `whileInView`（保持现有 FadeIn/BlurIn） |
| `12-principles` | Staging（主运动一次）、Slow in-out、Secondary（气泡随下潜） |
| `fixing-motion-performance` | 验收：无 layout 属性动画、滚动里不疯狂 getBoundingClientRect |
| `svg-animation` | 核对洋流 dash 初始化（已修 pathLength=0，不动） |
| `impeccable` / `taste-skill` | 反「处处 glass + 无限微动画」；一层主氛围 + 克制强调色 |
| `make-interfaces-feel-better` | Reel 卡 hover 1.01–1.02、focus-visible、有色阴影 |

### 3.3 预算（与 ui-design-rules §14.1 对齐）

| 项 | 阈值 |
|----|------|
| 首页同时 pin 区 | ≤ 1（本期默认 0，Dive 不 pin） |
| 同时 scrub 重节点 | ≤ 2–3 |
| 持续循环 | **浪 + 多源稀疏气泡（分级）**，见下表 |
| Reel 自动漂移 | 关（沿用二期） |
| 矩阵雨 | 无 |
| stagger | 桌面 ≤12 / 移动 ≤6 |
| 装饰层 `pointer-events-none` + `aria-hidden` | 必须 |

#### 3.3.1 持续循环：多源稀疏气泡（已承认）

一期原文「仅浪 + 气泡」在四期落地后扩展为 **同一组件 `BubbleField` 的多源分级**，禁止再开第四类无限循环：

| 源 | 位置 | 桌面 | 移动 | 高光 | 说明 |
|----|------|------|------|------|------|
| 浪 | Hero 出口 `WaveStack` | 3 层 | 3 层 | — | 唯一波浪循环 |
| 气泡 · Hero | Hero 底溢出 | 16 | 8 | 可开 | `HOME_BUBBLE_COUNT` |
| 气泡 · Dive | `DiveTransition` | 8 | 4 | **关** | `HOME_BUBBLE_COUNT_UNDERWATER` |
| 气泡 · Ambient | 全局 `AmbientBackground` | 6 | 3 | **关** | 全站极淡；RM 下气泡不渲染 |
| 光斑漂移 | Ambient 双 glow | CSS 慢循环 | 同 | — | 仅 transform/opacity；RM 静态 |

合计气泡 DOM 上限约桌面 30、移动 15（无高光时更少）。**禁止**：矩阵雨、Reel autoDrift、每幕无限 pulse 光扫。

### 3.4 移动端矩阵

| 能力 | 桌面 | 移动 |
|------|------|------|
| Dive 光柱 scrub | 可 | 否（静态终态，GSAP set） |
| 环境光斑视差 | 不做（Depth 全静态） | 否 |
| 暗角 / 顶光 | 静态 | 静态（更淡） |
| 气泡（Dive） | 8 | 4 |
| 幕标入场 | once | once |

## 4. 组件设计

### 4.1 `narrative/DiveTransition.tsx`（升级）

责任：Hero 与第一幕之间的多层入水装置。

结构：

```
<div data-dive-root>                       // 容器，-mt 与 Hero 重叠
  <div data-dive-band />                    // 三层色带（CSS）
  <div data-dive-shimmer />                // 水平折光线 1–2 条
  <DiveLightShaft />                       // 可选：GSAP scrub 光柱（独立节点）
  <BubbleField count={desktop8/mobile4} /> // 残影气泡（复用，减半）
</div>
```

色带三层（token 化，禁止裸十六进制）：

| 层 | 自上 | 至 | 用途 |
|----|------|----|------|
| 上 | `transparent` | `primary/8` | 水面折射 |
| 中 | `color-mix(primary, background)` 半透 | 同 | 水体过渡 |
| 下 | 收进 `background` | 略偏 `--tech-deepblue` 透明 | 水下定调 |

折光线：`via-primary/30` 1–2 条。主折光 **opacity 仅由 GSAP 写入**（初值 inline `opacity: 0`，终点 `HOME_DIVE.shimmerOpacity`）；副折光静态。勿再加 Tailwind `opacity-*`，避免与 GSAP 叠乘。

光柱：自上而下径向渐变；**autoAlpha + y 仅 GSAP**（初值 `opacity: 0`，终点 `HOME_DIVE.lightShaftOpacity`）。桌面 scrub；移动 / RM 用 `gsap.set` 终态。同样禁止 class 与 GSAP 双写 opacity。

### 4.2 `narrative/DepthAmbience.tsx`（新建）

责任：分幕环境层，纯装饰，不拦截指针。

Props：

```ts
interface DepthAmbienceProps {
  depth?: 'shallow' | 'cabin' | 'current' | 'shore';
  className?: string;
}
```

| depth | 视觉 | 动效（落地） |
|-------|------|----------------|
| `shallow`（展厅） | 略亮 teal 顶光 + 轻暗角 | **全静态**（不挂 ScrollFloat） |
| `cabin`（仪表/栈） | 更深底 + 舷窗式左右暗 | 全静态 |
| `current`（洋流） | 中轴两侧弱水色晕 | 全静态 |
| `shore`（靠岸） | 略提亮，像上浮 | 全静态 |

原则（impeccable / taste）：

- **落地决策**：Depth 100% 静态。入水 scrub 已是本页唯一主滚动运动，每幕再视差会稀释焦点（原「静态 70% + 滚动 30%」收紧为环境层不滚动驱动）
- 装饰 `pointer-events-none`、`aria-hidden`
- 浅色模式用更低透明度，保证文字对比（WCAG AA）
- 强调色只用 `primary` / `--tech-cyan`，且 ≤3 处

### 4.3 `narrative/HomeActSection.tsx`（扩展）

新增 `depth` prop，透传给 `DepthAmbience`，作为 children 的兄弟装饰层：

```tsx
<div id={id} data-act={actLabel} className={cn('relative scroll-mt-20', className)}>
  <DepthAmbience depth={depth} />
  {/* 现有 header + children，置于 z-10 */}
</div>
```

`contained` / `containerClassName` 等签名不变，**向后兼容**；未传 `depth` 时不渲染装饰层。

### 4.4 `narrative/homeMotion.ts`（扩展常量）

新增（不动现有）：

```ts
export const HOME_DIVE = {
  heightMobile: 'h-40',
  heightDesktop: 'sm:h-56',
  shimmerOpacity: 0.3,       // 主折光 GSAP 唯一目标
  lightShaftOpacity: 0.45,   // 光柱 GSAP 唯一目标（勿与 class opacity 叠乘）
} as const;

// color-mix 百分比预算；实际样式走 CSS 变量 token
export const HOME_DEPTH = {
  shallow: { glow: 13, tint: 5, vignette: 12 },
  cabin: { glow: 6, tint: 12, vignette: 16 },
  current: { glow: 8, tint: 7, vignette: 12 },
  shore: { glow: 12, tint: 4, vignette: 6 },
} as const;

export const HOME_BUBBLE_COUNT_UNDERWATER = {
  desktop: 8,
  mobile: 4,
} as const;
```

> 颜色用 token 或 `primary` 表达，常量里的 rgba 仅作预算记录；实际样式优先走 CSS 变量。

### 4.5 第一幕展厅光影（P2）

不新建组件，改 `FeaturedHighlights` 的 section 外壳：

1. 顶缝光：`radial-gradient` 顶部一缕，桌面可由 `ScrollFloat` 极小幅度位移
2. 四角暗角：`box-shadow inset` 或 `radial-gradient` 边缘暗
3. 焦点卡柔光：沿用 Reel 现有 `box-shadow` cyan（静态/hover，**非无限 pulse**）
4. 可选：卷轴轨道一条「胶片齿孔」装饰线（纯 CSS），强化电影感

**禁止**对每张 Reel 卡再套 GSAP y（与横滑 scroll 冲突，performance skill 反对）。

## 5. 滚动驱动设计

### 5.1 Dive scrub 时间轴

`useGSAP` + `gsap.timeline({ scrollTrigger })`，`scope` 限定在 `data-dive-root`：

```text
scrollProgress (Dive 进入 → 离开视口顶部)
  0%   浪顶仍可见
  30%  水色带 opacity ↑（顶 0.04→0.08，中 0.06→0.12）
  70%  气泡进入第一幕视口（CSS 触发，不在此 timeline）
  100% 背景完成「水下」定调（下色带 opacity 0.1→0.18）
```

- `scrub: 1`（不 true，避免跟手抖）
- 移动端：`gsap.matchMedia()` 跳过，直接 `gsap.set` 终态
- RM：`gsap.set` 终态，无位移

### 5.2 环境光斑视差（可选，P1 末尾）

`DepthAmbience` 内部一个光斑节点，桌面用 `ParallaxLayer speed={0.25}` 或 `ScrollFloat distance={20}`；移动/RM 静态。

**不**给 `#content` 整页上 ScrollSmoother / 全局 Pin。

### 5.3 进度源约定（沿用 motion-system-e §5）

| 场景 | 进度源 |
|------|--------|
| Dive scrub | ScrollTrigger（经 `ensureGsapPlugins`） |
| 环境光斑视差 | ScrollTrigger 或现有 `ParallaxLayer` |
| 洋流描边 | 现有 rAF + pathLength（不动） |
| 同一节点 | 禁止 hook 与 ST 同时改 transform |

## 6. 动效预算表（验收用）

| 设备 | 允许持续循环 | 滚动驱动 | 禁止 |
|------|----------------|----------|------|
| L0 RM | 无（气泡不渲染；Ambient 光斑停） | Dive/光柱 `gsap.set` 终态 | 一切 infinite |
| L1 移动 | 浪 + 气泡分级减半（Hero/Dive/Ambient） | 入场 once；Dive 无 scrub | 桌面级 Parallax / pin |
| L2 桌面 | 浪 + 三级稀疏气泡 + Ambient 慢光斑 | Dive scrub（折光/光柱/深色带） | 自动 reel、每幕光扫、矩阵雨 |
| L3 | 同上 + Hero 视频 scale | 已有 | 与 Motion 同节点；class+GSAP 双写 opacity |

## 7. 性能与无障碍自检（来自 A_skill）

**`gsap-performance` / `fixing-motion-performance`**

- ✅ 只动 `transform` / `opacity` / `autoAlpha`
- ✅ `will-change` 仅在 active 段短时使用，完成移除
- ✅ `scrub: 1`，少 pin
- ✅ 气泡 DOM 减半；水下段可省略高光 span
- ❌ 不动画 `width/height/top/left/margin/padding`
- ❌ 不在 scroll handler 内裸调 `getBoundingClientRect`
- ❌ 不大面积动画 `backdrop-filter` / `filter: blur`

**`fixing-accessibility` / `12-principles`**

- 装饰层 `aria-hidden` + `pointer-events-none`
- 幕标/Reel/航标保持键盘可达、`focus-visible` 可见
- 文字对比 WCAG AA（4.5:1 正文 / 3:1 大字）
- RM 下无循环、无 scrub 抖动、入场可瞬间到位
- Staging：一次主运动（入水色温），气泡是 Secondary

## 8. 文件改动清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `frontend/src/components/home/narrative/DiveTransition.tsx` | 改 | 加厚 + 三层色带 + 折光 + 残影气泡 + 光柱挂载位 |
| `frontend/src/components/home/narrative/DepthAmbience.tsx` | 新建 | depth 变体背景层（shallow/cabin/current/shore） |
| `frontend/src/components/home/narrative/HomeActSection.tsx` | 改 | 新增 `depth` prop，挂载 `DepthAmbience` |
| `frontend/src/components/home/narrative/homeMotion.ts` | 改 | 新增 `HOME_DIVE` / `HOME_DEPTH` / `HOME_BUBBLE_COUNT_UNDERWATER` |
| `frontend/src/components/home/narrative/index.ts` | 改 | 导出 `DepthAmbience` |
| `frontend/src/components/home/FeaturedHighlights.tsx` | 改 | section 外壳加顶光 + 暗角（P2） |
| `frontend/src/app/page.tsx` | 改 | 各 `HomeActSection` 传 `depth` |
| `frontend/__tests__/home.test.tsx` | 改 | 断言 Dive 多层 / DepthAmbience 存在（不锁死文案） |
| `frontend/__tests__/HomeCyberLayers.test.tsx` | 改 | 若断言 Dive 旧结构则更新 |
| `docs/superpowers/specs/2026-07-20-home-deep-sea-cinema-phase4-design.md` | 新建 | 本文档 |

## 9. 落地步骤（建议顺序）

1. **P0 入水**：`DiveTransition` + 水下 `BubbleField`（减半）+ CSS 三层色带
2. **P0b 光柱（可选）**：Dive 内独立节点 + `useGSAP` scrub + `matchMedia`
3. **P1 分幕**：新建 `DepthAmbience`，`HomeActSection` 接入 `depth`
4. **P2 展厅**：`FeaturedHighlights` 外壳顶光 + 暗角
5. **P3 收束**：洋流两侧水色晕（静态）、靠岸略提亮（静态）
6. **验收**：type-check / eslint / home & cyber-layers tests / 本地 RM 与移动视图

每步独立可回退；P0 改完即可本地刷一眼判断是否继续加深。

## 10. 验收清单

- [x] Dive 入水装置多层可见，色温从透明过渡到水下深色
- [x] Dive 区有稀疏气泡上涌（桌面 8 / 移动 4，`withHighlight={false}`）
- [x] 各幕有差异化 depth 背景（全静态 `DepthAmbience`）
- [x] 第一幕展厅有顶光 + 暗角 + 胶片齿孔
- [x] Dive：桌面 scrub / 移动·RM `gsap.set` 终态；主折光与光柱 **opacity 单一来源（仅 GSAP）**
- [x] 装饰层全部 `aria-hidden` + `pointer-events-none`
- [x] 无新增动画库依赖（仅用已有 `gsap` / `@gsap/react`）
- [x] 持续循环 = 浪 + 多源稀疏气泡（Hero/Dive/Ambient 分级）；无矩阵雨；Reel 不自动漂移
- [x] 全局 `AmbientBackground` 替代浅色 Canvas `DynamicBackground`；旧死代码删除
- [x] 相关测试：`home` / `DiveTransition` / `AmbientBackground` / `FeaturedHighlights` / `HomeCyberLayers` 通过
- [ ] （可选）首页去掉/半透明双层 `bg-background`，让 Ambient 在首页透出
- [ ] （可选）Lighthouse 移动端 Performance 基线对比

## 11. 风险与回退

| 风险 | 缓解 |
|------|------|
| scrub 抖动 / 移动卡顿 | `scrub: 1`；移动 `matchMedia` 跳过；RM 静态 |
| 玻璃 + 暗角导致文字对比不足 | 用 token + 浅色模式降透明；对比自检 |
| 气泡 DOM 翻倍 | 水下段复用 `BubbleField` 减半，可省略高光 span |
| GSAP 与 Framer 同节点 | 装饰节点独立，内容节点不动 |
| 测试断言过死 | 只断言结构存在，不锁文案/色值 |

回退：每步独立提交，任一步出问题可 `git revert` 单步，不影响叙事骨架（一至三期）。

## 12. 与 A_skill 的对照承诺

实现时优先打开并遵循：

1. `E:\A_skill\frontend\animation\gsap-react\SKILL.md`（useGSAP + scope + cleanup）
2. `E:\A_skill\frontend\animation\gsap-scrolltrigger\SKILL.md`（scrub / 少 pin / refresh）
3. `E:\A_skill\frontend\animation\gsap-timeline\SKILL.md`（入水多段 timeline）
4. `E:\A_skill\frontend\animation\gsap-core\SKILL.md`（matchMedia / RM）
5. `E:\A_skill\frontend\animation\gsap-performance\SKILL.md`（只动 transform/opacity）
6. `E:\A_skill\frontend\animation\ui-animation\SKILL.md`（CSS first）
7. `E:\A_skill\frontend\animation\12-principles-of-animation\SKILL.md`（Staging / Secondary）
8. `E:\A_skill\frontend\animation\fixing-motion-performance\SKILL.md`（自检）
9. `E:\A_skill\design\taste-skill\SKILL.md` + `frontend\design\impeccable\SKILL.md`（氛围克制）

**不启用**：`threejs-*`、`canvas-2d-animation`、`lenis-smooth-scroll`、`animejs`、`react-spring`、`gsap-plugins` 中的 ScrollSmoother / Draggable / MotionPath / MorphSVG。

> 主题叙事与预算仍以仓库 `narrative/*` + `docs/rules/ui-design-rules.md` §14.1 + `docs/motion-system-e.md` 为准；A_skill 管写法与自检，不覆盖业务预算。

## 13. 实施记录（2026-07-20）

已按 P0 → P2 落地，与 spec 的偏差如下：

| 项 | spec | 实施 | 理由 |
|----|------|------|------|
| DepthAmbience 视差 | 可选 `ScrollFloat`/`ParallaxLayer` 光斑 | 全静态 CSS | 入水 scrub 已是本页唯一主运动；每幕再视差稀释焦点（静态 70% + 滚动 30%） |
| GSAP 分端 | `gsap.matchMedia()` | 沿用仓库 `ScrollFloat`/`ParallaxLayer` 的 matchMedia 早退模式 | 与既有 L3 组件写法一致，静态类名即终态 |
| 色带/光影色值 | rgba 预算记录 | `color-mix(in srgb, var(--token) X%, transparent)`，百分比来自 `HOME_DEPTH` | token 化且浅/深色同比例生效 |
| 气泡 | 复用减半 | 顺带修复 `BubbleField` 上浮行程（translate 百分比相对自身尺寸的 bug），新增 `withHighlight` prop | 原实现气泡几乎不上升，「上涌」不成立 |

验收：`home` / `DiveTransition` / `HomeCyberLayers` / `FeaturedHighlights` 4 套件 13 用例通过；改动文件 ESLint 0 error、TS 0 error（仓库存在与本次无关的存量类型错误：`LottieAnimation`、`MarkdownRenderer` highlight.js 类型、`jest-axe` 类型声明）。
