import { generateArticleSummary } from './ai';
import { apiFetch } from '@/lib/api-client';
import type { MockedFunction } from 'jest-mock';

// 仅 mock apiFetch 网络出口，extractApiErrorMessage 用真实实现（校验文案提取链路）
jest.mock('@/lib/api-client', () => {
  const actual =
    jest.requireActual<typeof import('@/lib/api-client')>('@/lib/api-client');
  return { ...actual, apiFetch: jest.fn() };
});

/** 测试用伪 Response：generateArticleSummary 只消费 ok/status/json */
interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

const fakeResponse = (body: unknown, ok = true, status = 200): FakeResponse => ({
  ok,
  status,
  json: async () => body,
});

const mockedApiFetch = apiFetch as unknown as MockedFunction<
  (input: string, init?: RequestInit) => Promise<FakeResponse>
>;

describe('generateArticleSummary', () => {
  afterEach(() => {
    mockedApiFetch.mockReset();
  });

  it('成功时返回后端 summary', async () => {
    mockedApiFetch.mockResolvedValue(fakeResponse({ summary: '这是 AI 生成的摘要' }));
    await expect(
      generateArticleSummary({ title: '标题', content: '正文内容' })
    ).resolves.toEqual({ summary: '这是 AI 生成的摘要' });
    // 请求契约：POST /ai/article-summary，body 为 JSON 字符串
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/ai/article-summary',
      expect.objectContaining({ method: 'POST' })
    );
    const options = mockedApiFetch.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(options.body))).toEqual({
      title: '标题',
      content: '正文内容',
    });
  });

  it('非 2xx 时抛出后端错误信息（error.message 优先）', async () => {
    mockedApiFetch.mockResolvedValue(
      fakeResponse({ error: { message: '接口不存在' } }, false, 404)
    );
    await expect(
      generateArticleSummary({ title: '标题', content: '正文内容' })
    ).rejects.toThrow('接口不存在');
  });

  it('后端返回旧式 detail 文案时也能透出', async () => {
    mockedApiFetch.mockResolvedValue(fakeResponse({ detail: '内容太短' }, false, 400));
    await expect(
      generateArticleSummary({ title: '标题', content: '正文内容' })
    ).rejects.toThrow('内容太短');
  });

  it('summary 字段缺失时返回空字符串', async () => {
    mockedApiFetch.mockResolvedValue(fakeResponse({}));
    await expect(
      generateArticleSummary({ title: '标题', content: '正文内容' })
    ).resolves.toEqual({ summary: '' });
  });
});
