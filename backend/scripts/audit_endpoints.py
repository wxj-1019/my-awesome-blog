#!/usr/bin/env python3
"""扫描 endpoints：async/sync、to_thread、鉴权依赖。输出 Markdown 表到 stdout。"""
from __future__ import annotations

import ast
import sys
from pathlib import Path

ENDPOINTS_DIR = Path(__file__).resolve().parents[1] / "app" / "api" / "v1" / "endpoints"

AUTH_NAMES = {
    "get_current_user",
    "get_current_active_user",
    "get_current_superuser",
    "get_current_user_optional",
}

HTTP_DECOS = {
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "head",
    "options",
    "api_route",
}


def _call_name(node: ast.AST) -> str | None:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _decorator_http(dec: ast.AST) -> tuple[str, str] | None:
    """Return (method, path) if this is a FastAPI route decorator."""
    # @router.get("/")
    if isinstance(dec, ast.Call):
        name = _call_name(dec.func)
        if name in HTTP_DECOS:
            path = "/"
            if dec.args and isinstance(dec.args[0], ast.Constant) and isinstance(dec.args[0].value, str):
                path = dec.args[0].value
            return name.upper() if name != "api_route" else "ROUTE", path
    # bare unlikely
    return None


def _depends_auth(default: ast.AST) -> str | None:
    # Depends(get_current_active_user) or Depends(dependency=...)
    if not isinstance(default, ast.Call):
        return None
    if _call_name(default.func) != "Depends":
        return None
    if default.args:
        n = _call_name(default.args[0])
        if n in AUTH_NAMES:
            return n
    for kw in default.keywords:
        if kw.arg in (None, "dependency"):
            n = _call_name(kw.value)
            if n in AUTH_NAMES:
                return n
    return None


def _uses_to_thread(fn: ast.AsyncFunctionDef | ast.FunctionDef) -> bool:
    for node in ast.walk(fn):
        if isinstance(node, ast.Call):
            name = _call_name(node.func)
            if name in ("to_thread", "run_in_executor"):
                return True
            # asyncio.to_thread / loop.run_in_executor
            if isinstance(node.func, ast.Attribute) and node.func.attr in (
                "to_thread",
                "run_in_executor",
            ):
                return True
    return False


def _uses_db(fn: ast.AsyncFunctionDef | ast.FunctionDef) -> bool:
    for arg in fn.args.args + fn.args.kwonlyargs:
        if arg.arg == "db":
            return True
        # Annotated patterns rare; also check defaults Depends(get_db)
    for default in list(fn.args.defaults) + list(fn.args.kw_defaults):
        if default is None:
            continue
        if isinstance(default, ast.Call) and _call_name(default.func) == "Depends":
            if default.args and _call_name(default.args[0]) == "get_db":
                return True
    # body reference crud / Session
    src_like = ast.dump(fn)
    return "get_db" in src_like or "Session" in src_like and "db" in src_like


def analyze_file(path: Path) -> list[dict]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    rows: list[dict] = []
    for node in tree.body:
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        http = None
        for dec in node.decorator_list:
            http = _decorator_http(dec)
            if http:
                break
        if not http:
            continue
        method, route_path = http
        auths: list[str] = []
        # defaults align from the end
        args = node.args
        positional = args.args
        defaults = list(args.defaults)
        # pad
        non_default = len(positional) - len(defaults)
        for i, arg in enumerate(positional):
            if i < non_default:
                continue
            default = defaults[i - non_default]
            a = _depends_auth(default)
            if a:
                auths.append(a)
        for arg, default in zip(args.kwonlyargs, args.kw_defaults):
            if default is None:
                continue
            a = _depends_auth(default)
            if a:
                auths.append(a)

        is_async = isinstance(node, ast.AsyncFunctionDef)
        uses_db = any(a.arg == "db" for a in positional + args.kwonlyargs)
        # also detect Depends(get_db) without name db
        if not uses_db:
            for d in list(defaults) + [d for d in args.kw_defaults if d]:
                if isinstance(d, ast.Call) and _call_name(d.func) == "Depends":
                    if d.args and _call_name(d.args[0]) == "get_db":
                        uses_db = True
        to_thread = _uses_to_thread(node)

        risk = ""
        if is_async and uses_db and not to_thread:
            risk = "⚠️ async+DB 无 to_thread"
        elif not is_async and uses_db:
            risk = "sync 路由（自占 worker）"
        elif is_async and uses_db and to_thread:
            risk = "OK"
        else:
            risk = "OK/无DB"

        auth_label = ", ".join(auths) if auths else "公开"
        if "get_current_superuser" in auths:
            auth_level = "superuser"
        elif "get_current_active_user" in auths or "get_current_user" in auths:
            auth_level = "login"
        elif "get_current_user_optional" in auths:
            auth_level = "optional"
        else:
            auth_level = "public"

        rows.append(
            {
                "file": path.stem,
                "func": node.name,
                "method": method,
                "path": route_path,
                "async": is_async,
                "db": uses_db,
                "to_thread": to_thread,
                "auth": auth_label,
                "auth_level": auth_level,
                "risk": risk,
            }
        )
    return rows


def main() -> int:
    files = sorted(ENDPOINTS_DIR.glob("*.py"))
    files = [f for f in files if f.name != "__init__.py"]
    all_rows: list[dict] = []
    for f in files:
        all_rows.extend(analyze_file(f))

    # sort
    all_rows.sort(key=lambda r: (r["file"], r["path"], r["method"], r["func"]))

    warn = [r for r in all_rows if r["risk"].startswith("⚠️")]
    print("# Endpoint 审计：async / to_thread / 鉴权\n")
    print(f"- 扫描目录：`backend/app/api/v1/endpoints/`")
    print(f"- 路由函数总数：**{len(all_rows)}**")
    print(f"- ⚠️ async+DB 且未见 to_thread/run_in_executor：**{len(warn)}**\n")

    print("## 汇总（按模块风险）\n")
    by_file: dict[str, list[dict]] = {}
    for r in all_rows:
        by_file.setdefault(r["file"], []).append(r)
    print("| 模块 | 路由数 | 公开 | 登录 | 超管 | optional | ⚠️ async+DB 无 offload |")
    print("|------|--------|------|------|------|----------|------------------------|")
    for file, rows in sorted(by_file.items()):
        pub = sum(1 for r in rows if r["auth_level"] == "public")
        login = sum(1 for r in rows if r["auth_level"] == "login")
        su = sum(1 for r in rows if r["auth_level"] == "superuser")
        opt = sum(1 for r in rows if r["auth_level"] == "optional")
        w = sum(1 for r in rows if r["risk"].startswith("⚠️"))
        print(f"| {file} | {len(rows)} | {pub} | {login} | {su} | {opt} | {w} |")

    print("\n## 明细表\n")
    print("| 模块 | 方法 | 路径 | 函数 | async | DB | to_thread | 鉴权 | 风险 |")
    print("|------|------|------|------|-------|----|-----------|------|------|")
    for r in all_rows:
        print(
            f"| {r['file']} | {r['method']} | `{r['path']}` | `{r['func']}` | "
            f"{'Y' if r['async'] else 'N'} | {'Y' if r['db'] else 'N'} | "
            f"{'Y' if r['to_thread'] else 'N'} | {r['auth']} | {r['risk']} |"
        )

    if warn:
        print("\n## 优先处理：async + DB 且无 to_thread\n")
        for r in warn:
            print(f"- `{r['file']}.{r['func']}` {r['method']} `{r['path']}`")

    out = Path(__file__).resolve().parents[1] / "docs" / "endpoint-async-auth-audit.md"
    # also write under backend/docs or repo docs
    repo_docs = Path(__file__).resolve().parents[2] / "docs" / "endpoint-async-auth-audit.md"
    # re-generate full content
    lines = []
    # capture by re-running print logic into list
    # simpler: write from reconstructed
    buf: list[str] = []
    def w(s: str = "") -> None:
        buf.append(s)

    w("# Endpoint 审计：async / to_thread / 鉴权")
    w()
    w(f"- 扫描目录：`backend/app/api/v1/endpoints/`")
    w(f"- 路由函数总数：**{len(all_rows)}**")
    w(f"- ⚠️ async+DB 且未见 to_thread/run_in_executor：**{len(warn)}**")
    w()
    w("> 生成方式：`python backend/scripts/audit_endpoints.py`（AST 静态扫描，非运行时）。")
    w("> `to_thread=Y` 表示函数体内出现 `asyncio.to_thread` 或 `run_in_executor`。")
    w("> 鉴权仅识别 Depends(get_current_*) 常见依赖。")
    w()
    w("## 汇总（按模块）")
    w()
    w("| 模块 | 路由数 | 公开 | 登录 | 超管 | optional | ⚠️ async+DB 无 offload |")
    w("|------|--------|------|------|------|----------|------------------------|")
    for file, rows in sorted(by_file.items()):
        pub = sum(1 for r in rows if r["auth_level"] == "public")
        login = sum(1 for r in rows if r["auth_level"] == "login")
        su = sum(1 for r in rows if r["auth_level"] == "superuser")
        opt = sum(1 for r in rows if r["auth_level"] == "optional")
        ww = sum(1 for r in rows if r["risk"].startswith("⚠️"))
        w(f"| {file} | {len(rows)} | {pub} | {login} | {su} | {opt} | {ww} |")
    w()
    w("## 明细表")
    w()
    w("| 模块 | 方法 | 路径 | 函数 | async | DB | to_thread | 鉴权 | 风险 |")
    w("|------|------|------|------|-------|----|-----------|------|------|")
    for r in all_rows:
        w(
            f"| {r['file']} | {r['method']} | `{r['path']}` | `{r['func']}` | "
            f"{'Y' if r['async'] else 'N'} | {'Y' if r['db'] else 'N'} | "
            f"{'Y' if r['to_thread'] else 'N'} | {r['auth']} | {r['risk']} |"
        )
    if warn:
        w()
        w("## 优先处理清单")
        w()
        for r in warn:
            w(f"- `{r['file']}.{r['func']}` — {r['method']} `{r['path']}`")

    repo_docs.parent.mkdir(parents=True, exist_ok=True)
    repo_docs.write_text("\n".join(buf) + "\n", encoding="utf-8")
    print(f"\n已写入: {repo_docs}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
