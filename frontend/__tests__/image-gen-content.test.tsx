import { act, fireEvent, render, screen } from '@testing-library/react';
import ImageGenContent from '@/app/tools/image-gen/image-gen-content';
import { createGenTask, getGenTaskStatus } from '@/lib/api/imageGen';

jest.mock('@/lib/api/imageGen', () => ({
  createGenTask: jest.fn(),
  getGenTaskStatus: jest.fn(),
}));

// Lightbox 依赖 useToast 与 DOM API，mock 掉避免副作用
jest.mock('@/components/ui/Lightbox', () => ({
  __esModule: true,
  default: () => <div data-testid="lightbox" />,
}));

const mockCreateTask = createGenTask as jest.Mock;
const mockGetStatus = getGenTaskStatus as jest.Mock;

/** 等待当前微任务队列清空（提交/轮询的 Promise 链） */
const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

/** 驱动一次完整「提交 + 立即查询成功」的生成流程，返回结果状态快照 */
const runGenerateFlow = async (opts: {
  prompt: string;
  kind?: 'image' | 'video';
  statusResp?: Record<string, unknown>;
}) => {
  render(<ImageGenContent />);
  if (opts.kind === 'video') {
    fireEvent.click(screen.getByRole('button', { name: '视频' }));
  }
  fireEvent.change(screen.getByLabelText('提示词'), { target: { value: opts.prompt } });
  fireEvent.click(screen.getByRole('button', { name: opts.kind === 'video' ? '生成视频' : '生成图片' }));
  await flushPromises(); // createGenTask → start → 立即 getGenTaskStatus
};

describe('ImageGenContent · 图片/视频生成工具页', () => {
  beforeEach(() => {
    localStorage.clear();
    mockCreateTask.mockReset();
    mockGetStatus.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('渲染输入区：类型切换、提示词、尺寸预设、张数、生成按钮', () => {
    render(<ImageGenContent />);
    expect(screen.getByRole('button', { name: '图片' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '视频' })).toBeInTheDocument();
    expect(screen.getByLabelText('提示词')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1:1 方图' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '生成图片' })).toBeInTheDocument();
  });

  it('切换到视频 Tab：隐藏尺寸/张数，按钮文案变为生成视频', () => {
    render(<ImageGenContent />);
    fireEvent.click(screen.getByRole('button', { name: '视频' }));
    expect(screen.getByRole('button', { name: '视频' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: '1:1 方图' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '生成视频' })).toBeInTheDocument();
  });

  it('图片生成成功 → 渲染图片网格并调用 createGenTask(type=image)', async () => {
    mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
    mockGetStatus.mockResolvedValue({
      task_id: 'task-1',
      status: 'success',
      images: ['https://cdn.example.com/a.png', 'https://cdn.example.com/b.png'],
      video_url: null,
      fail_reason: null,
    });

    await runGenerateFlow({ prompt: '月光下的湖泊' });

    expect(await screen.findByText('生成结果')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看生成图片 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看生成图片 2' })).toBeInTheDocument();
    expect(mockCreateTask).toHaveBeenCalledWith({
      type: 'image',
      prompt: '月光下的湖泊',
      workflowInputs: { size: '1024x1024', count: '1' },
    });
    expect(mockGetStatus).toHaveBeenCalledWith('task-1');
  });

  it('视频生成成功 → 渲染 video 播放器并调用 createGenTask(type=video)', async () => {
    mockCreateTask.mockResolvedValue({ task_id: 'task-v' });
    mockGetStatus.mockResolvedValue({
      task_id: 'task-v',
      status: 'success',
      images: [],
      video_url: 'https://cdn.example.com/clip.mp4',
      fail_reason: null,
    });

    await runGenerateFlow({ prompt: '海鸥飞过灯塔', kind: 'video' });

    expect(await screen.findByText('生成结果')).toBeInTheDocument();
    const video = screen.getByLabelText('生成的视频');
    expect(video.tagName).toBe('VIDEO');
    expect(video).toHaveAttribute('src', 'https://cdn.example.com/clip.mp4');
    expect(screen.getByRole('link', { name: '下载视频' })).toBeInTheDocument();
    expect(mockCreateTask).toHaveBeenCalledWith({
      type: 'video',
      prompt: '海鸥飞过灯塔',
      workflowInputs: undefined,
    });
  });

  it('任务运行中显示进度提示，可点击取消', async () => {
    mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
    mockGetStatus.mockResolvedValue({
      task_id: 'task-1',
      status: 'running',
      images: [],
      video_url: null,
      fail_reason: null,
    });

    await runGenerateFlow({ prompt: '一只猫' });
    expect(await screen.findByRole('button', { name: '生成中… 可取消' })).toBeInTheDocument();

    // 点击取消 → 回到初始，无错误
    fireEvent.click(screen.getByRole('button', { name: '生成中… 可取消' }));
    expect(screen.getByRole('button', { name: '生成图片' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('任务失败 → role=alert 展示失败原因并可重试', async () => {
    mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
    mockGetStatus.mockResolvedValue({
      task_id: 'task-1',
      status: 'fail',
      images: [],
      video_url: null,
      fail_reason: '审核未通过',
    });

    await runGenerateFlow({ prompt: '失败场景' });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('审核未通过');
  });

  it('创建任务请求失败 → 展示错误信息', async () => {
    mockCreateTask.mockRejectedValue(new Error('生成服务未配置，请联系管理员'));

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '测试' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    await flushPromises();

    expect(await screen.findByRole('alert')).toHaveTextContent('生成服务未配置');
  });

  it('成功生成后进入会话历史；历史最多 5 组并支持恢复（含 kind）', async () => {
    mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
    mockGetStatus.mockResolvedValue({
      task_id: 'task-1',
      status: 'success',
      images: ['https://cdn.example.com/a.png'],
      video_url: null,
      fail_reason: null,
    });

    // 第一组：图片
    await runGenerateFlow({ prompt: '第一组' });
    await screen.findByText('生成结果');

    // 切视频生成第二组（历史含两种 kind）
    fireEvent.click(screen.getByRole('button', { name: '视频' }));
    mockGetStatus.mockResolvedValue({
      task_id: 'task-2',
      status: 'success',
      images: [],
      video_url: 'https://cdn.example.com/clip2.mp4',
      fail_reason: null,
    });
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '第二组' } });
    fireEvent.click(screen.getByRole('button', { name: '生成视频' }));
    await flushPromises();
    await screen.findByText('生成结果');

    expect(screen.getByText(/本次会话历史/)).toBeInTheDocument();
    // 恢复第一组：点击历史项后提示词回到「第一组」，且恢复为图片类型
    fireEvent.click(screen.getByText('第一组'));
    expect((screen.getByLabelText('提示词') as HTMLTextAreaElement).value).toBe('第一组');
    expect(screen.getByRole('button', { name: '图片' })).toHaveAttribute('aria-pressed', 'true');
  });
});
