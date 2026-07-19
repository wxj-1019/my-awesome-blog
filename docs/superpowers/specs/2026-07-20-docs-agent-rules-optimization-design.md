# 文档体系优化设计（Agent 优先 · 方案 1）

> 日期：2026-07-20  
> 状态：已确认并实施  
> 范围：仅文档；不改业务源码  

## 1. 目标

1. `AGENTS.md` 成为短、稳、可扫读的 Agent 总入口。
2. 历史修复表整段迁至 `docs/changelog-agents.md`。
3. `docs/rules/*` 轻量对齐当前代码（路径、清单、读时机），减少与 AGENTS 重复。
4. `README.md` 必要同步：去掉错误默认密码、补能力摘要、指向 AGENTS 与 `/docs`。

## 2. 非目标

- 不重写业务代码、不全面重写 `.cursorrules`、不合并删除 `QWEN.md`。
- 不把 README 做成完整产品营销页。

## 3. 文档职责

| 文档 | 职责 |
|------|------|
| `README.md` | 人类上手、结构、能力摘要 |
| `AGENTS.md` | Agent 铁律、rules 索引、命令、已知坑 |
| `docs/rules/*` | 模块约束 |
| `docs/changelog-agents.md` | 历史问题与修复 |
| `QWEN.md` | 兼容入口，权威以 AGENTS + rules 为准 |

优先级：用户指令 > AGENTS 铁律 > 模块 rules > `.cursorrules`

## 4. 验收

- [x] AGENTS 无完整修复史表，有 changelog 链接
- [x] changelog 含原 §6 内容
- [x] AI rules 文件名与 `backend/app/llm/` 一致
- [x] README 无硬编码示例生产密码
- [x] 规则索引与优先级写清
