import { searchArticlesFulltext } from '@/lib/api/search';
import { apiFetch } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('searchArticlesFulltext · 全文搜索 service', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('拼接 search_query/limit/published_only 参数并透传 AbortSignal', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'a1', title: '测试' }],
    } as Response);
    const controller = new AbortController();

    const result = await searchArticlesFulltext('React', controller.signal);

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = apiFetchMock.mock.calls[0];
    expect(url).toContain('/articles/search-fulltext');
    expect(url).toContain('search_query=React');
    expect(url).toContain('limit=20');
    expect(url).toContain('published_only=true');
    expect((options as RequestInit).signal).toBe(controller.signal);
    expect(result).toEqual([{ id: 'a1', title: '测试' }]);
  });

  it('响应非 ok 时抛出错误', async () => {
    apiFetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(searchArticlesFulltext('x')).rejects.toThrow('500');
  });
});
