import { act, fireEvent, render, screen } from '@testing-library/react';
import ReadingPanel from '@/components/tarot/ReadingPanel';
import { getSpread, tarotDeck } from '@/mock/tarot';
import type { DrawnCard } from '@/types/tarot';

// mock 流式接口与 MarkdownRenderer（dynamic 懒加载目标）
jest.mock('@/lib/api/llm', () => ({
  streamChat: jest.fn(),
}));
jest.mock('@/components/ui/MarkdownRenderer', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <div data-testid="ai-markdown">{content}</div>,
}));

import { streamChat } from '@/lib/api/llm';
const mockStreamChat = streamChat as jest.Mock;

/** 取 mock 调用的四个回调与 signal：onChunk / onComplete / onError / signal */
function callbacks() {
  const args = mockStreamChat.mock.calls[0] as [
    unknown,
    (chunk: string) => void,
    () => void,
    (error: Error) => void,
    AbortSignal | undefined,
  ];
  return { onChunk: args[1], onComplete: args[2], onError: args[3], signal: args[4] };
}

const drawn: DrawnCard[] = [
  { card: tarotDeck[18], isReversed: true }, // 月亮 · 逆位
  { card: tarotDeck[19], isReversed: false }, // 太阳 · 正位
];

describe('ReadingPanel · 解读面板', () => {
  beforeEach(() => {
    localStorage.clear();
    mockStreamChat.mockClear();
  });

  it('渲染预设牌义：牌位、牌名、朝向徽标与关键词', () => {
    render(
      <ReadingPanel
        question=""
        spread={getSpread('three')}
        drawn={drawn}
        onReset={jest.fn()}
      />
    );

    expect(screen.getByText('过去')).toBeInTheDocument();
    expect(screen.getByText('现在')).toBeInTheDocument();
    // 牌名在解读标题（heading）与牌面缩略图中各出现一次
    expect(screen.getAllByRole('heading', { name: /月亮/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /太阳/ })).toBeInTheDocument();
    expect(screen.getAllByText('逆位').length).toBeGreaterThan(0);
    expect(screen.getAllByText('正位').length).toBeGreaterThan(0);
    expect(screen.getByText('迷雾')).toBeInTheDocument(); // 月亮关键词
    // 「过去」位文案带语境前缀，逆位牌使用逆位含义
    expect(screen.getByText(`过去的影响：${tarotDeck[18].reversed}`)).toBeInTheDocument();
  });

  it('未登录点击 AI 解读 → 显示登录引导，不发起请求', () => {
    render(
      <ReadingPanel
        question="今天运势如何？"
        spread={getSpread('single')}
        drawn={[drawn[0]]}
        onReset={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '开始解读' }));
    expect(screen.getByText('AI 解读需要登录后使用。')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /去登录/ })).toHaveAttribute('href', '/login');
    expect(mockStreamChat).not.toHaveBeenCalled();
  });

  it('已登录：问题与牌面写入 messages，流式 chunk 累积渲染', async () => {
    localStorage.setItem('auth_token', 'test-token');
    render(
      <ReadingPanel
        question="今天运势如何？"
        spread={getSpread('single')}
        drawn={[drawn[0]]}
        onReset={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '开始解读' }));

    expect(mockStreamChat).toHaveBeenCalledTimes(1);
    const [request] = mockStreamChat.mock.calls[0];
    expect(request.messages[0].role).toBe('system');
    const user = request.messages[1].content as string;
    expect(user).toContain('今天运势如何？');
    expect(user).toContain('月亮');
    expect(user).toContain('逆位');

    // 流式增量（MarkdownRenderer 懒加载，用 findBy 等它挂载）
    act(() => {
      callbacks().onChunk('第一段解读');
    });
    const markdown = await screen.findByTestId('ai-markdown');
    expect(markdown).toHaveTextContent('第一段解读');
    act(() => {
      callbacks().onChunk('，第二段');
    });
    expect(markdown).toHaveTextContent('第一段解读，第二段');

    // 完成后按钮变为「重新解读」
    act(() => {
      callbacks().onComplete();
    });
    expect(screen.getByRole('button', { name: '重新解读' })).toBeInTheDocument();
  });

  it('401 错误 → 转为未登录引导', () => {
    localStorage.setItem('auth_token', 'expired-token');
    render(
      <ReadingPanel
        question=""
        spread={getSpread('single')}
        drawn={[drawn[0]]}
        onReset={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '开始解读' }));
    act(() => {
      callbacks().onError(new Error('请求失败: 401 (Unauthorized)'));
    });
    expect(screen.getByText('AI 解读需要登录后使用。')).toBeInTheDocument();
  });

  it('其他错误 → 展示错误提示且预设牌义不受影响', () => {
    localStorage.setItem('auth_token', 'test-token');
    render(
      <ReadingPanel
        question=""
        spread={getSpread('single')}
        drawn={[drawn[0]]}
        onReset={jest.fn()}
      />
    );

    expect(screen.getByText(tarotDeck[18].reversed)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '开始解读' }));
    act(() => {
      callbacks().onError(new Error('网络错误'));
    });
    expect(screen.getByText(/解读失败：网络错误/)).toBeInTheDocument();
    expect(screen.getByText(tarotDeck[18].reversed)).toBeInTheDocument();
  });

  it('流式生成中可停止：点击停止中断请求', () => {
    localStorage.setItem('auth_token', 'test-token');
    render(
      <ReadingPanel
        question=""
        spread={getSpread('single')}
        drawn={[drawn[0]]}
        onReset={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '开始解读' }));
    const { signal } = callbacks();
    expect(signal).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '停止' }));
    expect(signal?.aborted).toBe(true);
  });

  it('停止后（AbortError）→ 保留已生成内容并视为完成', async () => {
    localStorage.setItem('auth_token', 'test-token');
    render(
      <ReadingPanel
        question=""
        spread={getSpread('single')}
        drawn={[drawn[0]]}
        onReset={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '开始解读' }));
    act(() => {
      callbacks().onChunk('已生成的部分解读');
    });
    const markdown = await screen.findByTestId('ai-markdown');
    expect(markdown).toHaveTextContent('已生成的部分解读');

    // 模拟 abort 后 streamChat 回调的 AbortError
    act(() => {
      callbacks().onError(new DOMException('The user aborted a request.', 'AbortError'));
    });
    expect(markdown).toHaveTextContent('已生成的部分解读');
    expect(screen.getByRole('button', { name: '重新解读' })).toBeInTheDocument();
  });

  it('点击重新占卜触发 onReset', () => {
    const onReset = jest.fn();
    render(
      <ReadingPanel
        question=""
        spread={getSpread('single')}
        drawn={[drawn[0]]}
        onReset={onReset}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '重新占卜' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
