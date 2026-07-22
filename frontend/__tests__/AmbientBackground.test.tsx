import { render } from '@testing-library/react';
import AmbientBackground from '@/components/visual/AmbientBackground';

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
    bubbleFieldMock.mockClear();
    useThemeMock.mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
      isMounted: true,
    });
  });

  it('renders moonlit world when dark', () => {
    const { container } = render(<AmbientBackground />);
    expect(container.querySelector('[data-ambient-mode="dark"]')).toBeInTheDocument();
    expect(container.querySelector('[data-ambient-world="dark"]')).toBeInTheDocument();
    expect(container.querySelector('[data-ambient-world="light"]')).not.toBeInTheDocument();
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
  });
});
