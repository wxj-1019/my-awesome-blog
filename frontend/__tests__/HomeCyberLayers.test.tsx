import { render, screen, waitFor } from '@testing-library/react'
import TechStack from '@/components/home/TechStack'
import ReadingStats from '@/components/home/ReadingStats'
import Timeline from '@/components/home/Timeline'
import SubscribeCard from '@/components/home/SubscribeCard'
import { ThemeProvider } from '@/context/theme-context'
import { LoadingProvider } from '@/context/loading-context'

jest.mock('@/components/ui/LogoLoop', () => ({
  __esModule: true,
  default: () => <div data-testid="logo-loop" />,
}))

jest.mock('@/services/timelineService', () => ({
  timelineService: {
    getTimelineEvents: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('@/services/subscriptionService', () => ({
  subscriptionService: {
    createSubscription: jest.fn(),
  },
}))

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock('@/components/home/decorations/ScrollReveal', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Homepage cyber visual layers', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider>
        <LoadingProvider>{ui}</LoadingProvider>
      </ThemeProvider>
    )
  }

  it('renders the tech orbital layer', () => {
    renderWithProviders(<TechStack />)

    expect(screen.getByTestId('tech-orbital-layer')).toBeInTheDocument()
  })

  it('renders the reading cockpit layer', () => {
    renderWithProviders(<ReadingStats />)

    expect(screen.getByTestId('reading-cockpit-layer')).toBeInTheDocument()
  })

  it('renders the timeline route layer', async () => {
    renderWithProviders(<Timeline />)

    expect(screen.getByTestId('timeline-route-layer')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByLabelText('时间线加载中')).not.toBeInTheDocument()
    })
  })

  it('renders the subscribe immersive band layer', () => {
    renderWithProviders(<SubscribeCard />)

    expect(screen.getByTestId('subscribe-band-layer')).toBeInTheDocument()
  })
})
