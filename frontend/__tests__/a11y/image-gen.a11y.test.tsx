import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import ImageGenContent from '@/app/tools/image-gen/image-gen-content';
import { generateImages } from '@/lib/api/imageGen';
import { expectNoA11yViolations } from '@/test-utils/a11y';

jest.mock('@/lib/api/imageGen', () => ({
  generateImages: jest.fn(),
}));

// Lightbox 关闭时（isOpen=false）直接返回 null，其 useEffect/useToast 在 jsdom 下无副作用，
// 因此无需 mock；打开场景不在本套件覆盖范围内
const mockGenerate = generateImages as jest.Mock;

describe('图片生成页无障碍', () => {
  beforeEach(() => {
    localStorage.clear();
    mockGenerate.mockReset();
  });

  it('初始表单（提示词/尺寸/张数/生成按钮）应无严重可访问性违规', async () => {
    await expectNoA11yViolations(<ImageGenContent />);
  }, 15000);

  it('生成成功（2 张图）结果网格与会话历史应无严重可访问性违规', async () => {
    mockGenerate.mockResolvedValue({
      images: [
        { url: 'https://cdn.example.com/a.png', size: '1024x1024' },
        { url: 'https://cdn.example.com/b.png', size: '1024x1024' },
      ],
      model: 'test-model',
    });

    const { container } = render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '月光下的湖泊' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    // 生成成功会同时挂载结果网格与本次会话历史，一并扫描
    await screen.findByText('生成结果');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);

  it('生成失败（role=alert 错误提示）应无严重可访问性违规', async () => {
    mockGenerate.mockRejectedValue(new Error('模型限流'));

    const { container } = render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '失败场景' } });
    fireEvent.click(screen.getByRole('button', { name: '生成图片' }));
    await screen.findByRole('alert');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);
});
