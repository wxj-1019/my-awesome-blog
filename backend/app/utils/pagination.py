from typing import TypeVar, Generic, List, Optional
from dataclasses import dataclass
from pydantic import BaseModel
from datetime import datetime
import base64
import json


T = TypeVar('T')


class CursorPaginationParams(BaseModel):
    """游标分页参数"""
    cursor: Optional[str] = None  # Base64编码的游标
    limit: int = 20  # 每页数量，默认20


@dataclass
class CursorPaginationResult(Generic[T]):
    """游标分页结果"""
    items: List[T]
    next_cursor: Optional[str]
    has_more: bool


def _cursor_json_default(obj):
    """游标编码时的时间序列化"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)


def encode_cursor(data: dict) -> str:
    """将游标数据编码为字符串"""
    json_str = json.dumps(data, default=_cursor_json_default)
    return base64.b64encode(json_str.encode()).decode()


def decode_cursor(cursor_str: str) -> dict:
    """解码游标字符串为数据"""
    try:
        decoded_bytes = base64.b64decode(cursor_str.encode())
        data = json.loads(decoded_bytes.decode())
        # 对时间值统一还原为 datetime，保证 SQL 比较正确
        value = data.get('value')
        if isinstance(value, str):
            try:
                data['value'] = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                pass
        return data
    except Exception:
        return {}
