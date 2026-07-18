# 项目规则总览

> 本目录存放 My Awesome Blog 的模块级框架规则。Agent 在修改代码前，应先阅读本目录下对应模块的规则。

## 规则文件清单

| 文件 | 说明 |
|------|------|
| [../AGENTS.md](../AGENTS.md) | 项目总入口：全局铁律、常用命令、关键文件索引 |
| [frontend-rules.md](./frontend-rules.md) | 前端开发规则：Next.js、TypeScript、Tailwind、组件规范 |
| [backend-rules.md](./backend-rules.md) | 后端开发规则：FastAPI、API 设计、异常、限流、缓存 |
| [database-rules.md](./database-rules.md) | 数据库规则：Model、Index、CRUD、Alembic 迁移 |
| [ai-rules.md](./ai-rules.md) | AI/LLM 模块规则：提供商、对话、记忆、提示词 |
| [ui-design-rules.md](./ui-design-rules.md) | UI/设计系统规则：玻璃拟态、颜色、动画、排版 |
| [.cursorrules](./.cursorrules) | 通用编码风格与 Cursor 规则（已有） |

## 如何阅读规则

1. **确定任务范围**：本次改动涉及哪些模块？
2. **阅读对应模块规则**：至少阅读 1 个核心模块规则。
3. **查看示例代码**：规则中列出了关键示例文件路径。
4. **遵循全局铁律**：根目录 `AGENTS.md` 中的全局规则优先级最高。

## 规则更新记录

| 日期 | 更新内容 |
|------|---------|
| 2026-07-11 | 创建模块化规则体系：frontend/backend/database/ai/ui |
