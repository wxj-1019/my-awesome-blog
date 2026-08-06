"""批量生成 78 张华丽塔罗牌面图（RunningHub 低价渠道）。

用法（Windows）：
    set RUNNINGHUB_API_KEY=xxx
    .venv\\Scripts\\python.exe scripts\\generate_tarot_deck.py

说明：
- 读取 frontend/tarot-deck-export.json（78 张牌最小数据）
- 用 rhart-image/z-image/turbo（约 0.04 元/张）生成，aspectRatio=2:3 竖版
- 并发 3、单张失败重试 2 次、断点续跑（public/tarot/{id}.png 已存在且非空则跳过）
- 下载 results[].url 到 frontend/public/tarot/{id}.png
"""

import asyncio
import json
import os
import sys
from pathlib import Path

import httpx

# 项目根目录
ROOT = Path(__file__).resolve().parents[2]
DECK_JSON = ROOT / "frontend" / "tarot-deck-export.json"
OUT_DIR = ROOT / "frontend" / "public" / "tarot"

BASE_URL = "https://www.runninghub.cn/openapi/v2"
IMAGE_ENDPOINT = "rhart-image/z-image/turbo"
HTTP_TIMEOUT = 30.0
CONCURRENCY = 3
MAX_RETRIES = 2
MAX_POLL = 60  # 每张最多轮询次数（约 5 分钟）

# 统一风格后缀（华丽塔罗牌插画）
STYLE_SUFFIX = (
    "华丽塔罗牌插画，神秘占星背景，金色装饰边框，复古奢华质感，"
    "戏剧性光影，精美细节，高清艺术绘画，竖版牌面构图"
)


def build_prompt(card: dict) -> str:
    """按牌名 + 关键词 + 正位牌义 + 风格后缀构造提示词"""
    name = f"{card['name']}（{card['nameEn']}）"
    keywords = "、".join(card["keywords"])
    meaning = card["upright"]
    if card["element"]:
        element = f"，{card['element']}元素意象"
    else:
        element = f"，占星对应{card['astrology']}" if card["astrology"] else ""
    return f"塔罗牌「{name}」，关键词：{keywords}。牌义：{meaning}{element}。{STYLE_SUFFIX}"


def endpoint() -> str:
    return f"{BASE_URL}/{IMAGE_ENDPOINT}"


async def submit(client: httpx.AsyncClient, api_key: str, prompt: str) -> str:
    """提交任务返回 task_id"""
    resp = await client.post(
        endpoint(),
        json={"prompt": prompt, "aspectRatio": "2:3", "outputFormat": "png"},
        headers={"Authorization": f"Bearer {api_key}"},
    )
    body = resp.json()
    if resp.status_code != 200 or body.get("errorCode"):
        raise RuntimeError(f"提交失败: {body.get('errorMessage') or body.get('errorCode')}")
    task_id = body.get("taskId")
    if not task_id:
        raise RuntimeError("提交响应缺 taskId")
    return str(task_id)


async def query(client: httpx.AsyncClient, api_key: str, task_id: str) -> dict:
    """查询任务状态返回完整 data"""
    resp = await client.post(
        f"{BASE_URL}/query",
        json={"taskId": task_id},
        headers={"Authorization": f"Bearer {api_key}"},
    )
    body = resp.json()
    if resp.status_code != 200 or body.get("errorCode"):
        raise RuntimeError(f"查询失败: {body.get('errorMessage') or body.get('errorCode')}")
    return body


async def generate_one(client: httpx.AsyncClient, api_key: str, card: dict) -> str | None:
    """生成一张牌并下载，成功返回 url，失败返回 None（内部已重试）"""
    card_id = card["id"]
    prompt = build_prompt(card)
    for attempt in range(1, MAX_RETRIES + 2):
        try:
            task_id = await submit(client, api_key, prompt)
            # 轮询到终态
            for _ in range(MAX_POLL):
                await asyncio.sleep(5)
                data = await query(client, api_key, task_id)
                status = str(data.get("status") or "").upper()
                if status == "SUCCESS":
                    results = data.get("results") or []
                    url = None
                    for item in results:
                        if isinstance(item, dict) and item.get("url"):
                            url = item["url"]
                            break
                    if not url:
                        raise RuntimeError("成功但无图片 URL")
                    await download(client, url, OUT_DIR / f"{card_id}.png")
                    return url
                if status in ("FAILED", "CANCEL", "CANCELLED", "ERROR"):
                    reason = data.get("failedReason") or data.get("errorMessage") or status
                    raise RuntimeError(f"任务失败: {reason}")
            raise RuntimeError("轮询超时")
        except Exception as e:  # noqa: BLE001 - 批量任务单张失败继续
            print(f"    [{card_id}] 第 {attempt} 次尝试失败: {e}", flush=True)
            await asyncio.sleep(2 * attempt)
    return None


async def download(client: httpx.AsyncClient, url: str, dest: Path) -> None:
    """下载图片到目标路径"""
    resp = await client.get(url)
    resp.raise_for_status()
    dest.write_bytes(resp.content)


async def main() -> None:
    api_key = os.environ.get("RUNNINGHUB_API_KEY", "").strip()
    if not api_key:
        sys.exit("错误：请设置环境变量 RUNNINGHUB_API_KEY")
    if not DECK_JSON.exists():
        sys.exit(f"错误：找不到 {DECK_JSON}（先运行 node --experimental-strip-types frontend/extract-tarot.mjs）")

    deck = json.loads(DECK_JSON.read_text(encoding="utf-8"))
    if len(deck) != 78:
        print(f"警告：牌数 {len(deck)}，预期 78")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # 断点续跑：已存在且非空则跳过
    todo = []
    for card in deck:
        dest = OUT_DIR / f"{card['id']}.png"
        if dest.exists() and dest.stat().st_size > 0:
            continue
        todo.append(card)
    print(f"待生成 {len(todo)} 张（共 {len(deck)}，已跳过 {len(deck) - len(todo)}）", flush=True)

    sem = asyncio.Semaphore(CONCURRENCY)
    ok = 0
    failed = []

    async def worker(card: dict) -> None:
        nonlocal ok
        card_id = card["id"]
        async with sem:
            print(f"  → {card_id} {card['name']} 生成中…", flush=True)
            url = await generate_one(client, api_key, card)
        if url:
            ok += 1
            print(f"  ✓ {card_id} 完成（{ok}/78）", flush=True)
        else:
            failed.append(card_id)
            print(f"  ✗ {card_id} 失败", flush=True)

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        await asyncio.gather(*[worker(c) for c in todo])

    print(f"\n完成：成功 {ok}，失败 {len(failed)}")
    if failed:
        print("失败清单:", ", ".join(failed))
    else:
        print("全部成功 🎉")


if __name__ == "__main__":
    asyncio.run(main())
