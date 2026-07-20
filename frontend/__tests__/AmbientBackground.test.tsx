import { render } from '@testing-library/react';
import AmbientBackground from '@/components/visual/AmbientBackground';

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

describe('AmbientBackground · 全局环境背景', () => {
  beforeEach(() => {
    bubbleFieldMock.mockClear();
  });

  it('renders fixed decorative layer with gradient base, two glows and noise', () => {
    const { container } = render(<AmbientBackground />);

    const root = container.querySelector('[data-ambient-background]');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveClass('pointer-events-none', 'fixed', '-z-10');

    expect(container.querySelector('.ambient-glow-a')).toBeInTheDocument();
    expect(container.querySelector('.ambient-glow-b')).toBeInTheDocument();
  });

  it('renders sparse ambient bubbles without highlights', () => {
    render(<AmbientBackground />);

    expect(bubbleFieldMock).toHaveBeenCalled();
    const props = bubbleFieldMock.mock.calls[0][0];
    // jsdom matchMedia mock 恒为 false → 走移动端数量
    expect(props.count).toBe(3);
    expect(props.withHighlight).toBe(false);
  });
});
