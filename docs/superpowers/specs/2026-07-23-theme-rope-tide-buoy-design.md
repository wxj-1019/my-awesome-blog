# 主题拉杆 · 潮汐浮标（方案 2）

> 日期：2026-07-23  
> 用户选择：都想要一点但别太花 → 方案 2  
> 组件：`frontend/src/components/ui/rope-theme-toggler.tsx`

## 目标

在保留「导航吊绳 + 拉动切换 + View Transition 圆扩散」的前提下，增加克制的潮汐感：

1. 把手：日/月玻璃球 → **浮标环**（中心仍可用 Sun/Moon 小图标）
2. 闲置：摇摆 + **极轻上下浮动**（≤4px）
3. 拉动：下拉 → 回弹（改进 keyframes，非单向 10px 卡死）
4. 切换瞬间：1 次涟漪 + 圆扩散 ~420ms、更顺 easing
5. RM：无摇摆/浮动/涟漪/扩散，直接 `setTheme`

## 非目标

- 不做灯笼大改（方案 3）
- 不引入拖拽物理引擎
- 不改 ThemeContext / 三态 auto 逻辑（拉动仍固定 light↔dark）

## 动效预算（中档回调）

| 状态 | 动画 | 时长 |
|------|------|------|
| idle | rope-swing ±3° + 起伏 5px | 3s 循环 |
| pull | 下沉 14px → 回弹 | 420ms 一次 |
| ripple | 单层 scale→1.7 | 550ms 一次 |
| VT | circle 0→maxRadius | 420ms |

## a11y

- 保留 button + aria-label
- `prefers-reduced-motion`：关 idle/pull 循环，无 VT clipPath
- 涟漪 `aria-hidden`、pointer-events-none
