'use client'

import HeroSection from '@/components/home/HeroSection'
import FeaturedHighlights from '@/components/home/FeaturedHighlights'
import StatsPanel from '@/components/home/StatsPanel'
import TechStack from '@/components/home/TechStack'
import ReadingStats from '@/components/home/ReadingStats'
import Timeline from '@/components/home/Timeline'
import ScrollProgress from '@/components/home/ScrollProgress'
import MobileDrawer from '@/components/home/MobileDrawer'
import WeatherCard from '@/components/home/WeatherCard'
import CursorGlow from '@/components/home/decorations/CursorGlow'
import {
  DiveTransition,
  HomeActSection,
  HOME_GLOW,
  ShoreBeacon,
} from '@/components/home/narrative'

/**
 * 首页 · 深海 × 电影
 * 片头 → 入水 → 分幕 → 港口航标收束（无订阅）。
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <CursorGlow color={HOME_GLOW.color} size={HOME_GLOW.size} />
      <ScrollProgress />
      <MobileDrawer />
      <WeatherCard />

      <div id="content" className="relative z-10 bg-background">
        <HeroSection />
        <DiveTransition />

        <HomeActSection
          id="act-gallery"
          actLabel="第一幕 · 展厅"
          description="从浪线之下开始，拾起值得停留的篇章"
          contained={false}
        >
          <FeaturedHighlights />
        </HomeActSection>

        <HomeActSection
          id="act-console"
          actLabel="第二幕 · 仪表"
          description="航行读数与舱内工具"
          contained={false}
        >
          <StatsPanel />
          <TechStack />
        </HomeActSection>

        <HomeActSection
          id="act-trail"
          actLabel="第三幕 · 航迹"
          description="公开阅读与发布的数据航迹"
          contained={false}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <ReadingStats />
          </div>
        </HomeActSection>

        <HomeActSection
          id="act-current"
          actLabel="第三幕 · 洋流"
          description="历程随潮汐展开"
          contained={false}
        >
          <Timeline />
        </HomeActSection>

        <HomeActSection
          id="act-shore"
          actLabel="第四幕 · 靠岸"
          description="航标已亮，下一段航程任选"
          className="pb-8 sm:pb-12"
        >
          {/* contained 默认 true：由 Act 提供 container，ShoreBeacon 不再套一层 */}
          <ShoreBeacon />
        </HomeActSection>
      </div>
    </div>
  )
}
