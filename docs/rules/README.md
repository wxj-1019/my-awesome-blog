# 项目规则总览

> 本目录存放 My Awesome Blog 的模块级框架规则。  
> **总入口**：[AGENTS.md](../../AGENTS.md)（全局铁律、命令、已知坑）  
> **历史记录**：[changelog-agents.md](../changelog-agents.md)（非必读）  
> 最后更新：2026-07-20

## 优先级

用户明确指令 > `AGENTS.md` 全局铁律 > 本目录模块规则 > [`.cursorrules`](./.cursorrules)

冲突时以上级为准；`.cursorrules` 仅作通用风格补充，不覆盖模块专项约定。

## 规则文件清单

| 文件 | 说明 |
|------|------|
| [../../AGENTS.md](../../AGENTS.md) | 项目总入口：铁律、能力地图、命令、关键路径 |
| [frontend-rules.md](./frontend-rules.md) | 前端：Next.js、TS、组件、页面 metadata |
| [backend-rules.md](./backend-rules.md) | 后端：FastAPI、API、异常、缓存、限流 |
| [database-rules.md](./database-rules.md) | 数据库：Model、Index、CRUD、Alembic |
| [ai-rules.md](./ai-rules.md) | AI/LLM：提供商、对话、记忆、提示词 |
| [ui-design-rules.md](./ui-design-rules.md) | UI：玻璃拟态、token、动画、a11y |
| [frontend-uiux-design-spec.md](./frontend-uiux-design-spec.md) | UI/UX 设计规范（项目版 v2.0）：设计哲学、令牌、主题背景、布局、动效预算、组件、交付清单 |
| [.cursorrules](./.cursorrules) | 通用编码风格（冲突时服从上级） |

## 如何阅读

1. 确定任务范围（前端 / 后端 / DB / AI / UI）。
2. 打开对应模块规则（至少 1 份）。
3. 按规则中的示例路径查看 2–3 个现有文件。
4. 遵守 `AGENTS.md` 全局铁律与最小改动原则。

## 更新记录

| 日期 | 内容 |
|------|------|
| 2026-07-11 | 创建模块化规则体系：frontend/backend/database/ai/ui |
| 2026-07-20 | 对齐 AGENTS 优先级；标明 changelog；轻量路径对齐说明 |
| 2026-07-20 | 新增 frontend-uiux-design-spec.md：通用 UI/UX 规范的项目定制版 |
