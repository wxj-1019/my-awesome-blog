import { render, screen, waitFor } from '@testing-library/react'
import FeaturedHighlights from '@/components/home/FeaturedHighlights'
import { getPopularArticles } from '@/services/articleService'

jest.mock('@/services/articleService', () => ({
  getPopularArticles: jest.fn(),
}))

jest.mock('@/components/home/decorations/ScrollReveal', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockArticles = Array.from({ length: 4 }, (_, index) => ({
  id: `article-${index + 1}`,
  title: `文章 ${index + 1}`,
  content: '这是一段用于计算阅读时间的文章内容。'.repeat(12),
  excerpt: `文章 ${index + 1} 摘要`,
  view_count: 1000 + index * 100,
  likes_count: 80 + index,
  comments_count: 10 + index,
  category_id: '前端开发',
}))

describe('FeaturedHighlights', () => {
  beforeEach(() => {
    ;(getPopularArticles as jest.Mock).mockResolvedValue(mockArticles)
  })

  it('renders a hero highlight card followed by satellite cards', async () => {
    render(<FeaturedHighlights />)

    await waitFor(() => {
      expect(screen.getByTestId('featured-hero-card')).toBeInTheDocument()
    })

    expect(screen.getByTestId('featured-hero-card')).toHaveTextContent('文章 1')
    expect(screen.getAllByTestId('featured-satellite-card')).toHaveLength(3)
    expect(getPopularArticles).toHaveBeenCalledWith(6)
  })
})
