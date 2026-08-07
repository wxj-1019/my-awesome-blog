import { act, fireEvent, render, screen } from '@testing-library/react';
import ImageGenContent from '@/app/tools/image-gen/image-gen-content';
import {
  createGenTask,
  getGenAccount,
  getGenTaskStatus,
} from '@/lib/api/imageGen';

jest.mock('@/lib/api/imageGen', () => ({
  createGenTask: jest.fn(),
  getGenTaskStatus: jest.fn(),
  getGenAccount: jest.fn(),
}));

// Lightbox 依赖 useToast 与 DOM API，mock 掉避免副作用
jest.mock('@/components/ui/Lightbox', () => ({
  __esModule: true,
  default: () => <div data-testid="lightbox" />,
}));

// OSS 上传 mock（登录态上传按钮测试用）
jest.mock('@/lib/api/oss', () => ({
  uploadFile: jest.fn(),
}));
import { uploadFile } from '@/lib/api/oss';
const mockUpload = uploadFile as jest.Mock;

const mockCreateTask = createGenTask as jest.Mock;
const mockGetStatus = getGenTaskStatus as jest.Mock;
const mockGetAccount = getGenAccount as jest.Mock;

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
  fireEvent.change(screen.getByLabelText('提示词'), {
    target: { value: opts.prompt },
  });
  fireEvent.click(
    screen.getByRole('button', {
      name: opts.kind === 'video' ? '生成视频' : '生成图片',
    })
  );
  await flushPromises(); // createGenTask → start → 立即 getGenTaskStatus
};

describe('ImageGenContent · 图片/视频生成工具页', () => {
  beforeEach(() => {
    localStorage.clear();
    mockCreateTask.mockReset();
    mockGetStatus.mockReset();
    mockGetAccount.mockReset();
    mockUpload.mockReset();
    mockGetAccount.mockResolvedValue({
      remain_coins: '622',
      current_task_counts: '0',
      remain_money: '178.56',
      currency: 'CNY',
      api_type: 'SHARED',
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('渲染输入区：类型切换、提示词、尺寸预设、张数、生成按钮', () => {
    render(<ImageGenContent />);
    expect(screen.getByRole('button', { name: '图片' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '视频' })).toBeInTheDocument();
    expect(screen.getByLabelText('提示词')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '1:1 方图' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '生成图片' })
    ).toBeInTheDocument();
  });

  it('切换到视频 Tab：隐藏尺寸/张数，按钮文案变为生成视频', () => {
    render(<ImageGenContent />);
    fireEvent.click(screen.getByRole('button', { name: '视频' }));
    expect(screen.getByRole('button', { name: '视频' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(
      screen.queryByRole('button', { name: '1:1 方图' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '生成视频' })
    ).toBeInTheDocument();
  });

  it('图片生成成功 → 渲染图片网格并调用 createGenTask(type=image)', async () => {
    mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
    mockGetStatus.mockResolvedValue({
      task_id: 'task-1',
      status: 'success',
      images: [
        'https://cdn.example.com/a.png',
        'https://cdn.example.com/b.png',
      ],
      video_url: null,
      fail_reason: null,
    });

    await runGenerateFlow({ prompt: '月光下的湖泊' });

    expect(await screen.findByText('生成结果')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '查看生成图片 1' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '查看生成图片 2' })
    ).toBeInTheDocument();
    expect(mockCreateTask).toHaveBeenCalledWith({
      type: 'image',
      prompt: '月光下的湖泊',
      model: 'rhart-image-g-2-official',
      mode: 'text',
      workflow_inputs: {
        resolution: '2k',
        quality: 'medium',
        aspect_ratio: '1:1',
        count: '1',
      },
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
      mode: 'text',
      workflow_inputs: {
        aspectRatio: '16:9',
        resolution: '1080p',
        quality: 'medium',
      },
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
    expect(
      await screen.findByRole('button', { name: '生成中… 可取消' })
    ).toBeInTheDocument();

    // 点击取消 → 回到初始，无错误
    fireEvent.click(screen.getByRole('button', { name: '生成中… 可取消' }));
    expect(
      screen.getByRole('button', { name: '生成图片' })
    ).toBeInTheDocument();
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

    // 接入创作台后错误两处展示：输入卡（左列）+ 画布（右列），均带 role=alert
    const alerts = await screen.findAllByRole('alert');
    expect(alerts).toHaveLength(2);
    for (const alert of alerts) {
      expect(alert).toHaveTextContent('审核未通过');
    }
  });

  it('创建任务请求失败 → 展示错误信息', async () => {
    mockCreateTask.mockRejectedValue(new Error('生成服务未配置，请联系管理员'));

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), {
      target: { value: '测试' },
    });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    await flushPromises();

    const alerts = await screen.findAllByRole('alert');
    expect(alerts).toHaveLength(2);
    for (const alert of alerts) {
      expect(alert).toHaveTextContent('生成服务未配置');
    }
  });

  it('输入提示词后显示字数统计与清空按钮，点击清空恢复空', () => {
    render(<ImageGenContent />);
    const textarea = screen.getByLabelText('提示词');
    fireEvent.change(textarea, { target: { value: '月光' } });
    expect(screen.getByText('2/1000')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '清空提示词' }));
    expect(textarea).toHaveValue('');
    // 清空按钮卸载后焦点归还输入框
    expect(textarea).toHaveFocus();
  });

  it('空态画布显示灵感卡片，点击填入提示词', () => {
    render(<ImageGenContent />);
    // 左列示例 chips 为截断文本，画布灵感卡为完整提示词 → 用完整名称精确定位画布卡片
    fireEvent.click(
      screen.getByRole('button', {
        name: '月光下的静谧湖泊，倒映着满天繁星，雾气缭绕，超现实主义风格',
      })
    );
    // 点击后整条示例提示词填入输入框（onExampleSelect 透传完整提示词），焦点归输入框
    expect(screen.getByLabelText('提示词')).toHaveValue(
      '月光下的静谧湖泊，倒映着满天繁星，雾气缭绕，超现实主义风格'
    );
    expect(screen.getByLabelText('提示词')).toHaveFocus();
  });

  it('画布 tab 可切换到历史（空历史显示空态）并切回结果', () => {
    render(<ImageGenContent />);
    fireEvent.click(screen.getByRole('tab', { name: '历史' }));
    expect(screen.getByText('还没有生成记录')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: '结果' }));
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('生成中显示进度节点（排队阶段）', async () => {
    mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
    mockGetStatus.mockResolvedValue({
      task_id: 'task-1',
      status: 'running',
      images: [],
      video_url: null,
      fail_reason: null,
    });

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), {
      target: { value: '一只猫' },
    });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    await flushPromises();
    expect(screen.getByRole('status')).toHaveTextContent(/生成/);
  });

  it('抽屉打开后每 30 秒自动刷新账户信息', async () => {
    render(<ImageGenContent />);
    // 打开抽屉：立即加载一次
    fireEvent.click(screen.getByRole('button', { name: '打开生成记录' }));
    fireEvent.click(screen.getByRole('button', { name: '账户' }));
    await flushPromises();
    expect(mockGetAccount).toHaveBeenCalledTimes(1);
    // 快进 30s：再次刷新
    await act(async () => {
      jest.advanceTimersByTime(30_000);
      await Promise.resolve();
    });
    expect(mockGetAccount).toHaveBeenCalledTimes(2);
    // 快进 60s：累计 4 次（30s 间隔）
    await act(async () => {
      jest.advanceTimersByTime(60_000);
      await Promise.resolve();
    });
    expect(mockGetAccount).toHaveBeenCalledTimes(4);
  });

  it('账户轮询静默失败：保留上次成功数据，不闪错误态', async () => {
    render(<ImageGenContent />);
    fireEvent.click(screen.getByRole('button', { name: '打开生成记录' }));
    fireEvent.click(screen.getByRole('button', { name: '账户' }));
    // 首次加载成功（打开即加载，非静默）
    expect(await screen.findByText('622')).toBeInTheDocument();
    expect(mockGetAccount).toHaveBeenCalledTimes(1);

    // 30s 轮询请求失败：静默刷新，保留上次成功数据、不出现错误 UI
    mockGetAccount.mockRejectedValue(new Error('网络抖动'));
    await act(async () => {
      jest.advanceTimersByTime(30_000);
      await Promise.resolve();
    });
    expect(mockGetAccount).toHaveBeenCalledTimes(2);
    // 仍展示上次成功数据（未闪 loading 骨架、未切错误态）
    expect(screen.getByText('622')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('成功生成后写入持久化历史，抽屉展示并可恢复（含 kind）', async () => {
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
    fireEvent.change(screen.getByLabelText('提示词'), {
      target: { value: '第二组' },
    });
    fireEvent.click(screen.getByRole('button', { name: '生成视频' }));
    await flushPromises();
    await screen.findByText('生成结果');

    // 打开抽屉：悬浮按钮
    fireEvent.click(screen.getByRole('button', { name: '打开生成记录' }));
    expect(await screen.findByText('生成记录')).toBeInTheDocument();
    expect(screen.getByText(/共 2 条/)).toBeInTheDocument();

    // 恢复第一组：点击历史项后提示词回到「第一组」，且恢复为图片类型
    fireEvent.click(screen.getByText('第一组'));
    expect((screen.getByLabelText('提示词') as HTMLTextAreaElement).value).toBe(
      '第一组'
    );
    expect(screen.getByRole('button', { name: '图片' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // 历史已持久化到 localStorage（跨刷新保留）
    const saved = JSON.parse(
      localStorage.getItem('image_gen_history_v1') ?? '[]'
    );
    expect(saved.map((e: { prompt: string }) => e.prompt)).toEqual([
      '第二组',
      '第一组',
    ]);
  });

  it('抽屉可删除单条历史与清空全部', async () => {
    // 预置 localStorage 历史，模拟跨会话持久化
    localStorage.setItem(
      'image_gen_history_v1',
      JSON.stringify([
        {
          id: 'a1',
          createdAt: Date.now(),
          kind: 'image',
          prompt: '预置历史一',
          images: ['https://cdn.example.com/p1.png'],
          videoUrl: null,
        },
        {
          id: 'a2',
          createdAt: Date.now(),
          kind: 'video',
          prompt: '预置历史二',
          images: [],
          videoUrl: 'https://cdn.example.com/p2.mp4',
        },
      ])
    );

    render(<ImageGenContent />);
    fireEvent.click(screen.getByRole('button', { name: '打开生成记录' }));
    await screen.findByText(/共 2 条/);

    // 删除单条
    fireEvent.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(screen.getByText(/共 1 条/)).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem('image_gen_history_v1') ?? '[]')
    ).toHaveLength(1);

    // 清空全部
    fireEvent.click(screen.getByRole('button', { name: /清空/ }));
    expect(screen.getByText('还没有生成记录')).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem('image_gen_history_v1') ?? '[]')
    ).toHaveLength(0);
  });

  it('抽屉「账户」Tab 加载失败可重试，成功后展示账户信息', async () => {
    // 首次加载失败
    mockGetAccount.mockRejectedValue(new Error('生成服务调用失败'));
    render(<ImageGenContent />);
    fireEvent.click(screen.getByRole('button', { name: '打开生成记录' }));
    await screen.findByText('生成记录');

    // 打开即自动加载账户 → 失败显示错误
    fireEvent.click(screen.getByRole('button', { name: /账户/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '生成服务调用失败'
    );

    // 重试成功 → 展示账户信息
    mockGetAccount.mockResolvedValue({
      remain_coins: '622',
      current_task_counts: '0',
      remain_money: '178.56',
      currency: 'CNY',
      api_type: 'SHARED',
    });
    fireEvent.click(screen.getByRole('button', { name: /重试/ }));
    expect(await screen.findByText('622')).toBeInTheDocument();
    expect(screen.getByText('RH 币')).toBeInTheDocument();
    expect(screen.getByText('178.56 CNY')).toBeInTheDocument();
    expect(screen.getByText('SHARED')).toBeInTheDocument();
  });

  it('模型下拉默认 rhart，切 seedream 后张数禁用', () => {
    render(<ImageGenContent />);
    const select = screen.getByLabelText('模型');
    expect(select).toHaveValue('rhart-image-g-2-official');
    fireEvent.change(select, { target: { value: 'seedream-v5-pro' } });
    expect(select).toHaveValue('seedream-v5-pro');
    // seedream 档张数按钮禁用
    const count4 = screen.getByRole('button', { name: '4' });
    expect(count4).toBeDisabled();
    // 切回 rhart 恢复
    fireEvent.change(select, { target: { value: 'rhart-image-g-2-official' } });
    expect(screen.getByRole('button', { name: '4' })).not.toBeDisabled();
  });

  it('参考图：应用 URL 显示预览，生成 payload 为图生图', async () => {
    mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
    mockGetStatus.mockResolvedValue({
      task_id: 'task-1',
      status: 'success',
      images: ['https://cdn.example.com/a.png'],
      video_url: null,
      fail_reason: null,
    });

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), {
      target: { value: '改成油画风格' },
    });
    fireEvent.change(screen.getByLabelText('参考图 URL'), {
      target: { value: 'https://cdn.example.com/ref.png' },
    });
    fireEvent.click(screen.getByRole('button', { name: '应用' }));
    expect(screen.getByAltText('参考图预览')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '基于参考图生成' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '基于参考图生成' }));
    await flushPromises();
    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'image',
        mode: 'image',
        model: 'rhart-image-g-2-official',
        image_urls: ['https://cdn.example.com/ref.png'],
      })
    );
  });

  it('移除参考图后回到文生图模式', () => {
    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('参考图 URL'), {
      target: { value: 'https://cdn.example.com/ref.png' },
    });
    fireEvent.click(screen.getByRole('button', { name: '应用' }));
    fireEvent.click(screen.getByRole('button', { name: '移除参考图' }));
    expect(screen.queryByAltText('参考图预览')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '生成图片' })
    ).toBeInTheDocument();
  });

  it('登录态显示上传按钮，上传成功回填参考图', async () => {
    localStorage.setItem('auth_token', 'test-token');
    mockUpload.mockResolvedValue({
      file_url: 'https://cdn.example.com/uploaded.png',
    });

    render(<ImageGenContent />);
    const fileInput = screen.getByLabelText('上传图片');
    const file = new File(['x'], 'ref.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await flushPromises();
    expect(mockUpload).toHaveBeenCalledWith(file);
    expect(screen.getByAltText('参考图预览')).toHaveAttribute(
      'src',
      'https://cdn.example.com/uploaded.png'
    );
  });

  it('游客（无 token）不显示上传按钮', () => {
    localStorage.removeItem('auth_token');
    render(<ImageGenContent />);
    expect(screen.queryByLabelText('上传图片')).not.toBeInTheDocument();
  });

  it('seedream 模型：payload 不含 count/quality，model 生效', async () => {
    mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
    mockGetStatus.mockResolvedValue({
      task_id: 'task-1',
      status: 'success',
      images: ['https://cdn.example.com/a.png'],
      video_url: null,
      fail_reason: null,
    });

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('模型'), {
      target: { value: 'seedream-v5-pro' },
    });
    fireEvent.change(screen.getByLabelText('提示词'), {
      target: { value: '水彩风格' },
    });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    await flushPromises();
    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'image',
        model: 'seedream-v5-pro',
        mode: 'text',
        // 嵌套对象精确匹配：seedream 档不传 quality/count
        workflow_inputs: {
          resolution: '2k',
          aspect_ratio: '1:1',
        },
      })
    );
  });

  it('参考图上传失败 → 展示错误提示', async () => {
    localStorage.setItem('auth_token', 'test-token');
    mockUpload.mockRejectedValue(new Error('fail'));

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('上传图片'), {
      target: {
        files: [new File(['x'], 'ref.png', { type: 'image/png' })],
      },
    });
    await flushPromises();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '参考图上传失败，请重试或直接粘贴图片 URL'
    );
  });

  it('有参考图时模型锁定 rhart（值/禁用），张数可用', () => {
    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('模型'), {
      target: { value: 'seedream-v5-pro' },
    });
    fireEvent.change(screen.getByLabelText('参考图 URL'), {
      target: { value: 'https://cdn.example.com/ref.png' },
    });
    fireEvent.click(screen.getByRole('button', { name: '应用' }));
    const select = screen.getByLabelText('模型');
    expect(select).toBeDisabled();
    // effectiveModel 覆盖：下拉显示 rhart 而非 seedream
    expect(select).toHaveValue('rhart-image-g-2-official');
    // rhart 档张数按钮恢复可用
    expect(screen.getByRole('button', { name: '4' })).not.toBeDisabled();
  });
});
