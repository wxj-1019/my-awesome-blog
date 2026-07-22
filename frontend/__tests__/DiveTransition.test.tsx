import { render } from '@testing-library/react';
import DiveTransition from '@/components/home/narrative/DiveTransition';

// 结构断言不需要真实 GSAP；useGSAP 置空即可
jest.mock('@gsap/react', () => ({
  useGSAP: jest.fn(),
}));

// 捕获 BubbleField 的 props，并避免其内部 IntersectionObserver 逻辑
const bubbleFieldMock = jest.fn(
  (_props: { count?: number; withHighlight?: boolean }) => (
    <div data-testid="bubble-field" />
  )
);
jest.mock('@/components/home/BubbleField', () => ({
  __esModule: true,
  default: (props: { count?: number; withHighlight?: boolean }) =>
    bubbleFieldMock(props),
}));

describe('DiveTransition · 多层入水装置', () => {
  beforeEach(() => {
    bubbleFieldMock.mockClear();
  });

  it('renders three color bands, shimmer lines and light shaft', () => {
    const { container } = render(<DiveTransition />);

    const root = container.querySelector('[data-dive-root]');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-hidden', 'true');

    expect(container.querySelector('[data-dive-band="surface"]')).toBeInTheDocument();
    expect(container.querySelector('[data-dive-band="mid"]')).toBeInTheDocument();
    expect(container.querySelector('[data-dive-band="deep"]')).toBeInTheDocument();

    expect(
      container.querySelector('[data-dive-shimmer="primary"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-dive-shimmer="secondary"]')
    ).toBeInTheDocument();

    expect(container.querySelector('[data-dive-lightshaft]')).toBeInTheDocument();
  });

  it('renders sparse underwater bubbles without highlights', () => {
    render(<DiveTransition />);

    expect(bubbleFieldMock).toHaveBeenCalled();
    const props = bubbleFieldMock.mock.calls[0][0];
    // jsdom matchMedia mock 恒为 false → 走移动端数量（HOME_BUBBLE_COUNT_UNDERWATER.mobile）
    expect(props.count).toBe(2);
    expect(props.withHighlight).toBe(false);
  });
});
