# backend/app/utils/json_utils.py
"""JSON 解析工具：从可能夹带叙述的文本里提取首个平衡的 JSON 对象。"""


def extract_first_json_object(raw: str) -> str:
    """从可能夹带叙述/围栏的文本里提取首个**平衡**的 {...} JSON 对象。

    比 find/rfind 更稳：正确处理字符串内的花括号（如代码示例）和
    模型输出多个 JSON 对象的情况（只取第一个完整对象）。
    """
    depth = 0
    start = -1
    in_str = False
    escaped = False
    for i, ch in enumerate(raw):
        if escaped:
            escaped = False
            continue
        if ch == "\\":
            escaped = True
            continue
        if ch == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start != -1:
                return raw[start:i + 1]
    raise ValueError("未找到平衡的 JSON 对象")
