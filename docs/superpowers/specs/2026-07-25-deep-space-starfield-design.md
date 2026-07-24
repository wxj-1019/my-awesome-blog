# 深色主题 · 深邃星空背景（综合方案）

> 状态：已确认  
> 日期：2026-07-25  
> 范围：仅深色（dark）模式的全局氛围背景；浅色保持不变  
> 主文件：`frontend/src/components/visual/AmbientBackground.tsx`（dark 分支重构）  
> 视觉伴侣预览：`.superpowers/brainstorm/1890-1784927355/content/starfield-d1-v2.html`（综合方案）

## 1. 背景与目标

当前深色背景「月夜云海」元素过多（满月+月晕+月光海路+三层银边云海+星座+双流星+双山脉+草雾+噪声，10+ 层拼盘），星空只是顶部 `42vh` 两条稀疏固定星带，不够「真实深邃」。

**目标（已确认）：**

- 星空成为主角，营造「遨游深空」的沉浸感
- 纵深层次（远/中/近三层星）
- 慢速长拖尾流星（节奏舒缓，非快闪）
- 深空元素：极淡旋臂星系 + 远方紫蓝星云 + 上浮微尘
- 色彩：冷蓝紫为主调，星云带紫/蓝

**确认的方案：D1 综合**（呼吸明灭星 + 慢流星 + 旋臂星系 + 星云 + 微尘）。

**非目标（YAGNI）：**

- 不改浅色（林间晨光）模式
- 不做超光速穿越（D3 太抢眼，已排除）
- 不做多彩流动星云（D2，已排除）
- 不改 `--background` token 值（仍 `#0c1220`，背景层自己叠加深空渐变）
- 不引入新依赖（纯 canvas + CSS，不引 three.js / tsparticles）

## 2. 接入点（不改）

- `ThemeWrapper`（`src/components/theme-wrapper.tsx:15`）挂载 `<AmbientBackground />`
- 组件 `fixed inset-0 -z-10 pointer-events-none`，全站层
- `mode === 'dark'` 分支整体替换；`mode === 'light'` 分支不动
- 仍用 `useTheme` + `useReducedMotion`

## 3. 视觉构成（dark 分支）

替换现有 dark 分支（约 250–503 行）为 canvas 渲染的深空场景。

### 3.1 渲染方式

用单个 `<canvas>` + `requestAnimationFrame` 绘制全部元素（星、流星、星系、星云、微尘）。相比现有大量 `<motion.div>` + `<style jsx>` 的拼装，canvas 更省 DOM、动画更顺、星点数量可达数百而不卡。

**性能护栏：**
- 星点总量受控（约 130–150 颗）
- `prefers-reduced-motion`：停止 rAF，画一帧静态星图（流星/微尘不出现）
- 页面不可见（`visibilitychange` hidden）时暂停 rAF
- DPR 适配 + ResizeObserver 重排
- 离屏（`display:none` 祖先）不强制处理，canvas 自然停止重绘

### 3.2 元素与参数（对齐预览的综合方案）

| 元素 | 参数 | 说明 |
|------|------|------|
| 底色渐变 | `#040816` → `#0a1228`（顶到底） | 比原 `#060d1a…#0a1626` 更深 |
| 远景星 | ~75 颗，r 0.5–1.1，opacity 0.35–0.9 呼吸 | 错峰明灭，周期 5–7s |
| 中景星 | ~42 颗，r 0.8–1.7 | 同上，稍亮 |
| 近景星 | ~18 颗，r 1.2–2.6，冷蓝白 | 最亮，少量带极淡十字光晕 |
| 慢流星 | prob ~0.0035/帧，同屏 ≤1，sp 0.7，拖尾 90px，life 200 帧 | 约 20–30s 一颗，慢且长 |
| 旋臂星系 | 右下（0.72, 0.68），2 臂，半径 22% 短边，自转 0.0008/帧，`globalCompositeOperation:'lighter'`，核心 alpha 0.10 | 极淡，需细看才见 |
| 星云 ×2 | 紫(120,90,200) 左上、蓝(70,110,190) 中下，半径 90–110，alpha 0.06–0.09 呼吸漂移 | 远方色团 |
| 上浮微尘 | ~22 颗，r 0.4–1.0，上浮 0.08–0.2/帧，横向正弦摆动 | 缓慢漂浮 |
| 中部提亮 | radial-gradient ellipse 中心透明、边缘 0.3 暗角 | 保证卡片/正文可读（沿用现有思路） |

**色彩纪律：** 本文件为氛围层，沿用现有「特许使用场景色值，不走 token」的约定（与原文件注释一致）。深空冷蓝紫为主，星云紫蓝点缀，不引入暖色破坏夜空调性。

### 3.3 可读性

保留现有「中间更透，利于卡片」的 radial 暗角叠加，确保正文与玻璃卡背景不被星点干扰。星点与星系整体偏淡（最高 opacity ~0.9 仅近景少数星）。

## 4. 组件结构

`AmbientBackground.tsx` dark 分支改为：

```
<div fixed inset-0 -z-10 pointer-events-none overflow-hidden data-ambient-mode=dark>
  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />
  {/* 中部提亮暗角（纯 CSS，保留） */}
  <div className="absolute inset-0" style={{ background: radial-gradient(...) }} />
  <style jsx>{ /* 仅 reduced-motion 静态星点回退 + 暗角，无 keyframes 动画 */ }</style>
</div>
```

抽出一个渲染模块便于单测与维护：

- `frontend/src/lib/starfield.ts` — 纯函数 + canvas 渲染类
  - `createStarfield(canvas, opts): { start(), stop(), resize() }`
  - 星点生成、流星/星系/星云/微尘绘制、rAF 循环、visibility 暂停、reduced-motion 静态帧
  - **无 React 依赖**，可在 node/jsdom 测试中实例化（mock canvas context）
- `AmbientBackground.tsx` — 仅 dark 分支调用 `useEffect` 挂载 starfield，light 分支不变

## 5. 数据流

```
ThemeWrapper → AmbientBackground (client)
  useTheme() → mode
  mode==='dark' → useEffect → createStarfield(canvas) → start()
                  cleanup → stop()
  mode!=='dark' → 现有 light JSX（不变）
  useReducedMotion() → 传给 createStarfield，true 时画静态帧
```

## 6. reduced-motion 处理

`reducedMotion === true` 时：
- 不启动 rAF
- 调用 `starfield.drawStatic()` 画一帧：底色 + 全部星点（固定中等亮度）+ 星系 + 星云；流星/微尘不出现
- 保证深空氛围在静态下仍可见，只是不动

## 7. 测试

更新/新增 `frontend/__tests__/AmbientBackground.test.tsx`：

1. dark 模式渲染出 `<canvas>` 且带 `data-ambient-mode="dark"`
2. light 模式不变（仍渲染旭日/光柱等 DOM）
3. reduced-motion 下不报错（canvas 存在但不崩）
4. `createStarfield` 单测（在 `starfield.test.ts`，mock `canvas.getContext('2d')`）：
   - 返回 `{start,stop,resize}` 且 `start/stop` 幂等
   - `drawStatic` 调用 context 的 fillRect/arc（断言被调用）

jsdom 的 canvas `getContext` 默认返回 null；测试需 mock 一个最小 context（记录 fillStyle / arc / fill 调用）。

## 8. 范围与不做

- **改：** `AmbientBackground.tsx`（dark 分支）、新增 `lib/starfield.ts`、更新 `__tests__/AmbientBackground.test.tsx`、新增 `lib/__tests__/starfield.test.ts`（或 `__tests__/starfield.test.ts`）
- **不改：** layout、ThemeWrapper、浅色模式、token、其他页面
- **不删：** light 分支任何元素

## 9. 验收标准

- [ ] 深色模式下，全站背景为深邃星空（三层星 + 慢流星 + 星系 + 星云 + 微尘）
- [ ] 流星慢（约 20–30s 一颗）、拖尾长，非快闪
- [ ] 中部暗角保留，正文/卡片可读
- [ ] `prefers-reduced-motion` 下静态深空帧，无动画
- [ ] 页面隐藏时 rAF 暂停（不耗电）
- [ ] 浅色模式完全不变
- [ ] `tsc` 通过；前端测试全绿
- [ ] 移动端无明显卡顿（星点总量受控）

## 10. 已确认决策摘要

| 问题 | 结论 |
|------|------|
| 风格方向 | B 纵深层次（远/中/近三层星） |
| 动态方向 | D1 静谧遨游（呼吸 + 流星），非穿越 |
| 流星节奏 | 慢（用户反馈原速太快），长拖尾，低频 |
| 深空元素 | 旋臂星系 + 紫蓝星云 + 上浮微尘 |
| 最终方案 | D1 综合（starfield-d1-v2.html 综合方案） |
