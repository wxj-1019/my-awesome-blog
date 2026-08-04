# AI 写作会话工作流设计

> 日期：2026-07-28
> 状态：已确认
> 范围：后台新建/编辑文章的 AI 写作流程

## 1. 背景与目标

当前「新建文章」已经拆成 Phase 1 AI 对话和 Phase 2 编辑器，但仍有四个核心缺口：

1. Phase 1 视觉上像多轮对话，后端实际不知道之前聊过什么。
2. Phase 1 每轮仍偏向直接生成全文，缺少「澄清需求 → 大纲 → 初稿」的可控流程。
3. Phase 2 的局部修改会边生成边覆盖正文，无法先审阅结果。
4. Phase 2 的全文对话没有以当前正文为上下文，也没有建议清单和逐项应用机制。

本次改造目标：

- 建立可恢复、可验证的独立写作会话状态机。
- Phase 1 固定为「澄清需求 → 按钮确认大纲 → 生成初稿 → 确认进入编辑」。
- Phase 2 以人类确认为中心：AI 先给建议或修改预览，用户确认后才改正文。
- 保持文章正文的唯一事实来源为前端表单/Article 草稿，不让写作会话直接修改 Article。

## 2. 核心原则

1. **阶段由服务端控制**：模型负责生成内容，服务端负责阶段和动作是否合法。
2. **一次只问一个问题**：澄清阶段避免一次输出表单式问题清单。
3. **任何正文修改先预览**：局部和全文修改均不得边生成边覆盖正文。
4. **可恢复但不强制恢复**：发现未完成会话时，由用户选择继续或新建。
5. **职责分离**：WritingSession 保存写作过程；Article 保存最终草稿和发布内容。
6. **上下文有界**：模型输入使用需求摘要、最近消息、当前大纲/初稿，避免无限增长。

## 3. 领域模型

新增 `WritingSession` 模型：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID | 会话 ID |
| `user_id` | UUID | 当前用户，必须隔离 |
| `article_id` | UUID nullable | 保存草稿后关联 Article |
| `stage` | enum/string | 当前阶段 |
| `requirements_summary` | text/json | 受众、目标、风格、篇幅等已确认需求 |
| `outline` | text | 当前 Markdown 大纲 |
| `draft` | text | 当前完整初稿 |
| `messages` | JSON/list 或关系表 | 写作阶段消息历史 |
| `status` | active/completed/abandoned | 会话状态 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

阶段枚举：

```text
clarifying
outline_review
drafting
draft_review
editing
completed
```

合法转换：

```text
clarifying
  -> outline_review         生成大纲成功
outline_review
  -> outline_review         调整大纲
  -> drafting               用户确认大纲
drafting
  -> draft_review           初稿生成成功
draft_review
  -> draft_review           对话调整初稿
  -> editing                用户确认初稿
editing
  -> completed              文章发布成功
```

非法转换必须返回 409/ValidationException，不能由模型自行跳级。

## 4. 后端 API

路由前缀：`/api/v1/agent/writing-sessions`

### 4.1 会话生命周期

- `POST /writing-sessions`
  - 创建新会话。
  - 返回 `stage=clarifying`。

- `GET /writing-sessions/active`
  - 返回当前用户最近一个未完成会话；不存在返回 404 或 `null` 信封，实施时统一项目惯例。

- `GET /writing-sessions/{id}`
  - 返回阶段、需求摘要、消息、大纲、初稿、建议和关联 article_id。
  - 必须校验当前用户所有权。

- `POST /writing-sessions/{id}/abandon`
  - 放弃会话，二次确认由前端承担。

### 4.2 Phase 1

- `POST /writing-sessions/{id}/message/stream`
  - 澄清阶段：每轮只问一个问题；信息充分时返回 `ready_for_outline=true` 元事件。
  - 大纲阶段：根据用户反馈更新大纲。
  - 初稿阶段：根据用户反馈更新初稿。
  - SSE 事件沿用：
    - `{"content":"..."}`
    - `{"meta":{"ready_for_outline":true}}`
    - `{"error":true,"message":"..."}`
    - `[DONE]`

- `POST /writing-sessions/{id}/generate-outline`
  - 输入：无或可选附加要求。
  - 输出：Markdown 大纲。
  - 仅允许 `clarifying -> outline_review`。
  - 输出为空时不转换阶段。

- `POST /writing-sessions/{id}/confirm-outline`
  - 锁定当前大纲，阶段转 `drafting`，然后流式生成初稿。
  - 初稿成功后转 `draft_review`。
  - 流中断时保留临时文本，但阶段不得进入 `draft_review`。

- `POST /writing-sessions/{id}/confirm-draft`
  - 仅允许 `draft_review -> editing`。
  - 返回当前初稿，前端填入 `formData.content`。

### 4.3 Phase 2

- `POST /writing-sessions/{id}/analyze`
  - 输入当前全文。
  - 返回 3–5 条结构化建议：`id/type/title/reason/scope/status`。
  - 类型示例：结构、论证、可读性、SEO、准确性。

- `POST /writing-sessions/{id}/revise-selection/stream`
  - 输入：全文摘要、选中文本、选择起止位置、修改指令、正文版本 hash。
  - 输出：仅修改后的局部文本预览。
  - 不直接修改 Article 或前端正文。

- `POST /writing-sessions/{id}/revise-suggestion/stream`
  - 输入：建议 ID、当前全文、正文版本 hash。
  - 输出：修改预览，包含目标范围和替换文本。

- `POST /writing-sessions/{id}/apply-revision`
  - 输入：revision ID 和应用后的新正文 hash。
  - 仅记录建议/修改已应用，不写 Article 正文。

## 5. Phase 1 界面

页面只显示：

- 返回列表。
- 新建文章标题。
- 四步进度条：澄清需求 / 确认大纲 / 确认初稿 / 编辑发布。
- 当前阶段的对话或文档区。

不加载也不展示：

- 标题输入。
- 正文编辑器。
- 分类标签。
- 封面。
- 发布操作。

### 5.1 澄清需求

- AI 每轮只问一个问题。
- 必须覆盖：目标读者、文章目标、语气风格、篇幅/深度、必须包含的内容。
- 信息充分后出现「生成大纲」按钮。

### 5.2 大纲确认

- 大纲显示在独立 Markdown 文档区域，而非普通气泡。
- 操作：
  - 「继续调整」：继续对话并更新大纲。
  - 「确认大纲并生成初稿」：明确按钮触发。

### 5.3 初稿确认

- 初稿显示在独立滚动文档区域。
- 操作：
  - 继续对话修改初稿。
  - 「确认初稿，进入编辑器」。
- 确认按钮仅在流式完成、初稿非空时启用。

## 6. Phase 2 界面

桌面端：主编辑器 + 右侧 AI 辅助栏。

移动端：AI 辅助栏改为底部抽屉，不压窄编辑器。

### 6.1 选段修改

1. 用户在 textarea 选中内容。
2. 右栏展示选中原文和修改指令输入。
3. AI 流式生成修改结果到预览区。
4. 展示修改前/修改后差异。
5. 用户选择：
   - 应用替换。
   - 放弃。

正文已变化时，比较正文版本 hash；不一致则禁止应用并要求重新选择。

### 6.2 全文建议

- 「分析全文」返回 3–5 条建议清单。
- 每条显示类型、标题、原因、影响范围和状态。
- 点击建议后生成对应修改预览。
- 用户确认后应用，再标记建议完成。
- 不保留当前无上下文的“自由全文对话”。

### 6.3 快捷动作

保留：

- 润色全文。
- 生成标题摘要。
- AI 找封面。

统一规则：

- 润色全文先预览差异，再替换全文。
- 标题/摘要在独立预览中逐项应用。
- 封面继续使用候选图点选。

## 7. 恢复与文章关联

进入新建文章页：

1. 查询当前用户最近未完成 WritingSession。
2. 若存在，展示「继续上次写作 / 开始新文章」。
3. 不自动恢复，防止误覆盖当前意图。

保存草稿：

- 首次创建 Article 后，把 `article_id` 回写 WritingSession。
- 后续恢复可跳转对应编辑页面。

发布文章：

- 发布成功后把 WritingSession 标记为 `completed`。

## 8. 错误与并发处理

- LLM 失败：保留当前阶段和用户消息，显示「重试本轮」。
- SSE 中断：保留临时生成内容，但确认按钮禁用。
- 空结果：不转换阶段。
- 重复点击：服务端 action 使用当前 stage 做幂等/冲突校验。
- 跨用户访问：返回 404/ForbiddenException，不泄露会话存在性。
- 选段修改冲突：正文 hash 不一致时拒绝应用。
- 对话过长：维护 `requirements_summary`，仅发送摘要 + 最近消息 + 当前文档。

## 9. 组件边界

建议新增/拆分：

- `WritingSessionShell`：阶段恢复、进度、全局错误。
- `ClarificationChat`：澄清对话。
- `OutlineReview`：大纲文档和确认动作。
- `DraftReview`：初稿文档和确认动作。
- `AIAssistSidebar`：Phase 2 容器。
- `SelectionRevisionPreview`：局部修改差异与应用。
- `ArticleSuggestions`：全文建议清单。

现有 `new/page.tsx` 已超过 1000 行，本次应把工作流状态和 AI 交互迁出页面，页面只负责表单数据和组合布局。

## 10. 测试与验收

### 后端

- 每个合法阶段转换。
- 非法阶段转换返回冲突。
- 跨用户隔离。
- 恢复未完成会话。
- SSE 中断和空结果不推进阶段。
- 对话摘要限制上下文大小。
- 修改预览不直接写 Article。

### 前端

- 首次进入只显示 Phase 1。
- 未完成会话恢复选择。
- 四步进度正确。
- 大纲确认按钮和初稿确认按钮状态。
- 进入 Phase 2 后表单内容正确。
- 选段修改预览的应用/放弃。
- 正文变化冲突阻止错误替换。
- 全文建议逐项应用。

### GUI

- 桌面 1280×720。
- 移动 390×844。
- 无遮挡、溢出和重复滚动陷阱。
- 编辑器主区在桌面不因 AI 栏过度缩窄。

## 11. 非目标

- 不让 WritingSession 直接保存或发布 Article。
- 不把流程状态塞入通用 Conversation。
- 不支持多人协作编辑。
- 不引入自动发布。
- 不在本轮增加新 LLM provider。
