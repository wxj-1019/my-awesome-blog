import { render, screen } from '@testing-library/react'
import FeaturedHighlights from '@/components/home/FeaturedHighlights'

jest.mock('@/components/home/decorations/ScrollReveal', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('FeaturedHighlights', () => {
  it('renders an explicit empty state while featured content is unavailable', () => {
    render(<FeaturedHighlights />)

    expect(screen.getByText('暂无精选文章')).toBeInTheDocument()
  })
})
