'use client'

import HeroSection from '@/components/home/HeroSection'
import FeaturedHighlights from '@/components/home/FeaturedHighlights'
import StatsPanel from '@/components/home/StatsPanel'
import TechStack from '@/components/home/TechStack'
import ReadingStats from '@/components/home/ReadingStats'
import Timeline from '@/components/home/Timeline'
import SubscribeCard from '@/components/home/SubscribeCard'
import ScrollProgress from '@/components/home/ScrollProgress'
import MobileDrawer from '@/components/home/MobileDrawer'
import WeatherCard from '@/components/home/WeatherCard'
import MatrixCodeRain from '@/components/background/MatrixCodeRain'
import CursorGlow from '@/components/home/decorations/CursorGlow'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MatrixCodeRain />
      <CursorGlow />
      <ScrollProgress />
      <MobileDrawer />
      <WeatherCard />

      <div id="content" className="relative z-10 bg-background">
        <HeroSection />

        <section id="featured-highlights" className="bg-background">
          <FeaturedHighlights />
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-background">
          <StatsPanel />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-background">
          <TechStack />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-background">
          <ReadingStats />
        </div>

        <Timeline />

        <SubscribeCard />
      </div>
    </div>
  )
}
