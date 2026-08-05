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

/** 驱动真实状态机到「揭示阶段且已翻开一张牌」，返回 container 供 axe 扫描。
 *  用真实计时器 + findBy* 等待阶段切换（framer-motion 动画需真实 rAF/计时器，
 *  与 tarot-content.test.tsx 分享弹层测试同款做法）；axe 扫描在状态稳定后同步执行。 */
async function driveToRevealed() {
  const { container } = render(<TarotContent />);
  fireEvent.click(screen.getByText('开始占卜'));
  // 洗牌动画（900ms）结束后进入切牌
  await screen.findByText('点击切牌', undefined, { timeout: 5000 });
  fireEvent.click(screen.getByText('点击切牌'));
  // 切牌动画（800ms）结束后进入扇形抽牌
  await screen.findByRole('group', { name: /牌堆/ }, { timeout: 5000 });
  // 默认单张牌阵：点选第一张牌背，420ms 后进入揭示阶段
  fireEvent.click(screen.getAllByRole('button', { name: /抽取一张牌/ })[0]);
  // 翻牌按钮（SpreadSlots → TarotFlipCard 的透明点击层，aria-label「翻开「指引」的牌」；
  // 不能用 /翻开/ 宽匹配，会同时命中「全部翻开」按钮）
  await screen.findByRole('button', { name: /翻开「/ }, { timeout: 5000 });
  fireEvent.click(screen.getByRole('button', { name: /翻开「/ }));
  return container;
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

  it('揭示阶段（已翻开一张牌）应无严重可访问性违规', async () => {
    // 翻牌后解读面板/统计/历史同时挂载，随揭示状态一并扫描
    const container = await driveToRevealed();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);

  it('解读面板（AI 解读按钮可见）应无严重可访问性违规', async () => {
    const container = await driveToRevealed();
    await screen.findByRole('button', { name: '开始解读' });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);

  it('分享牌阵弹层打开时应无严重可访问性违规', async () => {
    const container = await driveToRevealed();
    fireEvent.click(screen.getByRole('button', { name: '分享牌阵' }));
    await screen.findByRole('dialog', { name: '分享牌阵' });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);
});
