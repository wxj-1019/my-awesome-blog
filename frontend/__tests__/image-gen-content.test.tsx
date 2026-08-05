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

  it('未登录点击生成 → 显示登录引导，不发起请求', () => {
    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '一只猫' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));

    expect(screen.getByText('图片生成需要登录后使用。')).toBeInTheDocument();
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('已登录生成成功 → 渲染图片网格', async () => {
    localStorage.setItem('auth_token', 'test-token');
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
      expect.objectContaining({ prompt: '月光下的湖泊', size: '1024x1024', count: 1 })
    );
  });

  it('生成失败 → 展示错误信息', async () => {
    localStorage.setItem('auth_token', 'test-token');
    mockGenerate.mockRejectedValue(new Error('图片生成失败（HTTP 400）'));

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '测试' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));

    expect(await screen.findByText('图片生成失败（HTTP 400）')).toBeInTheDocument();
  });

  it('401 错误 → 转为登录引导', async () => {
    localStorage.setItem('auth_token', 'expired');
    mockGenerate.mockRejectedValue(new Error('请求失败: 401 (Unauthorized)'));

    render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '测试' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));

    expect(await screen.findByText('图片生成需要登录后使用。')).toBeInTheDocument();
  });

  it('点击示例提示词快捷填充', () => {
    render(<ImageGenContent />);
    const example = screen.getAllByRole('button').find((b) => b.textContent?.includes('月光下的静谧湖泊'));
    expect(example).toBeDefined();
    fireEvent.click(example!);
    expect((screen.getByLabelText('提示词') as HTMLTextAreaElement).value).toContain('月光下的静谧湖泊');
  });
});
