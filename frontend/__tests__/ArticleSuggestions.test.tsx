import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { webcrypto } from 'crypto';
import { TextEncoder as NodeTextEncoder } from 'util';
import ArticleSuggestions from '@/components/admin/writing/ArticleSuggestions';
import { adminApi } from '@/lib/admin-api-client';
import type { WritingSession, WritingSuggestion } from '@/types/writing-session';

// jsdom 暴露的 window.crypto 没有 subtle；contentHash 需要它。
// 用 defineProperty 强制覆盖为 Node 18+ 的 webcrypto。
// 同理 TextEncoder 在 jsdom 下也不存在，从 Node util 模块补齐。
Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  writable: true,
  configurable: true,
});
if (typeof globalThis.TextEncoder === 'undefined') {
  Object.defineProperty(globalThis, 'TextEncoder', {
    value: NodeTextEncoder,
    writable: true,
    configurable: true,
  });
}

// 复用既有测试的 mock 模式：framer-motion 透传、markdown 透传。
jest.mock('@/lib/framer-motion', () => ({
  motion: new Proxy({}, { get: () => (props: Record<string, unknown>) => props.children }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <>{children}</>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }));

jest.mock('@/lib/admin-api-client', () => ({
  adminApi: {
    writingSessions: {
      analyze: jest.fn(),
      get: jest.fn(),
      reviseSuggestion: jest.fn(() => () => {}),
      applyRevision: jest.fn(),
    },
  },
}));

// useToast 来自 Toast 组件；它依赖 react-hot-toast 的 Toaster 上下文，
// 在测试里直接桩成一个 no-op，避免渲染 toast 容器。
jest.mock('@/components/admin/Toast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    remove: jest.fn(),
  }),
}));

const suggestionFixture = (over: Partial<WritingSuggestion> = {}): WritingSuggestion => ({
  id: 'sg1',
  type: 'structure',
  title: '补充开场',
  reason: '缺少场景',
  scope: '第一段',
  status: 'pending',
  ...over,
});

const sessionFixture = (over: Partial<WritingSession> = {}): WritingSession => ({
  id: 's1',
  user_id: 'u1',
  article_id: null,
  stage: 'editing',
  status: 'active',
  requirements_summary: {},
  outline: '',
  draft: '',
  messages: [],
  suggestions: [],
  revisions: [],
  created_at: '2026-07-28T00:00:00Z',
  updated_at: '2026-07-28T00:00:00Z',
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('shows analyze button when no suggestions', () => {
  render(
    <ArticleSuggestions
      suggestions={[]}
      content="test"
      sessionId="s1"
      onSessionChange={jest.fn()}
      onApplyRevision={jest.fn()}
    />
  );
  expect(screen.getByRole('button', { name: '分析全文' })).toBeInTheDocument();
});

test('renders suggestion cards when suggestions exist', () => {
  const suggestions = [suggestionFixture()];
  render(
    <ArticleSuggestions
      suggestions={suggestions}
      content="test"
      sessionId="s1"
      onSessionChange={jest.fn()}
      onApplyRevision={jest.fn()}
    />
  );
  expect(screen.getByText('补充开场')).toBeInTheDocument();
  expect(screen.getByText('缺少场景')).toBeInTheDocument();
  expect(screen.getByText('范围：第一段')).toBeInTheDocument();
});

test('analyze calls adminApi with content hash and updates session', async () => {
  const user = userEvent.setup();
  const onSessionChange = jest.fn();
  const updated = sessionFixture({
    suggestions: [suggestionFixture({ title: '新建议' })],
  });
  (adminApi.writingSessions.analyze as jest.Mock).mockResolvedValue(updated);

  render(
    <ArticleSuggestions
      suggestions={[]}
      content="hello world"
      sessionId="s1"
      onSessionChange={onSessionChange}
      onApplyRevision={jest.fn()}
    />
  );
  await user.click(screen.getByRole('button', { name: '分析全文' }));

  await waitFor(() => {
    expect(adminApi.writingSessions.analyze).toHaveBeenCalledWith(
      's1',
      'hello world',
      expect.any(String)
    );
  });
  // hash 是 64 位十六进制
  const hashArg = (adminApi.writingSessions.analyze as jest.Mock).mock.calls[0][2];
  expect(hashArg).toMatch(/^[0-9a-f]{64}$/);
  expect(onSessionChange).toHaveBeenCalledWith(updated);
});

test('clicking a pending suggestion starts revise stream and shows preview on chunk', async () => {
  const user = userEvent.setup();
  const suggestions = [suggestionFixture()];
  let captured: { onChunk: (d: string) => void; onMeta: (m: Record<string, unknown>) => void } | null = null;
  (adminApi.writingSessions.reviseSuggestion as jest.Mock).mockImplementation(
    (_id: string, _body: unknown, handlers: { onChunk: (d: string) => void; onMeta: (m: Record<string, unknown>) => void }) => {
      captured = handlers;
      return () => {};
    }
  );
  (adminApi.writingSessions.get as jest.Mock).mockResolvedValue(sessionFixture());

  render(
    <ArticleSuggestions
      suggestions={suggestions}
      content="正文"
      sessionId="s1"
      onSessionChange={jest.fn()}
      onApplyRevision={jest.fn()}
    />
  );
  await user.click(screen.getByRole('button', { name: '生成修改预览' }));

  await waitFor(() => {
    expect(adminApi.writingSessions.reviseSuggestion).toHaveBeenCalled();
  });
  expect(captured).not.toBeNull();
  captured!.onMeta({ revision_id: 'rev1' });
  captured!.onChunk('替换');
  captured!.onChunk('文本');

  expect(await screen.findByText('替换文本')).toBeInTheDocument();
});

test('applied suggestions cannot be re-clicked', () => {
  const suggestions = [suggestionFixture({ status: 'applied' })];
  render(
    <ArticleSuggestions
      suggestions={suggestions}
      content="test"
      sessionId="s1"
      onSessionChange={jest.fn()}
      onApplyRevision={jest.fn()}
    />
  );
  expect(screen.queryByRole('button', { name: '生成修改预览' })).not.toBeInTheDocument();
  expect(screen.getByText('已应用')).toBeInTheDocument();
});

test('apply calls applyRevision with current content hash and refreshes session', async () => {
  const user = userEvent.setup();
  const suggestions = [suggestionFixture()];
  const appliedRevision = {
    id: 'rev1',
    source: 'suggestion' as const,
    suggestion_id: 'sg1',
    content_hash: 'hash',
    selection_start: 0,
    selection_end: 2,
    original_text: '正文',
    replacement_text: '替换文本',
    status: 'applied' as const,
  };
  const refreshed = sessionFixture({ revisions: [appliedRevision] });
  (adminApi.writingSessions.reviseSuggestion as jest.Mock).mockImplementation(
    (_id: string, _body: unknown, handlers: { onMeta: (m: Record<string, unknown>) => void; onChunk: (d: string) => void }) => {
      handlers.onMeta({ revision_id: 'rev1' });
      handlers.onChunk('替换文本');
      return () => {};
    }
  );
  (adminApi.writingSessions.get as jest.Mock).mockResolvedValue(sessionFixture());
  (adminApi.writingSessions.applyRevision as jest.Mock).mockResolvedValue(refreshed);

  const onApplyRevision = jest.fn();
  const onSessionChange = jest.fn();
  render(
    <ArticleSuggestions
      suggestions={suggestions}
      content="正文"
      sessionId="s1"
      onSessionChange={onSessionChange}
      onApplyRevision={onApplyRevision}
    />
  );
  await user.click(screen.getByRole('button', { name: '生成修改预览' }));

  // 触发流（mock 已在 reviseSuggestion 调用时同步 onMeta）→ 预览出现 → 应用
  const applyBtn = await screen.findByRole('button', { name: '应用替换' });
  await user.click(applyBtn);

  await waitFor(() => {
    expect(adminApi.writingSessions.applyRevision).toHaveBeenCalledWith(
      's1',
      'rev1',
      expect.any(String)
    );
  });
  // 第二个参数为本地预览全文（suggestion 来源的 replacement，供父级整篇写回正文）
  expect(onApplyRevision).toHaveBeenCalledWith(appliedRevision, '替换文本');
  expect(onSessionChange).toHaveBeenCalledWith(refreshed);
});
