# 首页深海×电影 · 多轮迭代记录

> 日期：2026-07-20  
> 覆盖：一期骨架 + 二期卷轴/洋流 + 三期航标  

## Round 1（结构与 a11y / 预算）

| 问题 | 处理 |
|------|------|
| 航标文案含「不订阅」干扰无订阅验收 | 改为中性结语 |
| 第四幕双重 container | Act `contained` 默认包壳；ShoreBeacon 去外层 container |
| 时间线节点色与洋流不一致 | 节点/日期改 `primary` |
| 节点无限 pulse 过多 | 仅 index&lt;3；scale 脉冲 |
| 回顶忽略 RM | `behavior: reduced ? auto : smooth` |
| 卷轴 listbox 缺 orientation | `aria-orientation="horizontal"` |
| 测试误伤文案「订阅」 | 改测 subscribe-band / 订阅按钮 |

## Round 2（验证 + 微抛光）

| 问题 | 处理 |
|------|------|
| ReadingStats 测试噪声 | mock `getPublicStatistics` |
| 精选骨架 RM 仍 pulse | `useReducedMotion` 关闭 animate-pulse |
| Timeline 装饰硬编码 cyan | 改 primary / color-mix |
| Timeline 缺 aria-label | 补「历程时间线」 |

验证：`type-check` / `home.test|HomeCyberLayers` 7/7 / eslint 相关文件 0 error

## 仍保留（非缺陷）

- admin 订阅 API：后台管理用，不在本迭代删除
- `SubscribeCard` 已删除；首页无表单
