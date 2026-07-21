# Loop Agent（工具调用循环）实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为博客后端增加 loop agent 能力——LLM 可在多轮循环中自主调用站内工具（搜索文章、文章详情、站点统计），并提供 `/agent/chat` 对话接口与 `/agent/polish` 文章润色（Writer-Critic 循环）接口。

**架构：** 在现有 `app/llm/` provider 层扩展 OpenAI 兼容的 tool calling 支持（三家国产模型均为 OpenAI 兼容协议）；新增 `app/agent/` 模块承载工具注册表（`ToolRegistry`）与循环引擎（`AgentLoop`，硬上限 `max_iterations` + 工具结果截断 + 错误回喂）；服务层 `agent_service` 复用 `get_llm_provider` 工厂；API 层新增 `endpoints/agent.py`，完全复用现有鉴权（`get_current_active_user` / `get_current_superuser`）与限流（`llm_chat_rate_limit`）。

**技术栈：** FastAPI + Pydantic v2 + SQLAlchemy 2.0（同步 Session）+ httpx（provider 层）+ pytest（同步 TestClient，conftest 已 mock 认证/限流/OSS）。

**背景知识（执行者必读）：**
- LLM provider 抽象在 `backend/app/llm/base.py`，实现在 `deepseek_provider.py` / `glm_provider.py` / `qwen_provider.py`（三者结构相同，均为 OpenAI 兼容 payload，POST `{base_url}/chat/completions`）。工厂在 `provider_factory.py`，`get_llm_provider(None)` 返回默认 provider，未配置 API key 时返回 `None`。
- 文章查询用 `app/crud/article.py` 的 `get_articles(db, search=..., published_only=True) -> list[Article]`（ilike，SQLite 兼容）和 `get_article_by_slug(db, slug)`。**不要**用 `search_articles_fulltext`（仅 PostgreSQL，测试库会挂）。
- 测试基建：`backend/app/tests/conftest.py` 提供 `client`（同步 TestClient）和 `test_session`（SQLite 内存库，每测试重建表）fixture；认证已 autouse mock，会在 `test_session` 中持久化一个 `User`（`username="testadmin"`，is_superuser=True），测试中可用 `test_session.query(User).first()` 取到。`pytest.ini` 配置了 `asyncio_mode = auto`，可直接写 `async def test_...`。
- 后端运行测试：`cd backend && pytest`（venv 在 `backend/venv`，Windows 下 `venv/Scripts/activate`）。
- 提交信息规范：中文 Conventional Commits，如 `feat: 扩展 LLM 基类支持 tool calling`。

---

## 文件结构

**新建：**

| 文件 | 职责 |
|------|------|
| `backend/app/agent/__init__.py` | 包标识 + 导出 |
| `backend/app/agent/tools/__init__.py` | 工具子包标识 |
| `backend/app/agent/tools/registry.py` | `AgentTool` 模型 + `ToolRegistry`（注册、生成 ToolDefinition 列表、按名执行并捕获异常） |
| `backend/app/agent/tools/builtin.py` | 三个站内工具函数 + `register_builtin_tools()` |
| `backend/app/agent/loop.py` | `AgentLoop` 循环引擎 + `AgentRunResult` |
| `backend/app/schemas/agent.py` | `AgentChatRequest/Response`、`AgentPolishRequest/Response` 等 Pydantic schema |
| `backend/app/services/agent_service.py` | `AgentService`（chat / polish）+ 模块级单例 |
| `backend/app/api/v1/endpoints/agent.py` | `POST /chat`、`POST /polish` 端点 |
| `backend/app/tests/test_llm_base_tools.py` | base.py 序列化/解析测试 |
| `backend/app/tests/test_agent_registry.py` | 注册表测试 |
| `backend/app/tests/test_agent_builtin_tools.py` | 内置工具测试 |
| `backend/app/tests/test_agent_loop.py` | 循环引擎测试 |
| `backend/app/tests/test_agent_service.py` | 服务层测试 |
| `backend/app/tests/test_agent_api.py` | API 端点测试 |

**修改：**

| 文件 | 改动 |
|------|------|
| `backend/app/llm/base.py` | 新增 `ToolCall`/`ToolDefinition`，扩展 `ChatMessage`/`ChatCompletionRequest`/`ChatCompletionResponse`，新增 OpenAI 序列化/解析辅助函数 |
| `backend/app/llm/deepseek_provider.py` | payload 与响应解析改用 base 辅助函数（支持 tools） |
| `backend/app/llm/glm_provider.py` | 同上 |
| `backend/app/llm/qwen_provider.py` | 同上 |
| `backend/app/api/v1/router.py` | 注册 agent 路由 |
| `README.md` | Core API map 表补 `/agent` |

---

## 任务 1：扩展 LLM 基类支持 tool calling

**文件：**
- 修改：`backend/app/llm/base.py`
- 测试：`backend/app/tests/test_llm_base_tools.py`

- [ ] **步骤 1：编写失败的测试**

创建 `backend/app/tests/test_llm_base_tools.py`：

```python
"""LLM 基类 tool calling 扩展的测试"""
from app.llm.base import (
    ChatCompletionRequest,
    ChatMessage,
    ToolCall,
    ToolDefinition,
    build_openai_payload,
    message_to_openai_dict,
    parse_openai_response,
)


def test_message_to_openai_dict_plain():
    """普通消息序列化为 role + content，不含 None 字段"""
    msg = ChatMessage(role="user", content="你好")
    assert message_to_openai_dict(msg) == {"role": "user", "content": "你好"}


def test_message_to_openai_dict_with_tool_calls():
    """带工具调用的 assistant 消息序列化为 OpenAI tool_calls 格式"""
    msg = ChatMessage(
        role="assistant",
        content="",
        tool_calls=[ToolCall(id="call_1", name="search_articles", arguments='{"query": "next"}')],
    )
    data = message_to_openai_dict(msg)
    assert data["tool_calls"] == [
        {"id": "call_1", "type": "function",
         "function": {"name": "search_articles", "arguments": '{"query": "next"}'}}
    ]


def test_tool_result_message():
    """工具结果消息带 tool_call_id，role 为 tool"""
    msg = ChatMessage(role="tool", content="找到 3 篇文章", tool_call_id="call_1")
    assert message_to_openai_dict(msg) == {
        "role": "tool", "content": "找到 3 篇文章", "tool_call_id": "call_1",
    }


def test_build_openai_payload_with_tools():
    """payload 注入 tools 与 tool_choice；无 tools 时不出现这两个键"""
    tool = ToolDefinition(
        name="search_articles",
        description="搜索站内文章",
        parameters={"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
    )
    request = ChatCompletionRequest(messages=[ChatMessage(role="user", content="hi")], tools=[tool])
    payload = build_openai_payload(request, "deepseek-chat", stream=False)
    assert payload["tools"] == [{
        "type": "function",
        "function": {"name": "search_articles", "description": "搜索站内文章",
                     "parameters": tool.parameters},
    }]
    assert payload["tool_choice"] == "auto"

    plain = build_openai_payload(
        ChatCompletionRequest(messages=[ChatMessage(role="user", content="hi")]),
        "deepseek-chat", stream=False,
    )
    assert "tools" not in plain and "tool_choice" not in plain


def test_parse_openai_response_with_tool_calls():
    """解析含 tool_calls 的响应：content 为 None 时归一为空串"""
    data = {
        "choices": [{
            "message": {
                "role": "assistant",
                "content": None,
                "tool_calls": [{
                    "id": "call_1", "type": "function",
                    "function": {"name": "search_articles", "arguments": '{"query": "next"}'},
                }],
            },
            "finish_reason": "tool_calls",
        }],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
    }
    resp = parse_openai_response(data, "deepseek-chat")
    assert resp.message.content == ""
    assert resp.message.tool_calls[0].name == "search_articles"
    assert resp.message.tool_calls[0].arguments == '{"query": "next"}'
    assert resp.finish_reason == "tool_calls"
    assert resp.usage.total_tokens == 15


def test_parse_openai_response_plain():
    """普通文本响应：tool_calls 为 None"""
    data = {
        "choices": [{"message": {"role": "assistant", "content": "你好"}, "finish_reason": "stop"}],
    }
    resp = parse_openai_response(data, "deepseek-chat")
    assert resp.message.content == "你好"
    assert resp.message.tool_calls is None
    assert resp.finish_reason == "stop"
    assert resp.usage is None
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && pytest app/tests/test_llm_base_tools.py -v`
预期：FAIL，报错 `ImportError: cannot import name 'ToolCall' from 'app.llm.base'`

- [ ] **步骤 3：实现 base.py 扩展**

修改 `backend/app/llm/base.py`：

1. 导入行补充 `Dict, Any`（原有 `from typing import List, Optional` 之类，改为包含 `Any, Dict, List, Optional`）。
2. 在 `ChatMessage` 类中增加两个字段（保持原有 `role`/`content` 不变）：

```python
    # 助手消息请求的工具调用（OpenAI 格式）
    tool_calls: Optional[List["ToolCall"]] = None
    # role="tool" 的消息回指哪一次调用
    tool_call_id: Optional[str] = None
```

3. 在 `ChatMessage` 之后新增两个模型：

```python
class ToolCall(BaseModel):
    """模型发起的一次工具调用（OpenAI 格式：arguments 为 JSON 字符串）"""
    id: str
    name: str
    arguments: str


class ToolDefinition(BaseModel):
    """向模型声明的工具（parameters 为 JSON Schema）"""
    name: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
```

4. `ChatCompletionRequest` 增加：

```python
    # 可用工具列表与选择策略（OpenAI 兼容）
    tools: Optional[List[ToolDefinition]] = None
    tool_choice: str = "auto"
```

5. `ChatCompletionResponse` 增加：

```python
    # 结束原因：stop / tool_calls / length ...
    finish_reason: Optional[str] = None
```

6. 文件末尾新增四个辅助函数：

```python
def message_to_openai_dict(msg: ChatMessage) -> Dict[str, Any]:
    """把 ChatMessage 序列化为 OpenAI 消息格式（省略 None 字段）。"""
    data: Dict[str, Any] = {"role": msg.role, "content": msg.content}
    if msg.tool_calls:
        data["tool_calls"] = [
            {"id": tc.id, "type": "function",
             "function": {"name": tc.name, "arguments": tc.arguments}}
            for tc in msg.tool_calls
        ]
    if msg.tool_call_id:
        data["tool_call_id"] = msg.tool_call_id
    return data


def tools_to_openai_definitions(tools: List[ToolDefinition]) -> List[Dict[str, Any]]:
    """把 ToolDefinition 列表转为 OpenAI tools 参数格式。"""
    return [
        {"type": "function",
         "function": {"name": t.name, "description": t.description, "parameters": t.parameters}}
        for t in tools
    ]


def build_openai_payload(request: ChatCompletionRequest, model_name: str, stream: bool) -> Dict[str, Any]:
    """构建 OpenAI 兼容的 chat/completions 请求体（各 provider 共用）。"""
    payload: Dict[str, Any] = {
        "model": model_name,
        "messages": [message_to_openai_dict(m) for m in request.messages],
        "temperature": request.temperature,
        "top_p": request.top_p,
        "stream": stream,
    }
    if request.max_tokens:
        payload["max_tokens"] = request.max_tokens
    if request.tools:
        payload["tools"] = tools_to_openai_definitions(request.tools)
        payload["tool_choice"] = request.tool_choice
    return payload


def parse_openai_response(data: dict, model: str) -> ChatCompletionResponse:
    """解析 OpenAI 兼容的响应（提取 tool_calls 与 finish_reason，各 provider 共用）。"""
    choice = data["choices"][0]
    message_data = choice["message"]

    tool_calls = None
    if message_data.get("tool_calls"):
        tool_calls = [
            ToolCall(id=tc["id"], name=tc["function"]["name"], arguments=tc["function"]["arguments"])
            for tc in message_data["tool_calls"]
        ]

    usage = None
    if "usage" in data:
        usage_data = data["usage"]
        usage = Usage(
            prompt_tokens=usage_data.get("prompt_tokens", 0),
            completion_tokens=usage_data.get("completion_tokens", 0),
            total_tokens=usage_data.get("total_tokens", 0),
        )

    return ChatCompletionResponse(
        message=ChatMessage(
            role=message_data.get("role", "assistant"),
            content=message_data.get("content") or "",
            tool_calls=tool_calls,
        ),
        model=model,
        usage=usage,
        finish_reason=choice.get("finish_reason"),
    )
```

注意：`ChatMessage` 中 `tool_calls: Optional[List["ToolCall"]]` 引用了后定义的 `ToolCall`，在文件末尾加 `ChatMessage.model_rebuild()`（Pydantic v2 前向引用要求）。

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && pytest app/tests/test_llm_base_tools.py -v`
预期：6 个测试全部 PASS

- [ ] **步骤 5：回归现有 LLM 测试**

运行：`cd backend && pytest app/tests -k "llm or conversation" -v`
预期：已有用例全部 PASS（base 扩展是纯增量，不应破坏现有行为）

- [ ] **步骤 6：Commit**

```bash
git add backend/app/llm/base.py backend/app/tests/test_llm_base_tools.py
git commit -m "feat: 扩展 LLM 基类支持 OpenAI 兼容 tool calling"
```

---

## 任务 2：DeepSeek provider 接入 tool calling

**文件：**
- 修改：`backend/app/llm/deepseek_provider.py`
- 测试：`backend/app/tests/test_llm_base_tools.py`（追加）

- [ ] **步骤 1：编写失败的测试**

在 `backend/app/tests/test_llm_base_tools.py` 末尾追加：

```python
def test_deepseek_parse_response_delegates_tool_calls():
    """DeepSeekProvider._parse_response 能解析 tool_calls"""
    from app.llm.deepseek_provider import DeepSeekProvider

    provider = DeepSeekProvider(api_key="fake", base_url="https://api.deepseek.com/v1", model="deepseek-chat")
    data = {
        "choices": [{
            "message": {
                "role": "assistant", "content": None,
                "tool_calls": [{"id": "call_9", "type": "function",
                                "function": {"name": "get_site_stats", "arguments": "{}"}}],
            },
            "finish_reason": "tool_calls",
        }],
    }
    resp = provider._parse_response(data, "deepseek-chat")
    assert resp.message.tool_calls[0].name == "get_site_stats"
    assert resp.finish_reason == "tool_calls"
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && pytest app/tests/test_llm_base_tools.py::test_deepseek_parse_response_delegates_tool_calls -v`
预期：FAIL，`resp.message.tool_calls` 为 None（当前实现丢弃 tool_calls）

- [ ] **步骤 3：修改 deepseek_provider.py**

三处修改：

1. 导入改为（在 `from .base import (...)` 列表中追加 `build_openai_payload`、`parse_openai_response`）。
2. `chat()` 方法中替换 payload 构建块（原 55-64 行，`payload = {...}` 及 `if request.max_tokens:` 两行）为一行：

```python
        payload = build_openai_payload(request, model_name, stream=False)
```

3. `_parse_response` 整个方法体替换为委托：

```python
    def _parse_response(self, data: dict, model: str) -> ChatCompletionResponse:
        """解析API响应（含 tool_calls，共用 OpenAI 兼容解析）"""
        return parse_openai_response(data, model)
```

`stream_chat` 的 payload 块（原 115-124 行）同样替换为 `payload = build_openai_payload(request, model_name, stream=True)`（流式暂不支持工具，但序列化统一可避免 `tool_calls=None` 字段泄漏）。

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && pytest app/tests/test_llm_base_tools.py -v`
预期：全部 PASS

- [ ] **步骤 5：Commit**

```bash
git add backend/app/llm/deepseek_provider.py backend/app/tests/test_llm_base_tools.py
git commit -m "feat: DeepSeek provider 支持 tool calling 请求与解析"
```

---

## 任务 3：GLM / Qwen provider 接入 tool calling

**文件：**
- 修改：`backend/app/llm/glm_provider.py`
- 修改：`backend/app/llm/qwen_provider.py`
- 测试：`backend/app/tests/test_llm_base_tools.py`（追加）

- [ ] **步骤 1：编写失败的测试**

在 `backend/app/tests/test_llm_base_tools.py` 末尾追加：

```python
def test_glm_and_qwen_parse_response_tool_calls():
    """GLM / Qwen provider 同样能解析 tool_calls"""
    from app.llm.glm_provider import GLMProvider
    from app.llm.qwen_provider import QwenProvider

    data = {
        "choices": [{
            "message": {
                "role": "assistant", "content": None,
                "tool_calls": [{"id": "c1", "type": "function",
                                "function": {"name": "search_articles", "arguments": '{"query":"a"}'}}],
            },
            "finish_reason": "tool_calls",
        }],
    }
    for cls, base_url in [
        (GLMProvider, "https://open.bigmodel.cn/api/paas/v4"),
        (QwenProvider, "https://dashscope.aliyuncs.com/compatible-mode/v1"),
    ]:
        provider = cls(api_key="fake", base_url=base_url, model="m")
        resp = provider._parse_response(data, "m")
        assert resp.message.tool_calls[0].name == "search_articles", cls.__name__
        assert resp.finish_reason == "tool_calls", cls.__name__
```

注意：GLM/Qwen provider 的类名与构造函数签名先打开文件确认（结构与 DeepSeek 相同，为 `__init__(self, api_key, base_url, model)`）；若实际类名不同（如 `GlmProvider`），按实际调整 import。

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && pytest app/tests/test_llm_base_tools.py::test_glm_and_qwen_parse_response_tool_calls -v`
预期：FAIL（tool_calls 为 None）

- [ ] **步骤 3：修改两个 provider**

对 `glm_provider.py` 和 `qwen_provider.py` 分别做与任务 2 完全相同的三处修改：

1. `from .base import (...)` 追加 `build_openai_payload`、`parse_openai_response`。
2. `chat()` 中 `payload = {...}` + `if request.max_tokens:` 块替换为 `payload = build_openai_payload(request, model_name, stream=False)`。
3. `_parse_response` 方法体替换为 `return parse_openai_response(data, model)`；`stream_chat` 的 payload 块替换为 `build_openai_payload(request, model_name, stream=True)`。

（GLM 没有模型名前缀修复逻辑，保留其原有 model_name 计算行不变。）

- [ ] **步骤 4：运行测试验证通过 + 全量回归**

运行：`cd backend && pytest app/tests -v`
预期：全部 PASS

- [ ] **步骤 5：Commit**

```bash
git add backend/app/llm/glm_provider.py backend/app/llm/qwen_provider.py backend/app/tests/test_llm_base_tools.py
git commit -m "feat: GLM/Qwen provider 支持 tool calling 请求与解析"
```

---

## 任务 4：工具注册表（app/agent/tools）

**文件：**
- 创建：`backend/app/agent/__init__.py`
- 创建：`backend/app/agent/tools/__init__.py`
- 创建：`backend/app/agent/tools/registry.py`
- 测试：`backend/app/tests/test_agent_registry.py`

- [ ] **步骤 1：编写失败的测试**

创建 `backend/app/tests/test_agent_registry.py`：

```python
"""工具注册表测试"""
from app.agent.tools.registry import AgentTool, ToolRegistry


def _echo_tool(db, text: str) -> str:
    return f"echo:{text}"


def _boom_tool(db) -> str:
    raise RuntimeError("炸了")


def _make_registry() -> ToolRegistry:
    registry = ToolRegistry()
    registry.register(AgentTool(
        name="echo", description="回显",
        parameters={"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]},
        func=_echo_tool,
    ))
    registry.register(AgentTool(name="boom", description="必炸", parameters={"type": "object"}, func=_boom_tool))
    return registry


def test_definitions_generate_tool_definitions(test_session):
    registry = _make_registry()
    defs = registry.definitions()
    assert len(defs) == 2
    assert defs[0].name == "echo"
    assert defs[0].parameters["properties"]["text"]["type"] == "string"


def test_execute_success(test_session):
    registry = _make_registry()
    assert registry.execute(test_session, "echo", {"text": "hi"}) == "echo:hi"


def test_execute_unknown_tool(test_session):
    registry = _make_registry()
    result = registry.execute(test_session, "not_exist", {})
    assert "未知工具" in result


def test_execute_tool_exception_is_caught(test_session):
    """工具抛异常时返回错误字符串而不是向上抛（错误要回喂给模型）"""
    registry = _make_registry()
    result = registry.execute(test_session, "boom", {})
    assert "执行失败" in result
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && pytest app/tests/test_agent_registry.py -v`
预期：FAIL，`ModuleNotFoundError: No module named 'app.agent'`

- [ ] **步骤 3：实现注册表**

创建 `backend/app/agent/__init__.py`：

```python
"""Agent 模块：工具注册表 + 循环引擎（loop agent）。"""
```

创建 `backend/app/agent/tools/__init__.py`：

```python
"""Agent 工具子包。"""
```

创建 `backend/app/agent/tools/registry.py`：

```python
"""Agent 工具注册表：集中管理模型可调用的站内工具。

工具函数约定：同步函数，签名为 (db: Session, **arguments) -> str，
返回给模型的文本结果。异常由注册表捕获并转为错误文本回喂模型。
"""

from typing import Any, Callable, Dict, List

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.llm.base import ToolDefinition
from app.utils.logger import app_logger


class AgentTool(BaseModel):
    """一个可被模型调用的工具：描述 + 执行函数。"""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    name: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)  # JSON Schema
    func: Callable[..., str]


class ToolRegistry:
    """工具注册表：生成给模型的 ToolDefinition 列表，并按名执行工具。"""

    def __init__(self) -> None:
        self._tools: Dict[str, AgentTool] = {}

    def register(self, tool: AgentTool) -> None:
        self._tools[tool.name] = tool

    def definitions(self) -> List[ToolDefinition]:
        """生成传给 LLM 的工具声明列表。"""
        return [
            ToolDefinition(name=t.name, description=t.description, parameters=t.parameters)
            for t in self._tools.values()
        ]

    def execute(self, db: Session, name: str, arguments: Dict[str, Any]) -> str:
        """按名执行工具。任何异常都转为错误文本返回（供模型自我纠正），不向上抛。"""
        tool = self._tools.get(name)
        if tool is None:
            return f"错误：未知工具「{name}」，请从可用工具列表中选择。"
        try:
            return tool.func(db=db, **arguments)
        except TypeError as e:
            app_logger.warning(f"Agent 工具参数错误: {name}({arguments}) -> {e}")
            return f"错误：工具「{name}」参数不合法：{e}"
        except Exception as e:
            app_logger.error(f"Agent 工具执行失败: {name}({arguments}) -> {e}")
            return f"错误：工具「{name}」执行失败：{e}"
```

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && pytest app/tests/test_agent_registry.py -v`
预期：4 个测试全部 PASS

- [ ] **步骤 5：Commit**

```bash
git add backend/app/agent backend/app/tests/test_agent_registry.py
git commit -m "feat: 新增 agent 工具注册表（ToolRegistry）"
```

---

## 任务 5：内置站内工具（搜索文章 / 文章详情 / 站点统计）

**文件：**
- 创建：`backend/app/agent/tools/builtin.py`
- 测试：`backend/app/tests/test_agent_builtin_tools.py`

- [ ] **步骤 1：编写失败的测试**

创建 `backend/app/tests/test_agent_builtin_tools.py`：

```python
"""内置站内工具测试（走 SQLite 内存库，只用 ilike 查询，不依赖 PG 全文搜索）"""
from app.agent.tools.builtin import get_article_detail, get_site_stats, search_articles
from app.models import Article, User


def _create_article(db, title="Next.js 实战指南", slug="nextjs-guide", is_published=True):
    author = db.query(User).first()  # conftest 认证 mock 已持久化一个用户
    article = Article(
        title=title, slug=slug, content="这是一篇关于 Next.js App Router 的长文" * 10,
        excerpt="Next.js 入门到进阶", is_published=is_published, author_id=author.id,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


def test_search_articles_hit(client, test_session):
    _create_article(test_session)
    result = search_articles(test_session, query="Next.js")
    assert "Next.js 实战指南" in result
    assert "nextjs-guide" in result


def test_search_articles_miss(client, test_session):
    _create_article(test_session)
    assert "未找到" in search_articles(test_session, query="不存在的词xyz")


def test_search_articles_excludes_unpublished(client, test_session):
    _create_article(test_session, title="草稿", slug="draft-1", is_published=False)
    assert "未找到" in search_articles(test_session, query="草稿")


def test_get_article_detail(client, test_session):
    _create_article(test_session)
    result = get_article_detail(test_session, slug="nextjs-guide")
    assert "Next.js 实战指南" in result
    assert "正文" in result


def test_get_article_detail_not_found(client, test_session):
    assert "未找到" in get_article_detail(test_session, slug="no-such-slug")


def test_get_site_stats(client, test_session):
    _create_article(test_session)
    result = get_site_stats(test_session)
    assert "已发布文章 1 篇" in result
```

说明：测试签名带 `client` 是为了确保 conftest 的认证 mock（autouse）已把测试用户写进 `test_session`。

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && pytest app/tests/test_agent_builtin_tools.py -v`
预期：FAIL，`ModuleNotFoundError: No module named 'app.agent.tools.builtin'`

- [ ] **步骤 3：实现内置工具**

创建 `backend/app/agent/tools/builtin.py`：

```python
"""Agent 内置站内工具。

约束：
- 只用 ilike / count 等 SQLite 兼容查询（测试库是 SQLite 内存库）；
- 禁止使用 search_articles_fulltext（依赖 PostgreSQL tsvector）；
- 返回给模型的文本要做长度截断，防止撑爆上下文。
"""

from sqlalchemy.orm import Session

from app.agent.tools.registry import AgentTool, ToolRegistry
from app.crud import article as article_crud
from app.models import Article, Comment, FriendLink, Message

# 单条工具结果的最大长度，超出截断（保护上下文窗口）
MAX_DETAIL_CHARS = 2000


def search_articles(db: Session, query: str, limit: int = 5) -> str:
    """按关键词搜索站内已发布文章（标题/摘要/正文 ilike 匹配）。"""
    limit = max(1, min(int(limit), 10))
    articles = article_crud.get_articles(
        db, skip=0, limit=limit, published_only=True, search=query, with_relationships=False,
    )
    if not articles:
        return f"未找到与「{query}」相关的已发布文章。"
    lines = []
    for a in articles:
        line = f"- 《{a.title}》(slug: {a.slug}，浏览 {a.view_count or 0} 次)"
        if a.excerpt:
            line += f"：{a.excerpt}"
        lines.append(line)
    return "找到以下已发布文章：\n" + "\n".join(lines)


def get_article_detail(db: Session, slug: str) -> str:
    """按 slug 获取一篇已发布文章的详情（含截断后的正文）。"""
    article = article_crud.get_article_by_slug(db, slug)
    if article is None or not article.is_published:
        return f"未找到 slug 为「{slug}」的已发布文章。"
    content = (article.content or "")[:MAX_DETAIL_CHARS]
    return (
        f"《{article.title}》(slug: {article.slug})\n"
        f"摘要：{article.excerpt or '无'}\n"
        f"发布时间：{article.published_at}\n"
        f"浏览量：{article.view_count or 0}\n"
        f"正文：{content}"
    )


def get_site_stats(db: Session) -> str:
    """获取站点内容统计（已发布文章数、评论数、留言数、友链数）。"""
    articles = db.query(Article).filter(Article.is_published == True).count()  # noqa: E712
    comments = db.query(Comment).count()
    messages = db.query(Message).count()
    friend_links = db.query(FriendLink).count()
    return (
        f"站点统计：已发布文章 {articles} 篇，评论 {comments} 条，"
        f"留言 {messages} 条，友链 {friend_links} 个。"
    )


def register_builtin_tools(registry: ToolRegistry) -> ToolRegistry:
    """把全部内置工具注册到注册表。"""
    registry.register(AgentTool(
        name="search_articles",
        description="搜索站内已发布的博客文章，按关键词匹配标题、摘要和正文，返回文章列表（含 slug）。当用户询问博主写过什么、找某主题文章时使用。",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "搜索关键词"},
                "limit": {"type": "integer", "description": "最多返回几篇，默认 5，上限 10", "default": 5},
            },
            "required": ["query"],
        },
        func=search_articles,
    ))
    registry.register(AgentTool(
        name="get_article_detail",
        description="按 slug 获取一篇已发布文章的详细内容（标题、摘要、正文）。需要引用或总结某篇具体文章时使用，slug 可通过 search_articles 获得。",
        parameters={
            "type": "object",
            "properties": {
                "slug": {"type": "string", "description": "文章的 slug"},
            },
            "required": ["slug"],
        },
        func=get_article_detail,
    ))
    registry.register(AgentTool(
        name="get_site_stats",
        description="获取站点内容统计：已发布文章数、评论数、留言数、友链数。用户问站点规模/内容数量时使用。",
        parameters={"type": "object", "properties": {}},
        func=get_site_stats,
    ))
    return registry
```

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && pytest app/tests/test_agent_builtin_tools.py -v`
预期：6 个测试全部 PASS

- [ ] **步骤 5：Commit**

```bash
git add backend/app/agent/tools/builtin.py backend/app/tests/test_agent_builtin_tools.py
git commit -m "feat: 新增 agent 内置站内工具（文章搜索/详情/站点统计）"
```

---

## 任务 6：AgentLoop 循环引擎

**文件：**
- 创建：`backend/app/agent/loop.py`
- 测试：`backend/app/tests/test_agent_loop.py`

- [ ] **步骤 1：编写失败的测试**

创建 `backend/app/tests/test_agent_loop.py`：

```python
"""AgentLoop 循环引擎测试（FakeProvider 脚本化响应，不发真实请求）"""
from typing import AsyncIterator, List

from app.agent.loop import AgentLoop
from app.agent.tools.registry import AgentTool, ToolRegistry
from app.llm.base import (
    ChatCompletionResponse,
    ChatMessage,
    ChatStreamChunk,
    LLMProvider,
    ToolCall,
    Usage,
)


class FakeProvider(LLMProvider):
    """按脚本依次返回响应的假 provider，记录每次请求。"""

    def __init__(self, responses: List[ChatCompletionResponse]):
        super().__init__(api_key="fake", base_url="https://fake.local", model="fake-model")
        self._responses = list(responses)
        self.requests = []

    async def chat(self, request) -> ChatCompletionResponse:
        self.requests.append(request)
        return self._responses.pop(0)

    async def stream_chat(self, request) -> AsyncIterator[ChatStreamChunk]:
        yield ChatStreamChunk(content="")

    def get_model_name(self) -> str:
        return self.model

    def get_provider_name(self) -> str:
        return "fake"


def _text_resp(content: str) -> ChatCompletionResponse:
    return ChatCompletionResponse(
        message=ChatMessage(role="assistant", content=content),
        model="fake-model", usage=Usage(prompt_tokens=5, completion_tokens=5, total_tokens=10),
        finish_reason="stop",
    )


def _tool_resp(name: str, arguments: str, call_id: str = "call_1") -> ChatCompletionResponse:
    return ChatCompletionResponse(
        message=ChatMessage(role="assistant", content="",
                            tool_calls=[ToolCall(id=call_id, name=name, arguments=arguments)]),
        model="fake-model", usage=Usage(prompt_tokens=5, completion_tokens=5, total_tokens=10),
        finish_reason="tool_calls",
    )


def _registry() -> ToolRegistry:
    registry = ToolRegistry()
    registry.register(AgentTool(name="echo", description="回显",
                                parameters={"type": "object"}, func=lambda db, text="": f"echo:{text}"))
    return registry


async def test_loop_no_tool_call_single_turn(test_session):
    """模型直接回复：一轮结束"""
    provider = FakeProvider([_text_resp("直接回答")])
    loop = AgentLoop(provider, _registry(), max_iterations=5)
    result = await loop.run(test_session, [ChatMessage(role="user", content="你好")])
    assert result.reply == "直接回答"
    assert result.iterations == 1
    assert result.stop_reason == "finished"
    assert result.tool_trace == []


async def test_loop_tool_call_then_answer(test_session):
    """模型先调工具再回答：工具结果回喂，trace 有记录"""
    provider = FakeProvider([
        _tool_resp("echo", '{"text": "abc"}'),
        _text_resp("工具说是 abc"),
    ])
    loop = AgentLoop(provider, _registry(), max_iterations=5)
    result = await loop.run(test_session, [ChatMessage(role="user", content="调个工具")])
    assert result.reply == "工具说是 abc"
    assert result.iterations == 2
    assert result.tool_trace[0]["name"] == "echo"
    assert result.tool_trace[0]["result_preview"] == "echo:abc"
    # 第二轮请求的消息历史里应有 assistant(tool_calls) + tool 两条
    second_request = provider.requests[1]
    roles = [m.role for m in second_request.messages]
    assert roles == ["user", "assistant", "tool"]
    assert second_request.messages[2].tool_call_id == "call_1"
    assert second_request.messages[2].content == "echo:abc"


async def test_loop_max_iterations_stop(test_session):
    """模型一直调工具：达到上限后做无工具收尾调用"""
    provider = FakeProvider([
        _tool_resp("echo", "{}"), _tool_resp("echo", "{}"), _text_resp("收尾回答"),
    ])
    loop = AgentLoop(provider, _registry(), max_iterations=2)
    result = await loop.run(test_session, [ChatMessage(role="user", content="循环")])
    assert result.stop_reason == "max_iterations"
    assert result.reply == "收尾回答"
    # 最后一次请求不带 tools（强制模型给出文字答复）
    assert provider.requests[-1].tools is None


async def test_loop_tool_error_fed_back(test_session):
    """工具执行失败（未知工具）时错误文本回喂模型"""
    provider = FakeProvider([
        _tool_resp("not_exist", "{}"),
        _text_resp("抱歉，工具不可用"),
    ])
    loop = AgentLoop(provider, _registry(), max_iterations=5)
    result = await loop.run(test_session, [ChatMessage(role="user", content="x")])
    assert result.reply == "抱歉，工具不可用"
    tool_msg = provider.requests[1].messages[-1]
    assert "未知工具" in tool_msg.content


async def test_loop_bad_arguments_json_fed_back(test_session):
    """模型输出非法 JSON 参数时不崩溃，错误回喂"""
    provider = FakeProvider([
        _tool_resp("echo", "{不是json"),
        _text_resp("参数错了"),
    ])
    loop = AgentLoop(provider, _registry(), max_iterations=5)
    result = await loop.run(test_session, [ChatMessage(role="user", content="x")])
    tool_msg = provider.requests[1].messages[-1]
    assert "参数不是合法 JSON" in tool_msg.content
    assert result.reply == "参数错了"
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && pytest app/tests/test_agent_loop.py -v`
预期：FAIL，`ModuleNotFoundError: No module named 'app.agent.loop'`

- [ ] **步骤 3：实现 AgentLoop**

创建 `backend/app/agent/loop.py`：

```python
"""Agent 循环引擎（loop agent 核心）。

循环：LLM 响应 → 有 tool_calls 则执行工具并回喂 → 再次调用 LLM → ...
终止：模型返回纯文本（finished），或达到 max_iterations 后用一次
无工具调用强制收尾（max_iterations）。
"""

import json
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.llm.base import ChatCompletionRequest, ChatMessage, LLMProvider
from app.agent.tools.registry import ToolRegistry
from app.utils.logger import app_logger

# 默认最大循环轮数（硬上限，防成本失控）
DEFAULT_MAX_ITERATIONS = 8
# 单次工具结果回喂的最大字符数（保护上下文窗口）
MAX_TOOL_RESULT_CHARS = 4000
# trace 中保存的结果预览长度
TRACE_PREVIEW_CHARS = 500


class AgentRunResult(BaseModel):
    """一次 agent 运行的结果。"""

    reply: str
    iterations: int
    stop_reason: str  # finished | max_iterations
    tool_trace: List[Dict[str, Any]] = Field(default_factory=list)
    total_tokens: int = 0


class AgentLoop:
    """工具调用循环引擎。provider 负责模型通信，registry 负责工具执行。"""

    def __init__(self, provider: LLMProvider, registry: ToolRegistry,
                 max_iterations: int = DEFAULT_MAX_ITERATIONS) -> None:
        self.provider = provider
        self.registry = registry
        self.max_iterations = max(1, max_iterations)

    async def run(
        self,
        db: Session,
        messages: List[ChatMessage],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AgentRunResult:
        history: List[ChatMessage] = list(messages)
        tool_trace: List[Dict[str, Any]] = []
        total_tokens = 0
        tools = self.registry.definitions()

        for iteration in range(1, self.max_iterations + 1):
            app_logger.info(f"AgentLoop 第 {iteration}/{self.max_iterations} 轮")
            response = await self.provider.chat(ChatCompletionRequest(
                messages=history, model=model, temperature=temperature,
                max_tokens=max_tokens, tools=tools,
            ))
            if response.usage:
                total_tokens += response.usage.total_tokens

            msg = response.message
            if not msg.tool_calls:
                return AgentRunResult(
                    reply=msg.content, iterations=iteration,
                    stop_reason="finished", tool_trace=tool_trace, total_tokens=total_tokens,
                )

            # 记录 assistant 的工具调用消息，再逐个执行工具并回喂
            history.append(ChatMessage(role="assistant", content=msg.content or "",
                                       tool_calls=msg.tool_calls))
            for tool_call in msg.tool_calls:
                arguments = self._parse_arguments(tool_call.arguments)
                if isinstance(arguments, str):  # JSON 解析失败，错误文本直接回喂
                    result = arguments
                    args_for_trace: Any = tool_call.arguments
                else:
                    result = self.registry.execute(db, tool_call.name, arguments)
                    args_for_trace = arguments
                result = result[:MAX_TOOL_RESULT_CHARS]
                app_logger.info(f"AgentLoop 工具调用: {tool_call.name} -> {result[:100]}")
                tool_trace.append({
                    "name": tool_call.name,
                    "arguments": args_for_trace,
                    "result_preview": result[:TRACE_PREVIEW_CHARS],
                })
                history.append(ChatMessage(role="tool", content=result,
                                           tool_call_id=tool_call.id))

        # 达到迭代上限：不带 tools 再调一次，强制模型用已有信息收尾
        app_logger.warning(f"AgentLoop 达到最大迭代数 {self.max_iterations}，强制收尾")
        final = await self.provider.chat(ChatCompletionRequest(
            messages=history, model=model, temperature=temperature, max_tokens=max_tokens,
        ))
        if final.usage:
            total_tokens += final.usage.total_tokens
        return AgentRunResult(
            reply=final.message.content, iterations=self.max_iterations,
            stop_reason="max_iterations", tool_trace=tool_trace, total_tokens=total_tokens,
        )

    @staticmethod
    def _parse_arguments(raw: str):
        """解析模型的 arguments JSON 字符串；失败时返回错误文本（str）。"""
        try:
            parsed = json.loads(raw or "{}")
        except json.JSONDecodeError:
            return f"错误：工具参数不是合法 JSON：{raw[:200]}"
        if not isinstance(parsed, dict):
            return f"错误：工具参数必须是 JSON 对象：{raw[:200]}"
        return parsed
```

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && pytest app/tests/test_agent_loop.py -v`
预期：5 个测试全部 PASS

- [ ] **步骤 5：Commit**

```bash
git add backend/app/agent/loop.py backend/app/tests/test_agent_loop.py
git commit -m "feat: 新增 AgentLoop 工具调用循环引擎（迭代上限+错误回喂）"
```

---

## 任务 7：Agent schemas 与服务层

**文件：**
- 创建：`backend/app/schemas/agent.py`
- 创建：`backend/app/services/agent_service.py`
- 测试：`backend/app/tests/test_agent_service.py`

- [ ] **步骤 1：编写失败的测试**

创建 `backend/app/tests/test_agent_service.py`：

```python
"""AgentService 测试（monkeypatch provider 工厂，不发真实请求）"""
import pytest

from app.llm.base import ChatCompletionResponse, ChatMessage, Usage
from app.schemas.agent import AgentChatRequest
from app.services import agent_service as agent_service_module
from app.services.agent_service import AgentService
from app.tests.test_agent_loop import FakeProvider, _text_resp


async def test_chat_returns_reply_and_trace(test_session, monkeypatch):
    provider = FakeProvider([_text_resp("你好，我是站内助手")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    service = AgentService()
    resp = await service.chat(test_session, AgentChatRequest(message="你好"))
    assert resp.reply == "你好，我是站内助手"
    assert resp.provider == "fake"
    assert resp.model == "fake-model"
    assert resp.stop_reason == "finished"
    # system prompt 被注入
    assert provider.requests[0].messages[0].role == "system"


async def test_chat_provider_not_configured(test_session, monkeypatch):
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: None)
    service = AgentService()
    with pytest.raises(ValueError, match="不可用"):
        await service.chat(test_session, AgentChatRequest(message="你好"))


async def test_chat_max_iterations_passthrough(test_session, monkeypatch):
    provider = FakeProvider([_text_resp("ok")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)
    service = AgentService()
    resp = await service.chat(test_session, AgentChatRequest(message="hi", max_iterations=3))
    assert resp.reply == "ok"
```

说明：复用任务 6 测试文件中的 `FakeProvider` / `_text_resp`（`from app.tests.test_agent_loop import ...`），避免重复定义。若 pytest 导入测试模块有歧义，也可把 `FakeProvider` 移到 `app/tests/conftest.py` 作为公共工具。

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && pytest app/tests/test_agent_service.py -v`
预期：FAIL，`ModuleNotFoundError: No module named 'app.schemas.agent'`

- [ ] **步骤 3：实现 schemas**

创建 `backend/app/schemas/agent.py`：

```python
"""Agent 相关 schema"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AgentChatRequest(BaseModel):
    """Agent 对话请求"""
    message: str = Field(..., min_length=1, description="用户消息")
    provider: Optional[str] = Field(None, description="LLM provider，默认读配置")
    model: Optional[str] = Field(None, description="模型名，默认 provider 配置")
    max_iterations: int = Field(8, ge=1, le=20, description="最大工具调用循环轮数（硬上限）")


class AgentToolCallInfo(BaseModel):
    """一次工具调用的审计信息"""
    name: str
    arguments: Any = None
    result_preview: str = ""


class AgentChatResponse(BaseModel):
    """Agent 对话响应"""
    reply: str
    provider: str
    model: str
    iterations: int
    stop_reason: str  # finished | max_iterations
    tool_calls: List[AgentToolCallInfo] = Field(default_factory=list)
    total_tokens: int = 0


class AgentPolishRequest(BaseModel):
    """文章润色请求（Writer-Critic 循环）"""
    content: str = Field(..., min_length=1, description="待润色的文章草稿（Markdown）")
    requirements: Optional[str] = Field(None, description="附加润色要求，如 SEO 关键词、风格")
    max_rounds: int = Field(3, ge=1, le=5, description="最大评审-修改轮数（硬上限）")


class AgentPolishResponse(BaseModel):
    """文章润色响应"""
    polished: str
    rounds: int  # 实际执行的修改轮数
    critiques: List[str] = Field(default_factory=list)  # 各轮评审意见
```

- [ ] **步骤 4：实现服务层**

创建 `backend/app/services/agent_service.py`：

```python
"""Agent 服务层：组装 provider + 工具 + 循环引擎，对外提供 chat / polish。"""

from typing import Optional

from sqlalchemy.orm import Session

from app.agent.loop import AgentLoop
from app.agent.tools.builtin import register_builtin_tools
from app.agent.tools.registry import ToolRegistry
from app.llm.base import ChatCompletionRequest, ChatMessage, LLMProvider
from app.llm.provider_factory import get_llm_provider
from app.schemas.agent import (
    AgentChatRequest,
    AgentChatResponse,
    AgentPolishRequest,
    AgentPolishResponse,
    AgentToolCallInfo,
)

AGENT_SYSTEM_PROMPT = """你是这个个人博客站点的 AI 助手，熟悉站内内容。
你可以使用提供的工具查询站内已发布文章、文章详情和站点统计信息。
规则：
1. 涉及站内内容的问题，先调用工具查询，再基于工具返回的事实回答，不要编造文章标题或链接。
2. 文章链接格式为 /articles/{slug}。
3. 用简洁的中文回答。"""

CRITIC_PROMPT = """你是一名严格的中文博客文章评审。审阅下面的草稿，从结构、可读性、事实准确性、SEO 角度提出最多 3 条具体修改建议（每条一行）。
如果草稿质量已经足够好、无需修改，只回复：PASS
{requirements_block}
【草稿】
{draft}"""

WRITER_PROMPT = """你是一名专业的中文博客作者。根据评审意见修改下面的草稿，直接输出修改后的完整文章（Markdown），不要输出任何解释。

【评审意见】
{critique}

【草稿】
{draft}"""


class AgentService:
    """Agent 服务：chat 走工具循环，polish 走 Writer-Critic 循环。"""

    def _get_provider_or_raise(self, provider_name: Optional[str]) -> LLMProvider:
        provider = get_llm_provider(provider_name)
        if provider is None:
            raise ValueError(f"LLM provider「{provider_name or '默认'}」不可用，请检查 API key 配置")
        return provider

    async def chat(self, db: Session, request: AgentChatRequest) -> AgentChatResponse:
        """工具循环对话：模型可自主调用站内工具后作答。"""
        provider = self._get_provider_or_raise(request.provider)
        registry = register_builtin_tools(ToolRegistry())
        loop = AgentLoop(provider, registry, max_iterations=request.max_iterations)
        result = await loop.run(db, [
            ChatMessage(role="system", content=AGENT_SYSTEM_PROMPT),
            ChatMessage(role="user", content=request.message),
        ], model=request.model)
        return AgentChatResponse(
            reply=result.reply,
            provider=provider.get_provider_name(),
            model=provider.get_model_name(),
            iterations=result.iterations,
            stop_reason=result.stop_reason,
            tool_calls=[AgentToolCallInfo(**t) for t in result.tool_trace],
            total_tokens=result.total_tokens,
        )

    async def polish(self, request: AgentPolishRequest) -> AgentPolishResponse:
        """Writer-Critic 循环润色：评审 → 修改 → 再评审，直到 PASS 或达到轮数上限。"""
        provider = self._get_provider_or_raise(None)
        draft = request.content
        critiques: list[str] = []
        requirements_block = f"\n【附加要求】{request.requirements}\n" if request.requirements else ""

        for _ in range(request.max_rounds):
            critique = await self._ask(
                provider, CRITIC_PROMPT.format(draft=draft, requirements_block=requirements_block),
            )
            if "PASS" in critique:
                break
            critiques.append(critique)
            draft = await self._ask(provider, WRITER_PROMPT.format(draft=draft, critique=critique))

        return AgentPolishResponse(polished=draft, rounds=len(critiques), critiques=critiques)

    @staticmethod
    async def _ask(provider: LLMProvider, prompt: str) -> str:
        """单次无工具调用，返回文本。"""
        response = await provider.chat(ChatCompletionRequest(
            messages=[ChatMessage(role="user", content=prompt)],
        ))
        return response.message.content


agent_service = AgentService()
```

- [ ] **步骤 5：运行测试验证通过**

运行：`cd backend && pytest app/tests/test_agent_service.py -v`
预期：3 个测试全部 PASS

- [ ] **步骤 6：Commit**

```bash
git add backend/app/schemas/agent.py backend/app/services/agent_service.py backend/app/tests/test_agent_service.py
git commit -m "feat: 新增 agent schemas 与服务层（chat/polish）"
```

---

## 任务 8：API 端点与路由注册

**文件：**
- 创建：`backend/app/api/v1/endpoints/agent.py`
- 修改：`backend/app/api/v1/router.py`
- 修改：`README.md`（Core API map 表）
- 测试：`backend/app/tests/test_agent_api.py`

- [ ] **步骤 1：编写失败的测试**

创建 `backend/app/tests/test_agent_api.py`：

```python
"""Agent API 端点测试（认证/限流已由 conftest mock）"""
from app.services import agent_service as agent_service_module
from app.tests.test_agent_loop import FakeProvider, _text_resp


def test_agent_chat_endpoint(client, test_session, monkeypatch):
    provider = FakeProvider([_text_resp("站内共 5 篇文章")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post("/api/v1/agent/chat", json={"message": "站里有几篇文章？"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["reply"] == "站内共 5 篇文章"
    assert data["stop_reason"] == "finished"
    assert data["tool_calls"] == []


def test_agent_chat_empty_message_422(client):
    resp = client.post("/api/v1/agent/chat", json={"message": ""})
    assert resp.status_code == 422


def test_agent_chat_provider_unavailable_400(client, monkeypatch):
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: None)
    resp = client.post("/api/v1/agent/chat", json={"message": "hi"})
    assert resp.status_code == 400
    assert "不可用" in resp.json()["detail"]


def test_agent_polish_endpoint(client, monkeypatch):
    provider = FakeProvider([_text_resp("PASS")])
    monkeypatch.setattr(agent_service_module, "get_llm_provider", lambda name=None: provider)

    resp = client.post("/api/v1/agent/polish", json={"content": "# 草稿\n内容"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["polished"] == "# 草稿\n内容"  # 第一轮就 PASS，原样返回
    assert data["rounds"] == 0
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && pytest app/tests/test_agent_api.py -v`
预期：FAIL，404（路由未注册）

- [ ] **步骤 3：实现端点**

创建 `backend/app/api/v1/endpoints/agent.py`（模式对齐 `endpoints/llm.py`，先打开它确认 import 路径）：

```python
"""Agent 相关 API：工具循环对话 + 文章润色"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app.models.user import User
from app.schemas.agent import (
    AgentChatRequest,
    AgentChatResponse,
    AgentPolishRequest,
    AgentPolishResponse,
)
from app.services.agent_service import agent_service
from app.utils.rate_limit import llm_chat_rate_limit

router = APIRouter()


@router.post("/chat", response_model=AgentChatResponse)
@llm_chat_rate_limit
async def agent_chat(
    request: Request,
    chat_request: AgentChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Agent 对话：模型可在循环中自主调用站内工具后作答。"""
    try:
        return await agent_service.chat(db, chat_request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/polish", response_model=AgentPolishResponse)
@llm_chat_rate_limit
async def agent_polish(
    request: Request,
    polish_request: AgentPolishRequest,
    current_user: User = Depends(get_current_superuser),
):
    """文章润色（Writer-Critic 循环），仅管理员。"""
    try:
        return await agent_service.polish(polish_request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

- [ ] **步骤 4：注册路由**

修改 `backend/app/api/v1/router.py`：在顶部 endpoints import 中加入 `agent`，在 `llm` 注册行（第 31 行）之后加一行：

```python
api_router.include_router(agent.router, prefix="/agent", tags=["agent"])
```

- [ ] **步骤 5：运行测试验证通过 + 全量回归**

运行：`cd backend && pytest app/tests -v`
预期：全部 PASS（含既有用例）

- [ ] **步骤 6：更新 README API map**

修改 `README.md` 的 Core API map 表，在 AI 行追加 `/agent`：

```markdown
| AI | `/llm`, `/conversations`, `/memories`, `/prompts`, `/agent` |
```

- [ ] **步骤 7：Commit**

```bash
git add backend/app/api/v1/endpoints/agent.py backend/app/api/v1/router.py backend/app/tests/test_agent_api.py README.md
git commit -m "feat: 新增 /agent/chat 与 /agent/polish 接口并注册路由"
```

---

## 任务 9：真实 provider 冒烟验证（手动）

**文件：** 无代码改动，手动验证。

- [ ] **步骤 1：配置真实 API key**

确认 `backend/.env` 中 `DEEPSEEK_API_KEY`（或 GLM/Qwen）已配置。

- [ ] **步骤 2：启动后端并验证工具循环**

运行：`cd backend && uvicorn app.main:app --reload --port 8989`

用管理员 JWT 调：

```bash
curl -X POST http://localhost:8989/api/v1/agent/chat \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"message": "帮我查一下站里有几篇已发布文章，再告诉我最新的一篇讲了什么"}'
```

预期：响应 `tool_calls` 中出现 `get_site_stats` / `search_articles`，`reply` 基于真实库数据回答；`stop_reason` 为 `finished`；backend 日志可见 `AgentLoop 第 N 轮` 与工具调用记录。

- [ ] **步骤 3：验证润色接口**

```bash
curl -X POST http://localhost:8989/api/v1/agent/polish \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"content": "# 测试草稿\n这是一段写的很粗糙的内容，有很多语病...", "max_rounds": 2}'
```

预期：`polished` 为修改后文本，`critiques` 记录各轮意见。

- [ ] **步骤 4：验证 GLM/Qwen 兼容性**

分别用 `{"message": "...", "provider": "glm"}` 和 `"provider": "qwen"` 重跑步骤 2。若某家模型 function calling 行为异常（如不返回 tool_calls、arguments 非 JSON 字符串），在该 provider 的 `_parse_response` 前加适配，并记录到 `docs/changelog-agents.md`。

---

## 自检结论（计划编写者已完成）

- **规格覆盖**：tool calling 基础设施（任务 1-3）、工具生态（任务 4-5）、循环引擎含护栏（任务 6）、对话接口（任务 7-8）、Writer-Critic 润色（任务 7/8/9）、真实冒烟（任务 9）——调研报告中的场景 1、2 全覆盖。
- **类型一致性**：`ToolCall`/`ToolDefinition`/`AgentTool`/`ToolRegistry`/`AgentLoop`/`AgentRunResult`/`AgentService`/`AgentChatRequest`/`AgentPolishRequest` 等命名在任务间一致；`FakeProvider`/`_text_resp` 在任务 6 定义、任务 7/8 复用并已注明出处。
- **护栏**：`max_iterations`（1-20）、`max_rounds`（1-5）、工具结果 4000 字符截断、错误回喂、收尾强制无工具调用，均已在引擎中实现并有测试覆盖。

## 后续阶段（不在本计划内）

1. **定时自治巡检**：仿 `weather_update_service` 模式，apscheduler 定时跑 AgentLoop（友链可达性、死链检查），结果写 audit_logs / 通知 admin。
2. **接入现有对话引擎**：`app/conversation/engine.py` 加 `enable_agent` 开关，让 `/conversations/chat` 可选走 AgentLoop，复用记忆/上下文。
3. **前端集成**：`/ai/chat` 页或 admin 文章编辑器接 `/agent/chat`、`/agent/polish`。
4. **流式 tool calling**：provider 的 `_parse_stream_chunk` 支持 `delta.tool_calls`，`/agent/chat/stream`。
