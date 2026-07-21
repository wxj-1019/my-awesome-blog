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


def test_execute_invalid_arguments(test_session):
    """缺必填参数时返回「参数不合法」（绑定校验在调用前拦截）"""
    registry = _make_registry()
    result = registry.execute(test_session, "echo", {})
    assert "参数不合法" in result


def test_execute_internal_type_error_is_execution_failure(test_session):
    """工具内部 bug 抛出的 TypeError 归类为「执行失败」而非「参数不合法」"""
    def _bad_tool(db) -> str:
        return len(None)  # 内部 bug：TypeError

    registry = ToolRegistry()
    registry.register(AgentTool(name="bad", description="内部炸", parameters={"type": "object"}, func=_bad_tool))
    result = registry.execute(test_session, "bad", {})
    assert "执行失败" in result
    assert "参数不合法" not in result
