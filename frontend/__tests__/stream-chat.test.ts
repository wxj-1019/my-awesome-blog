import { streamChat } from '@/lib/api/llm';

// mock apiFetch：返回可控的 SSE 响应流
jest.mock('@/lib/api-client', () => ({
  apiFetch: jest.fn(),
}));

import { apiFetch } from '@/lib/api-client';
const mockApiFetch = apiFetch as jest.Mock;

/** jsdom 无 ReadableStream/TextEncoder/TextDecoder，提供最小 polyfill 供测试构造流 */
if (typeof (globalThis as { ReadableStream?: unknown }).ReadableStream === 'undefined') {
  (globalThis as Record<string, unknown>).ReadableStream = class ReadableStream<T> {
    private controller: ReadableStreamDefaultController<T>;
    constructor(underlying: { start?: (c: ReadableStreamDefaultController<T>) => void }) {
      this.controller = {
        enqueue: () => {},
        close: () => {},
      } as unknown as ReadableStreamDefaultController<T>;
      underlying.start?.(this.controller);
    }
    getReader() {
      return {
        read: async () => ({ done: true, value: undefined }),
      } as unknown as ReadableStreamDefaultReader<T>;
    }
  };
}
if (typeof (globalThis as { TextDecoder?: unknown }).TextDecoder === 'undefined') {
  (globalThis as Record<string, unknown>).TextDecoder = class TextDecoder {
    decode(bytes: Uint8Array, _opts?: { stream?: boolean }): string {
      let out = '';
      let i = 0;
      while (i < bytes.length) {
        const b1 = bytes[i++];
        if (b1 < 0x80) {
          out += String.fromCharCode(b1);
        } else if (b1 < 0xe0) {
          out += String.fromCharCode(((b1 & 0x1f) << 6) | (bytes[i++] & 0x3f));
        } else {
          out += String.fromCharCode(
            ((b1 & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f)
          );
        }
      }
      return out;
    }
  };
}

/** 构造 SSE 流式响应：chunks 为字符串片段（含 data: 前缀行）。
 *  jsdom 无 TextEncoder，手动按 UTF-8 转字节。 */
function makeStreamResponse(chunks: string[]) {
  const toBytes = (s: string): Uint8Array => {
    const bytes = new Uint8Array(s.length * 3);
    let len = 0;
    for (let i = 0; i < s.length; i++) {
      const code = s.codePointAt(i)!;
      if (code < 0x80) {
        bytes[len++] = code;
      } else if (code < 0x800) {
        bytes[len++] = 0xc0 | (code >> 6);
        bytes[len++] = 0x80 | (code & 0x3f);
      } else {
        bytes[len++] = 0xe0 | (code >> 12);
        bytes[len++] = 0x80 | ((code >> 6) & 0x3f);
        bytes[len++] = 0x80 | (code & 0x3f);
      }
    }
    return bytes.slice(0, len);
  };
  const chunksBytes = chunks.map(toBytes);
  let index = 0;
  const stream = {
    getReader: () => ({
      read: async (): Promise<{ done: boolean; value?: Uint8Array }> => {
        if (index >= chunksBytes.length) {
          return { done: true };
        }
        return { done: false, value: chunksBytes[index++] };
      },
    }),
  };
  return { ok: true, body: stream } as unknown as Response;
}

describe('streamChat · SSE 流式聊天', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('正常流：逐块输出并收到 [DONE] 后完成', async () => {
    mockApiFetch.mockResolvedValue(
      makeStreamResponse([
        'data: {"content": "你好", "finish_reason": null}\n\n',
        'data: {"content": "，世界", "finish_reason": null}\n\n',
        'data: [DONE]\n\n',
      ])
    );

    const chunks: string[] = [];
    let completed = false;
    let error: Error | null = null;

    await streamChat(
      { messages: [{ role: 'user', content: 'hi' }] },
      (c) => chunks.push(c),
      () => { completed = true; },
      (e) => { error = e; }
    );

    expect(chunks.join('')).toBe('你好，世界');
    expect(completed).toBe(true);
    expect(error).toBeNull();
  });

  it('后端 SSE 错误块（{"error": true}）→ 触发 onError，不卡在解读中', async () => {
    mockApiFetch.mockResolvedValue(
      makeStreamResponse([
        'data: {"error": true, "message": "LLM provider not found or not configured"}\n\n',
      ])
    );

    const chunks: string[] = [];
    let completed = false;
    let error: Error | null = null;

    await streamChat(
      { messages: [{ role: 'user', content: 'hi' }] },
      (c) => chunks.push(c),
      () => { completed = true; },
      (e) => { error = e; }
    );

    expect(chunks).toEqual([]);
    expect(completed).toBe(false);
    expect(error).not.toBeNull();
    expect(error!.message).toContain('LLM provider not found');
  });

  it('流自然结束但未收到 [DONE] → 视作完成（不再卡解读中）', async () => {
    // 模拟代理截断/后端提前断流：只发了内容块，没有 [DONE]
    mockApiFetch.mockResolvedValue(
      makeStreamResponse(['data: {"content": "部分内容", "finish_reason": null}\n\n'])
    );

    const chunks: string[] = [];
    let completed = false;
    let error: Error | null = null;

    await streamChat(
      { messages: [{ role: 'user', content: 'hi' }] },
      (c) => chunks.push(c),
      () => { completed = true; },
      (e) => { error = e; }
    );

    expect(chunks).toEqual(['部分内容']);
    expect(completed).toBe(true);
    expect(error).toBeNull();
  });

  it('HTTP 非 200 → 抛错触发 onError', async () => {
    mockApiFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ detail: '请求过于频繁' }),
    });

    let error: Error | null = null;
    await streamChat(
      { messages: [{ role: 'user', content: 'hi' }] },
      () => {},
      () => {},
      (e) => { error = e; }
    );

    expect(error).not.toBeNull();
    expect(error!.message).toContain('请求过于频繁');
  });
});
