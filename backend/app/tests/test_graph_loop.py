"""GraphLoop 图循环基元单元测试。"""
import asyncio

import pytest

from app.agent.graph import GraphLoop


def test_linear_chain():
    """线性链：a → b → 结束，状态沿链传递。"""
    calls = []

    async def node_a(state):
        calls.append("a")
        return "b", {"value": state["value"] + 1}

    async def node_b(state):
        calls.append("b")
        return None, {"value": state["value"] * 2}

    loop = GraphLoop("linear")
    loop.add_node("a", node_a)
    loop.add_node("b", node_b)
    state = asyncio.run(loop.run({"value": 1}, entry="a"))
    assert state["value"] == 4
    assert calls == ["a", "b"]


def test_conditional_edge():
    """条件边：节点根据状态路由到不同分支。"""
    async def decider(state):
        nxt = "even" if state["value"] % 2 == 0 else "odd"
        return nxt, {}

    async def even(state):
        return None, {"label": "even"}

    async def odd(state):
        return None, {"label": "odd"}

    loop = GraphLoop("conditional")
    loop.add_node("decider", decider)
    loop.add_node("even", even)
    loop.add_node("odd", odd)

    import asyncio
    assert asyncio.run(loop.run({"value": 4}, entry="decider"))["label"] == "even"
    assert asyncio.run(loop.run({"value": 3}, entry="decider"))["label"] == "odd"


def test_cycle_until_condition():
    """循环边：generator → judge，judge 不满意时回 generator，直到通过。"""
    async def generator(state):
        return "judge", {"round": state["round"] + 1}

    async def judge(state):
        if state["round"] >= 3:
            return None, {"passed": True}
        return "generator", {}

    loop = GraphLoop("cycle")
    loop.add_node("generator", generator)
    loop.add_node("judge", judge)

    import asyncio
    state = asyncio.run(loop.run({"round": 0}, entry="generator"))
    assert state["round"] == 3
    assert state["passed"] is True


def test_max_steps_hard_limit():
    """自环图达到 max_steps 后强制终止。"""
    async def spin(state):
        return "spin", {"count": state.get("count", 0) + 1}

    loop = GraphLoop("limit", max_steps=5)
    loop.add_node("spin", spin)

    import asyncio
    state = asyncio.run(loop.run({"count": 0}, entry="spin"))
    assert state["count"] == 5


def test_append_reducer():
    """append_keys 声明的键按追加语义合并，其余键替换。"""
    async def producer(state):
        return None, {"trace": ["x"], "value": 99}

    loop = GraphLoop("append", append_keys={"trace"})
    loop.add_node("producer", producer)

    import asyncio
    state = asyncio.run(loop.run({"trace": ["seed"], "value": 1}, entry="producer"))
    assert state["trace"] == ["seed", "x"]  # 追加
    assert state["value"] == 99  # 替换


def test_checkpoint_and_step_callbacks():
    """checkpoint_cb 与 step_cb 每步触发。"""
    checkpoints = []
    steps = []

    async def checkpoint(state, node):
        checkpoints.append((node, dict(state)))

    async def step(state, node, nxt):
        steps.append((node, nxt))

    async def a(state):
        return "b", {"v": 1}

    async def b(state):
        return None, {"v": 2}

    loop = GraphLoop("cbs", checkpoint_cb=checkpoint, step_cb=step)
    loop.add_node("a", a)
    loop.add_node("b", b)

    import asyncio
    asyncio.run(loop.run({}, entry="a"))
    assert [c[0] for c in checkpoints] == ["a", "b"]
    assert checkpoints[1][1]["v"] == 2
    assert steps == [("a", "b"), ("b", None)]


def test_end_constant_and_unknown_node():
    """END 常量等价 None；返回未注册节点抛 ValueError。"""
    async def good(state):
        return GraphLoop.END, {}

    async def bad(state):
        return "missing", {}

    import asyncio
    loop = GraphLoop("end")
    loop.add_node("good", good)
    loop.add_node("bad", bad)
    asyncio.run(loop.run({}, entry="good"))  # 不抛
    with pytest.raises(ValueError):
        asyncio.run(loop.run({}, entry="bad"))


def test_entry_validation():
    """入口节点不存在抛 ValueError。"""
    loop = GraphLoop("entry")
    with pytest.raises(ValueError):
        import asyncio
        asyncio.run(loop.run({}, entry="nope"))
