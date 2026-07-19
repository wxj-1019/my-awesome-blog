import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { ThemeProvider } from '@/context/theme-context';
import { LoadingProvider } from '@/context/loading-context';

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

jest.mock('@/components/home/HeroSection', () => ({
  __esModule: true,
  default: () => <section aria-label="hero">Hero</section>,
}));

jest.mock('@/components/home/FeaturedHighlights', () => ({
  __esModule: true,
  default: () => (
    <section aria-label="featured-highlights">
      <div data-testid="featured-reel">Featured Reel</div>
    </section>
  ),
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

jest.mock('@/components/home/narrative/ShoreBeacon', () => ({
  __esModule: true,
  default: () => <section aria-label="港口航标" data-testid="shore-beacon">Shore Beacon</section>,
}));

jest.mock('@/components/home/narrative/DiveTransition', () => ({
  __esModule: true,
  default: () => <div data-testid="dive-transition" aria-hidden="true" />,
}));

const HomeWithProvider = () => (
  <ThemeProvider>
    <LoadingProvider>
      <Home />
    </LoadingProvider>
  </ThemeProvider>
);

describe('Home Page', () => {
  it('renders Chinese act labels and page sections in narrative order', () => {
    render(<HomeWithProvider />);

    expect(screen.getByText('第一幕 · 展厅')).toBeInTheDocument();
    expect(screen.getByText('第二幕 · 仪表')).toBeInTheDocument();
    expect(screen.getByText('第三幕 · 航迹')).toBeInTheDocument();
    expect(screen.getByText('第三幕 · 洋流')).toBeInTheDocument();
    expect(screen.getByText('第四幕 · 靠岸')).toBeInTheDocument();

    const sections = screen.getAllByRole('region');
    const labels = sections.map((section) => section.getAttribute('aria-label'));

    expect(labels).toEqual([
      'hero',
      'featured-highlights',
      'stats-panel',
      'tech-stack',
      'reading-stats',
      'timeline',
      '港口航标',
    ]);
  });

  it('renders homepage decorations without matrix rain or email subscribe UI', () => {
    render(<HomeWithProvider />);

    expect(screen.queryByTestId('matrix-code-rain')).not.toBeInTheDocument();
    expect(screen.queryByTestId('subscribe-band-layer')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /订阅/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('cursor-glow')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-progress')).toBeInTheDocument();
    expect(screen.getByTestId('dive-transition')).toBeInTheDocument();
    expect(screen.getByTestId('shore-beacon')).toBeInTheDocument();
  });

  it('renders featured film reel shell in act gallery', () => {
    render(<HomeWithProvider />);
    expect(screen.getByTestId('featured-reel')).toBeInTheDocument();
  });
});
