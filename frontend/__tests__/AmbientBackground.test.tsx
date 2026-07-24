import { render } from '@testing-library/react';
import AmbientBackground from '@/components/visual/AmbientBackground';

const useThemeMock = jest.fn(() => ({
  theme: 'dark' as 'dark' | 'light',
  setTheme: jest.fn(),
  resolvedTheme: 'dark' as 'dark' | 'light',
  isMounted: true,
}));

jest.mock('@/context/theme-context', () => ({
  useTheme: () => useThemeMock(),
}));

describe('AmbientBackground · 贴合 Hero 双场景', () => {
  beforeEach(() => {
    useThemeMock.mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
      isMounted: true,
    });
  });

  it('renders deep-space canvas when dark', () => {
    const { container } = render(<AmbientBackground />);
    expect(container.querySelector('[data-ambient-mode="dark"]')).toBeInTheDocument();
    expect(container.querySelector('[data-ambient-world="dark"]')).toBeInTheDocument();
    expect(container.querySelector('[data-ambient-world="light"]')).not.toBeInTheDocument();
    // 深空 canvas 渲染（替代原月夜云海 DOM 拼装）
    expect(container.querySelector('[data-ambient-world="dark"] canvas')).toBeInTheDocument();
    // 旧的月夜云海元素已移除
    expect(container.querySelector('[data-moon]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-meteor]')).not.toBeInTheDocument();
    expect(container.querySelector('.star-twinkle')).not.toBeInTheDocument();
    // 全站层不挂气泡
    expect(container.querySelector('[data-testid="bubble-field"]')).not.toBeInTheDocument();
  });

  it('renders dawn forest world when light', () => {
    useThemeMock.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
      isMounted: true,
    });
    const { container } = render(<AmbientBackground />);
    expect(container.querySelector('[data-ambient-mode="light"]')).toBeInTheDocument();
    expect(container.querySelector('[data-ambient-world="light"]')).toBeInTheDocument();
    expect(container.querySelector('[data-ambient-world="dark"]')).not.toBeInTheDocument();
    // 林间晨光：旭日、林隙光柱、冷杉林剪影 ×2、鹿剪影、落叶 ×3
    expect(container.querySelector('[data-sun]')).toBeInTheDocument();
    expect(container.querySelector('.shaft-sway-a')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-treeline]')).toHaveLength(2);
    expect(container.querySelector('[data-deer]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-leaf]')).toHaveLength(3);
  });
});
