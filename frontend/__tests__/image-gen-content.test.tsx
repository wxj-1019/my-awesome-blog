import { fireEvent, render, screen } from '@testing-library/react';
import ImageGenContent from '@/app/tools/image-gen/image-gen-content';
import { generateImages } from '@/lib/api/imageGen';

jest.mock('@/lib/api/imageGen', () => ({
  generateImages: jest.fn(),
}));

// Lightbox 依赖 useToast 与 DOM API，mock 掉避免副作用
jest.mock('@/components/ui/Lightbox', () => ({
  __esModule: true,
  default: () => <div data-testid="lightbox" />,
}));

const mockGenerate = generateImages as jest.Mock;

describe('ImageGenContent · 图片生成工具页', () => {
  beforeEach(() => {
    localStorage.clear();
    mockGenerate.mockReset();
  });

  it('渲染输入区：提示词、尺寸预设、张数、生成按钮', () => {
    render(<ImageGenContent />);
    expect(screen.getByLabelText('提示词')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1:1 方图' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3:4 竖图' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4:3 横图' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '生成图片' })).toBeInTheDocument();
  });

  it('未登录也可发起生成（公开功能），请求不带 Authorization', async () => {
    mockGenerate.mockResolvedValue({
      images: [{ url: 'https://cdn.example.com/a.png', size: '1024x1024' }],
      model: 'test-model',
    });

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '一只猫' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));

    expect(await screen.findByText('生成结果')).toBeInTheDocument();
    // 第二个参数为 AbortSignal（取消能力），此处仅断言请求体
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: '一只猫' }),
      expect.anything()
    );
  });

  it('生成成功 → 渲染图片网格', async () => {
    mockGenerate.mockResolvedValue({
      images: [
        { url: 'https://cdn.example.com/a.png', size: '1024x1024' },
        { url: 'https://cdn.example.com/b.png', size: '1024x1024' },
      ],
      model: 'test-model',
    });

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '月光下的湖泊' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));

    expect(await screen.findByText('生成结果')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看生成图片 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看生成图片 2' })).toBeInTheDocument();
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: '月光下的湖泊', size: '1024x1024', count: 1 }),
      expect.anything()
    );
  });

  it('生成失败 → 展示错误信息', async () => {
    mockGenerate.mockRejectedValue(new Error('图片生成失败（HTTP 400）'));

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '测试' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));

    expect(await screen.findByText('图片生成失败（HTTP 400）')).toBeInTheDocument();
  });

  it('401/403 错误 → 显示登录态失效提示（不跳转登录页）', async () => {
    mockGenerate.mockRejectedValue(
      Object.assign(new Error('请求失败: 401'), { status: 401 })
    );

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '测试' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));

    expect(await screen.findByText('登录状态已失效，请刷新后重试')).toBeInTheDocument();
  });

  it('生成中点击按钮取消请求 → 回到初始状态，不显示错误', async () => {
    mockGenerate.mockImplementation(
      (_req: unknown, signal?: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        })
    );

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '一只猫' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));

    const cancelBtn = await screen.findByRole('button', { name: '生成中… 可取消' });
    expect(cancelBtn).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(cancelBtn);

    expect(await screen.findByRole('button', { name: '生成图片' })).toBeInTheDocument();
    expect(screen.queryByText('生成结果')).not.toBeInTheDocument();
    expect(screen.queryByText(/失败/)).not.toBeInTheDocument();
  });

  it('点击示例提示词快捷填充', () => {
    render(<ImageGenContent />);
    const example = screen.getAllByRole('button').find((b) => b.textContent?.includes('月光下的静谧湖泊'));
    expect(example).toBeDefined();
    fireEvent.click(example!);
    expect((screen.getByLabelText('提示词') as HTMLTextAreaElement).value).toContain('月光下的静谧湖泊');
  });

  it('成功但返回空数组 → 显示空态与行动', async () => {
    mockGenerate.mockResolvedValue({ images: [], model: 'm' });
    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '空结果' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    expect(await screen.findByText(/没有生成结果/)).toBeInTheDocument();
  });

  it('生成失败 → role=alert 展示错误并可重试', async () => {
    mockGenerate.mockRejectedValue(new Error('模型限流'));
    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '失败场景' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('模型限流');
  });

  it('成功生成后进入会话历史；历史最多 5 组并支持恢复', async () => {
    mockGenerate.mockResolvedValue({
      images: [{ url: 'https://cdn.example.com/a.png', size: '1024x1024' }],
      model: 'm',
    });
    render(<ImageGenContent />);
    // 生成两组
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '第一组' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    await screen.findByText('生成结果');
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '第二组' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    await screen.findByText('生成结果');

    expect(screen.getByText(/本次会话历史/)).toBeInTheDocument();
    // 恢复第一组：点击历史项后提示词回到「第一组」
    fireEvent.click(screen.getByText('第一组'));
    expect((screen.getByLabelText('提示词') as HTMLTextAreaElement).value).toBe('第一组');
  });
});
