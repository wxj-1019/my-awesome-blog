import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import TarotContent from '@/app/tools/tarot/tarot-content';
import { expectNoA11yViolations } from '@/test-utils/a11y';

// jsdom 未实现 scrollIntoView（解读完成自动滚动），桩掉避免报错
Element.prototype.scrollIntoView = jest.fn();

// jsdom 无 IntersectionObserver，列表项靠它判断是否渲染。
// 同步回调 intersecting，让内容立即可达，axe 才能扫到。
class FakeIO {
  cb: (entries: { isIntersecting: boolean }[]) => void;
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
    this.cb = cb;
  }
  observe = () => {
    this.cb([{ isIntersecting: true }]);
  };
  disconnect = jest.fn();
  unobserve = jest.fn();
  takeRecords = jest.fn();
}

describe('塔罗页无障碍', () => {
  beforeEach(() => {
    globalThis.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    localStorage.clear();
  });

  afterEach(() => {
    // @ts-expect-error 测试结束后清掉全局桩
    delete globalThis.IntersectionObserver;
  });

  // axe 全页扫描耗时 ~5s（默认 5s 超时贴边）：进程条等页面元素增加后，
  // 并行跑全套件时偶发超时（"Exceeded timeout"），放宽到 15s 消抖
  it('占卜问牌阶段应无严重可访问性违规', async () => {
    await expectNoA11yViolations(<TarotContent />);
  }, 15000);

  it('牌义速查视图应无严重可访问性违规', async () => {
    const { container } = render(<TarotContent />);
    fireEvent.click(screen.getByRole('tab', { name: /牌义速查/ }));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);

  it('牌义条目展开后应无严重可访问性违规', async () => {
    const { container } = render(<TarotContent />);
    fireEvent.click(screen.getByRole('tab', { name: /牌义速查/ }));
    fireEvent.click(screen.getByRole('button', { name: '愚者 详情' }));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);
});
