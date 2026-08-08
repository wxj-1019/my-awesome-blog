import { render } from '@testing-library/react';
import DiveTransition from '@/components/home/narrative/DiveTransition';

describe('DiveTransition · 薄渐变色带过渡', () => {
  it('渲染三层渐变色带（surface/mid/deep）', () => {
    const { container } = render(<DiveTransition />);

    const root = container.querySelector('[data-dive-root]');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-hidden', 'true');

    expect(container.querySelector('[data-dive-band="surface"]')).toBeInTheDocument();
    expect(container.querySelector('[data-dive-band="mid"]')).toBeInTheDocument();
    expect(container.querySelector('[data-dive-band="deep"]')).toBeInTheDocument();
  });

  it('不渲染折光线/光柱/气泡（已移除）', () => {
    const { container } = render(<DiveTransition />);

    expect(container.querySelector('[data-dive-shimmer]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-dive-lightshaft]')).not.toBeInTheDocument();
  });

  it('高度为薄渐变条（h-24 / sm:h-32）', () => {
    const { container } = render(<DiveTransition />);
    const root = container.querySelector('[data-dive-root]');
    expect(root?.className).toContain('h-24');
    expect(root?.className).toContain('sm:h-32');
  });
});
