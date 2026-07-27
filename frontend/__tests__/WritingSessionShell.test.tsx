import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WritingSessionShell from '@/components/admin/writing/WritingSessionShell';
import { adminApi } from '@/lib/admin-api-client';
import type { WritingSession } from '@/types/writing-session';

// framer-motion 在 jsdom 下动画会抛错，统一置空为透传组件
jest.mock('@/lib/framer-motion', () => ({
  motion: new Proxy({}, { get: () => (props: Record<string, unknown>) => props.children }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// react-markdown / remark-gfm 为纯 ESM，jest 默认不转译 node_modules；
// 本测试不验证 Markdown 渲染，直接桩成纯文本透传即可。
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <>{children}</>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }));

jest.mock('@/lib/admin-api-client', () => ({
  adminApi: {
    writingSessions: {
      active: jest.fn(),
      create: jest.fn(),
      get: jest.fn(),
      abandon: jest.fn(),
      messageStream: jest.fn(),
      generateOutline: jest.fn(),
      adjustOutline: jest.fn(),
      confirmOutline: jest.fn(),
      adjustDraft: jest.fn(),
      confirmDraft: jest.fn(),
    },
  },
}));

const sessionFixture = (overrides: Partial<WritingSession> = {}): WritingSession => ({
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
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('shows resume choice when active session exists', async () => {
  (adminApi.writingSessions.active as jest.Mock).mockResolvedValue(
    sessionFixture({ stage: 'outline_review' })
  );
  render(<WritingSessionShell onDraftConfirmed={jest.fn()} />);
  expect(await screen.findByRole('button', { name: '继续上次写作' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '开始新文章' })).toBeInTheDocument();
});

test('starts new session when no active session', async () => {
  (adminApi.writingSessions.active as jest.Mock).mockRejectedValue({
    message: 'Not found',
    status: 404,
  });
  (adminApi.writingSessions.create as jest.Mock).mockResolvedValue(sessionFixture());
  render(<WritingSessionShell onDraftConfirmed={jest.fn()} />);
  await waitFor(() => {
    expect(adminApi.writingSessions.create).toHaveBeenCalled();
  });
});

test('continue resumes the existing session stage', async () => {
  (adminApi.writingSessions.active as jest.Mock).mockResolvedValue(
    sessionFixture({ stage: 'outline_review', outline: '# 大纲' })
  );
  render(<WritingSessionShell onDraftConfirmed={jest.fn()} />);
  const continueBtn = await screen.findByRole('button', { name: '继续上次写作' });
  await userEvent.click(continueBtn);
  // 进入大纲审阅阶段：进度条标签 + 「确认大纲并生成初稿」按钮都含「确认大纲」
  expect((await screen.findAllByText(/确认大纲/)).length).toBeGreaterThan(0);
  // 大纲正文已渲染
  expect(await screen.findByText('# 大纲')).toBeInTheDocument();
});

test('"开始新文章" abandons old session and creates a fresh one', async () => {
  (adminApi.writingSessions.active as jest.Mock).mockResolvedValue(
    sessionFixture({ stage: 'clarifying' })
  );
  (adminApi.writingSessions.abandon as jest.Mock).mockResolvedValue(
    sessionFixture({ status: 'abandoned' })
  );
  (adminApi.writingSessions.create as jest.Mock).mockResolvedValue(
    sessionFixture({ id: 's2', stage: 'clarifying' })
  );
  render(<WritingSessionShell onDraftConfirmed={jest.fn()} />);
  const newBtn = await screen.findByRole('button', { name: '开始新文章' });
  await userEvent.click(newBtn);
  await waitFor(() => {
    expect(adminApi.writingSessions.abandon).toHaveBeenCalledWith('s1');
  });
  await waitFor(() => {
    expect(adminApi.writingSessions.create).toHaveBeenCalled();
  });
  // 新会话进入澄清阶段：渲染输入框
  expect(await screen.findByPlaceholderText(/描述你想写的文章/)).toBeInTheDocument();
});

test('shows error UI when loading active session fails with non-404', async () => {
  (adminApi.writingSessions.active as jest.Mock).mockRejectedValue({
    message: 'Server error',
    status: 500,
  });
  render(<WritingSessionShell onDraftConfirmed={jest.fn()} />);
  expect(await screen.findByText('Server error')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
});

test('confirmed draft calls onDraftConfirmed with draft and session', async () => {
  (adminApi.writingSessions.active as jest.Mock).mockRejectedValue({ status: 404 });
  (adminApi.writingSessions.create as jest.Mock).mockResolvedValue(
    sessionFixture({ stage: 'draft_review', draft: '# 初稿正文' })
  );
  // confirmDraft 返回进入 editing 阶段、携带最终草稿的权威 session
  const confirmResult = sessionFixture({ stage: 'editing', draft: '# 初稿正文' });
  (adminApi.writingSessions.confirmDraft as jest.Mock).mockResolvedValue(confirmResult);

  const onDraftConfirmed = jest.fn();
  render(<WritingSessionShell onDraftConfirmed={onDraftConfirmed} />);
  const confirmBtn = await screen.findByRole('button', { name: /确认初稿/ });
  await userEvent.click(confirmBtn);
  // 验证真实契约：把草稿与完整 session 交给父组件
  await waitFor(() => {
    expect(adminApi.writingSessions.confirmDraft).toHaveBeenCalledWith('s1');
    expect(onDraftConfirmed).toHaveBeenCalledWith('# 初稿正文', confirmResult);
  });
});
