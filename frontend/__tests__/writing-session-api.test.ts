import { adminApi } from '@/lib/admin-api-client';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => {
  fetchMock.mockReset();
  localStorage.setItem('auth_token', 'test-token');
});

// jest-environment-jsdom@29 不提供全局 Response；这里构造一个满足 AdminApiClient
// 所需形状（.ok / .status / .text()）的最小 mock，避免引入额外依赖。
interface MockResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}

function jsonResponse(body: unknown, status = 200): MockResponse {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
  };
}

const fullSession = {
  id: 's1',
  user_id: 'u1',
  article_id: null,
  stage: 'clarifying',
  status: 'active',
  requirements_summary: {},
  outline: '',
  draft: '',
  messages: [],
  suggestions: [],
  revisions: [],
  created_at: '2026-07-28T00:00:00Z',
  updated_at: '2026-07-28T00:00:00Z',
};

test('creates a writing session', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ ...fullSession, id: 's1' }, 201));
  const session = await adminApi.writingSessions.create();
  expect(session.stage).toBe('clarifying');
  expect(session.id).toBe('s1');
});

test('recovers active session', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ ...fullSession, stage: 'outline_review' }));
  const session = await adminApi.writingSessions.active();
  expect(session.stage).toBe('outline_review');
});

test('abandon returns abandoned session', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ ...fullSession, status: 'abandoned' }));
  const session = await adminApi.writingSessions.abandon('s1');
  expect(session.status).toBe('abandoned');
});

test('confirm-draft returns session with draft', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ ...fullSession, stage: 'editing', draft: '# 初稿' }));
  const result = await adminApi.writingSessions.confirmDraft('s1');
  expect(result.stage).toBe('editing');
  expect(result.draft).toBe('# 初稿');
});
