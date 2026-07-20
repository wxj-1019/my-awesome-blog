import { render, screen, waitFor } from '@testing-library/react'
import FeaturedHighlights from '@/components/home/FeaturedHighlights'
import { getFeaturedArticles, getPopularArticles } from '@/services/articleService'

jest.mock('@/services/articleService', () => ({
  getFeaturedArticles: jest.fn(),
  getPopularArticles: jest.fn(),
}))

jest.mock('@/components/motion', () => ({
  BlurIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Stagger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HoverLift: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockArticles = Array.from({ length: 4 }, (_, index) => ({
  id: `article-${index + 1}`,
  title: `文章 ${index + 1}`,
  content: '内容正文用于摘要回退。'.repeat(8),
  excerpt: `文章 ${index + 1} 摘要`,
  view_count: 1000 + index * 100,
  likes_count: 80 + index,
  comments_count: 10 + index,
  read_time: 5 + index,
  categories: [{ id: 'c1', name: '前端开发', slug: 'frontend' }],
}))

describe('FeaturedHighlights', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders empty state when no featured or popular articles', async () => {
    ;(getFeaturedArticles as jest.Mock).mockResolvedValue([])
    ;(getPopularArticles as jest.Mock).mockResolvedValue([])

    render(<FeaturedHighlights />)

    await waitFor(() => {
      expect(screen.getByText('暂无精选文章')).toBeInTheDocument()
    })
    expect(getFeaturedArticles).toHaveBeenCalledWith(6)
    expect(getPopularArticles).toHaveBeenCalledWith(6)
  })

  it('renders hero and satellite cards from featured API', async () => {
    ;(getFeaturedArticles as jest.Mock).mockResolvedValue(mockArticles)
    ;(getPopularArticles as jest.Mock).mockResolvedValue([])

    render(<FeaturedHighlights />)

    await waitFor(() => {
      expect(screen.getByTestId('featured-hero-card')).toBeInTheDocument()
    })

    expect(screen.getByTestId('featured-hero-card')).toHaveTextContent('文章 1')
    expect(screen.getAllByTestId('featured-reel-card')).toHaveLength(3)
    expect(getPopularArticles).not.toHaveBeenCalled()
  })

  it('falls back to popular articles when featured is empty', async () => {
    ;(getFeaturedArticles as jest.Mock).mockResolvedValue([])
    ;(getPopularArticles as jest.Mock).mockResolvedValue(mockArticles)

    render(<FeaturedHighlights />)

    await waitFor(() => {
      expect(screen.getByTestId('featured-hero-card')).toHaveTextContent('文章 1')
    })
    expect(getPopularArticles).toHaveBeenCalledWith(6)
  })
})
