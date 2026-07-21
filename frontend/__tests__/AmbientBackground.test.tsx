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

  it('renders fixed decorative layer with theme scene layers', () => {
    const { container } = render(<AmbientBackground />);

    const root = container.querySelector('[data-ambient-background]');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveClass('pointer-events-none', 'fixed', '-z-10');

    // 双主题层均常驻 DOM，由 CSS 按 html.light/.dark 切换显示
    expect(container.querySelector('.ambient-layer-light')).toBeInTheDocument();
    expect(container.querySelector('.ambient-layer-dark')).toBeInTheDocument();

    // 浅色 · 林间晨光：光柱 ×4 + bokeh ×3 + 光尘（移动端预算 8）
    expect(container.querySelector('.ambient-shaft-a')).toBeInTheDocument();
    expect(container.querySelector('.ambient-shaft-b')).toBeInTheDocument();
    expect(container.querySelector('.ambient-shaft-c')).toBeInTheDocument();
    expect(container.querySelector('.ambient-shaft-d')).toBeInTheDocument();
    expect(container.querySelectorAll('.ambient-bokeh-a, .ambient-bokeh-b, .ambient-bokeh-c')).toHaveLength(3);
    expect(container.querySelectorAll('.ambient-mote-dot')).toHaveLength(8);

    // 深色 · 月夜云海：月亮、云海 ×3、星空（移动端预算 12）、流星、萤火虫（移动端预算 6）
    expect(container.querySelector('[data-moon]')).toBeInTheDocument();
    expect(container.querySelectorAll('.ambient-cloud-sea')).toHaveLength(3);
    expect(container.querySelectorAll('.ambient-star-dot')).toHaveLength(12);
    expect(container.querySelector('[data-meteor]')).toBeInTheDocument();
    expect(container.querySelectorAll('.ambient-firefly-dot')).toHaveLength(6);
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
