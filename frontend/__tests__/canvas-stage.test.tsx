import { fireEvent, render, screen } from '@testing-library/react';
import CanvasStage from '@/components/tools/image-gen/CanvasStage';
import type { GenHistoryEntry } from '@/lib/image-gen-history';

jest.mock('@/components/ui/Lightbox', () => ({
  __esModule: true,
  default: ({ currentIndex }: { currentIndex: number }) => (
    <div data-testid="lightbox" data-current-index={currentIndex} />
  ),
}));

const baseProps = {
  state: 'idle' as const,
  phase: 'idle' as const,
  kind: 'image' as const,
  prompt: '',
  size: '1:1',
  images: [] as string[],
  videoUrl: null as string | null,
  failedImages: new Set<string>(),
  errorMsg: '',
  history: [] as GenHistoryEntry[],
  hasResult: false,
  examplePrompts: ['月光下的湖泊', '宇航员橘猫'],
  onExampleSelect: jest.fn(),
  onRestore: jest.fn(),
  onDelete: jest.fn(),
  onClear: jest.fn(),
  onRetry: jest.fn(),
  onImageError: jest.fn(),
  onImageRetry: jest.fn(),
  activeEntryId: null,
};

describe('CanvasStage · 创作台画布', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('idle 空态：示例提示词卡片可点击填入', () => {
    const onExampleSelect = jest.fn();
    render(<CanvasStage {...baseProps} onExampleSelect={onExampleSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /月光下的湖泊/ }));
    expect(onExampleSelect).toHaveBeenCalledWith('月光下的湖泊');
  });

  it('polling + pending 阶段显示排队进度节点', () => {
    render(<CanvasStage {...baseProps} state="polling" phase="pending" />);
    expect(screen.getByText('排队')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/排队|等待/);
  });

  it('polling + running 阶段显示生成进度节点', () => {
    render(<CanvasStage {...baseProps} state="polling" phase="running" />);
    const active = screen.getByText('生成').closest('li');
    expect(active).toHaveAttribute('aria-current', 'step');
  });

  it('done 且有图片结果：渲染图片网格（可点击查看大图）', () => {
    render(
      <CanvasStage
        {...baseProps}
        state="done"
        phase="done"
        images={['https://cdn.example.com/a.png']}
        hasResult
      />
    );
    expect(
      screen.getByRole('button', { name: '查看生成图片 1' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看生成图片 1' }));
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
  });

  it('done 且有视频结果：渲染视频播放器与下载链接', () => {
    render(
      <CanvasStage
        {...baseProps}
        state="done"
        phase="done"
        kind="video"
        videoUrl="https://cdn.example.com/clip.mp4"
        hasResult
      />
    );
    expect(screen.getByLabelText('生成的视频')).toHaveAttribute(
      'src',
      'https://cdn.example.com/clip.mp4'
    );
    expect(screen.getByRole('link', { name: '下载视频' })).toBeInTheDocument();
  });

  it('error 状态：role=alert 展示错误并触发重试', () => {
    const onRetry = jest.fn();
    render(
      <CanvasStage
        {...baseProps}
        state="error"
        errorMsg="生成服务调用失败"
        onRetry={onRetry}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('生成服务调用失败');
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('结果/历史 tab 可切换，历史为空显示空态', () => {
    render(<CanvasStage {...baseProps} />);
    fireEvent.click(screen.getByRole('tab', { name: '历史' }));
    expect(screen.getByText('还没有生成记录')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: '结果' }));
    expect(screen.getByText('生成结果')).toBeInTheDocument();
  });

  it('视频加载失败：onError 隐藏加载指示并显示错误提示', () => {
    const { container } = render(
      <CanvasStage
        {...baseProps}
        state="done"
        phase="done"
        kind="video"
        videoUrl="https://cdn.example.com/clip.mp4"
        hasResult
      />
    );
    // 初始加载中：存在旋转指示
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    fireEvent.error(screen.getByLabelText('生成的视频'));
    // 指示消失，错误提示可见
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(screen.getByText(/视频加载失败/)).toBeInTheDocument();
  });

  it('图片加载失败占位：展示重试按钮并回调 URL', () => {
    const onImageRetry = jest.fn();
    const url = 'https://cdn.example.com/a.png';
    render(
      <CanvasStage
        {...baseProps}
        state="done"
        phase="done"
        images={[url]}
        failedImages={new Set([url])}
        hasResult
        onImageRetry={onImageRetry}
      />
    );
    expect(screen.getByText('图片加载失败')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重试加载' }));
    expect(onImageRetry).toHaveBeenCalledWith(url);
  });

  it('Lightbox 索引与可见图片对齐：失败占位不进入预览序列', () => {
    const ok = 'https://cdn.example.com/ok.png';
    const fail = 'https://cdn.example.com/fail.png';
    render(
      <CanvasStage
        {...baseProps}
        state="done"
        phase="done"
        images={[fail, ok]}
        failedImages={new Set([fail])}
        hasResult
      />
    );
    // fail 渲染为占位（非按钮），ok 是唯一可点击按钮
    expect(screen.getByText('图片加载失败')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看生成图片 2' }));
    // 应打开过滤后第 1 张（索引 0），而不是全量索引 1
    expect(screen.getByTestId('lightbox')).toHaveAttribute(
      'data-current-index',
      '0'
    );
  });

  it('done 但无结果：空态展示并触发重新生成', () => {
    const onRetry = jest.fn();
    render(
      <CanvasStage {...baseProps} state="done" phase="done" onRetry={onRetry} />
    );
    expect(screen.getByText('没有生成结果')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重新生成' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('历史 tab：点击记录可恢复（onRestore 回调）', () => {
    const onRestore = jest.fn();
    const entry: GenHistoryEntry = {
      id: 'e1',
      createdAt: Date.now(),
      kind: 'image',
      prompt: '月光',
      images: ['https://cdn.example.com/a.png'],
      videoUrl: null,
    };
    render(
      <CanvasStage {...baseProps} history={[entry]} onRestore={onRestore} />
    );
    fireEvent.click(screen.getByRole('tab', { name: '历史' }));
    fireEvent.click(screen.getByRole('button', { name: /恢复记录/ }));
    expect(onRestore).toHaveBeenCalledWith(entry);
  });
});
