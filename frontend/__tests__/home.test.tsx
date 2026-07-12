import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { ThemeProvider } from '@/context/theme-context';
import { LoadingProvider } from '@/context/loading-context';

// 全局装饰与浮动组件：避免在 Node 环境中渲染 canvas/动画/发起请求
jest.mock('@/components/background/MatrixCodeRain', () => ({
  __esModule: true,
  default: () => <div data-testid="matrix-code-rain" aria-hidden="true" />,
}));

jest.mock('@/components/home/decorations/CursorGlow', () => ({
  __esModule: true,
  default: () => <div data-testid="cursor-glow" aria-hidden="true" />,
}));

jest.mock('@/components/home/ScrollProgress', () => ({
  __esModule: true,
  default: () => <div data-testid="scroll-progress" />,
}));

jest.mock('@/components/home/MobileDrawer', () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-drawer" />,
}));

jest.mock('@/components/home/WeatherCard', () => ({
  __esModule: true,
  default: () => <div data-testid="weather-card" />,
}));

// 页面级区块组件：只保留可识别的 section 外壳，用于断言渲染顺序
jest.mock('@/components/home/HeroSection', () => ({
  __esModule: true,
  default: () => <section aria-label="hero">Hero</section>,
}));

jest.mock('@/components/home/FeaturedHighlights', () => ({
  __esModule: true,
  default: () => <section aria-label="featured-highlights">Featured Highlights</section>,
}));

jest.mock('@/components/home/StatsPanel', () => ({
  __esModule: true,
  default: () => <section aria-label="stats-panel">Stats Panel</section>,
}));

jest.mock('@/components/home/TechStack', () => ({
  __esModule: true,
  default: () => <section aria-label="tech-stack">Tech Stack</section>,
}));

jest.mock('@/components/home/ReadingStats', () => ({
  __esModule: true,
  default: () => <section aria-label="reading-stats">Reading Stats</section>,
}));

jest.mock('@/components/home/Timeline', () => ({
  __esModule: true,
  default: () => <section aria-label="timeline">Timeline</section>,
}));

jest.mock('@/components/home/SubscribeCard', () => ({
  __esModule: true,
  default: () => <section aria-label="subscribe-card">Subscribe Card</section>,
}));

const HomeWithProvider = () => (
  <ThemeProvider>
    <LoadingProvider>
      <Home />
    </LoadingProvider>
  </ThemeProvider>
);

describe('Home Page', () => {
  it('renders page sections in the correct order', () => {
    render(<HomeWithProvider />);

    const sections = screen.getAllByRole('region');
    const labels = sections.map((section) => section.getAttribute('aria-label'));

    expect(labels).toEqual([
      'hero',
      'home-visual-bridge',
      'featured-highlights',
      'stats-panel',
      'tech-stack',
      'reading-stats',
      'timeline',
      'subscribe-card',
    ]);
  });

  it('renders homepage background decorations', () => {
    render(<HomeWithProvider />);

    expect(screen.getByTestId('matrix-code-rain')).toBeInTheDocument();
    expect(screen.getByTestId('cursor-glow')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-progress')).toBeInTheDocument();
  });
});
