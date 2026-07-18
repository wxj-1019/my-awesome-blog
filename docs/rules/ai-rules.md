# AI / LLM 模块框架规则

> 适用于 `backend/app/llm/`、`backend/app/services/llm_service.py`、对话、记忆、提示词相关代码。修改 AI 功能前必须阅读本文件。

## 1. 模块定位

AI 模块为博客提供智能对话、长期记忆、提示词管理功能。核心能力：

- 多 LLM 提供商支持（DeepSeek、GLM、Qwen）
- 流式/非流式聊天
- 会话（Conversation）管理
- 短期记忆（Redis）+ 长期记忆（PGVector）
- 提示词版本控制与 A/B 测试
- 上下文窗口与摘要

## 2. 目录结构

```
backend/app/
├── llm/                          # LLM 提供商适配层
│   ├── deepseek_provider.py
│   ├── glm_provider.py
│   ├── qwen_provider.py
│   ├── factory.py
│   └── base.py
├── services/
│   ├── llm_service.py            # LLM 业务服务
│   ├── conversation_service.py   # 会话服务
│   ├── memory_service.py         # 记忆服务
│   ├── context_service.py        # 上下文管理服务
│   └── prompt_service.py         # 提示词服务
├── prompts/                      # 提示词模板与管理
│   ├── base.py
│   ├── optimizer.py
│   └── repository.py
├── models/
│   ├── conversation.py
│   ├── memory.py
│   ├── prompt.py
│   ├── context_history.py
│   └── tenant.py
├── api/v1/endpoints/
│   ├── llm.py
│   ├── conversations.py
│   ├── memories.py
│   └── prompts.py
└── core/langchain/               # LangChain 适配
    └── llm_adapter.py
```

## 3. LLM 提供商规则

### 3.1 统一接口
- 所有提供商必须实现统一接口：`chat()`、`stream_chat()`、`get_provider_name()`、`get_model_name()`。
- 新增提供商时参考 `deepseek_provider.py` 实现。

### 3.2 配置来源
- API Key、Base URL、模型名称来自 `app.core.config.settings`。
- 默认模型：`settings.LLM_DEFAULT_MODEL`。
- 超时：`settings.LLM_TIMEOUT`。
- 重试：`settings.LLM_MAX_RETRIES`。

### 3.3 错误处理
- LLM 调用失败必须捕获并转换为 `LLMServiceException`。
- 流式接口错误通过 SSE 返回错误信息，不能直接抛异常中断连接。
- 必须记录失败日志，便于排查。

## 4. 聊天接口规则

### 4.1 非流式聊天
- 入口：`LLMService.chat()`。
- 返回 `LLMChatResponse`，包含 message、model、provider、usage。

### 4.2 流式聊天
- 入口：`LLMService.stream_chat()`。
- 返回 SSE 格式数据流。
- 最后必须发送 `data: [DONE]\n\n`。
- 错误信息以 SSE error 事件发送。

### 4.3 消息格式
- 使用统一的 `ChatMessage` 模型。
- 支持 `role: system / user / assistant`。
- `content` 为字符串。

## 5. 会话管理规则

### 5.1 Conversation 模型
- 一个用户可以有多个会话。
- 会话标题可自动生成（`CONVERSATION_AUTO_TITLE_ENABLED`）。
- 单会话消息数上限：`CONVERSATION_MAX_MESSAGES`。

### 5.2 消息生命周期
- 用户发送消息 → 保存到 conversation → 调用 LLM → 保存 assistant 回复 → 返回给用户。
- 所有消息必须关联到 conversation_id。

## 6. 记忆管理规则

### 6.1 短期记忆
- 存储在 Redis。
- TTL：`MEMORY_SHORT_TERM_TTL`（默认 3600 秒）。
- 用于最近对话上下文。

### 6.2 长期记忆
- 存储在 PostgreSQL + PGVector。
- 向量维度：`MEMORY_VECTOR_DIMENSION`（默认 1536）。
- 检索相似度阈值：`MEMORY_LONG_TERM_THRESHOLD`（默认 0.7）。
- 最大返回条数：`MEMORY_LONG_TERM_MAX_RESULTS`（默认 5）。

### 6.3 记忆使用流程
1. 用户发送消息。
2. 从长期记忆中检索相关内容。
3. 将检索结果注入 system prompt 或上下文。
4. LLM 生成回复。
5. 将关键信息提取并保存到长期记忆。

## 7. 上下文管理规则

### 7.1 上下文窗口
- 默认窗口大小：`CONTEXT_DEFAULT_WINDOW_SIZE`（10 条消息）。
- 最大窗口：`CONTEXT_MAX_WINDOW_SIZE`（50 条消息）。

### 7.2 上下文摘要
- 当消息数超过 `CONTEXT_SUMMARIZATION_THRESHOLD`（20）时触发摘要。
- 摘要模型：`CONTEXT_SUMMARIZATION_MODEL`。
- 摘要后替换早期消息，保留关键信息。

## 8. 提示词管理规则

### 8.1 Prompt 模型
- 支持多版本：`PROMPT_DEFAULT_VERSION`。
- 最大版本数：`PROMPT_MAX_VERSIONS`。
- 支持 A/B 测试：`PROMPT_AB_TEST_ENABLED`、`PROMPT_AB_TEST_TRAFFIC_SPLIT`。

### 8.2 提示词模板
- 基础模板放在 `backend/app/prompts/`。
- 模板必须可参数化，禁止硬编码用户数据。
- 新增提示词必须走 repository 管理。

## 9. 多租户规则

- `TENANT_ENABLED` 控制是否启用多租户。
- 每个租户有独立的 context_window_size、max_storage_mb。
- AI 数据查询必须按 tenant_id 隔离。

## 10. 安全与合规

- 禁止将用户密钥、密码传入 LLM。
- LLM 返回内容需要校验后再展示（防 XSS）。
- 敏感操作（删除会话、删除记忆）需要用户确认。
- 流式接口必须设置合理的超时和断开保护。

## 11. 新增 LLM 提供商流程

1. 在 `backend/app/llm/` 下新增 `{provider}_provider.py`。
2. 实现统一接口。
3. 在 factory 中注册。
4. 在 `app.core.config.Settings` 中添加配置项。
5. 更新 `LLMService._get_display_name()` 显示名称。
6. 添加单元测试。

## 12. 禁止事项

- ❌ 禁止在提示词中直接拼接用户输入（必须参数化）
- ❌ 禁止将系统密钥通过 LLM 请求发送
- ❌ 禁止无限制地保存记忆（必须控制数量和大小）
- ❌ 禁止在流式响应中泄露内部错误堆栈
- ❌ 禁止跨租户访问 conversation/memory 数据

## 13. 示例参考

- LLM Service：`backend/app/services/llm_service.py`
- 提供商：`backend/app/llm/deepseek_provider.py`
- 配置：`backend/app/core/config.py`（LLM 相关部分）
- Endpoint：`backend/app/api/v1/endpoints/llm.py`
- 模型：`backend/app/models/conversation.py`、`backend/app/models/memory.py`
