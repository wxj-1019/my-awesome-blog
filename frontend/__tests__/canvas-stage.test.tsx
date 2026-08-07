import { fireEvent, render, screen } from '@testing-library/react';
import CanvasStage from '@/components/tools/image-gen/CanvasStage';
import type { GenHistoryEntry } from '@/lib/image-gen-history';

jest.mock('@/components/ui/Lightbox', () => ({
  __esModule: true,
  default: () => <div data-testid="lightbox" />,
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
});
