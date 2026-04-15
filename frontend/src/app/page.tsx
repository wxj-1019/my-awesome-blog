'use client'

import HeroSection from '@/components/home/HeroSection'
import FeaturedHighlights from '@/components/home/FeaturedHighlights'
import StatsPanel from '@/components/home/StatsPanel'
import TechStack from '@/components/home/TechStack'
import ReadingStats from '@/components/home/ReadingStats'
import Timeline from '@/components/home/Timeline'
import Portfolio from '@/components/home/Portfolio'
import SubscribeCard from '@/components/home/SubscribeCard'
import ScrollProgress from '@/components/home/ScrollProgress'
import MobileDrawer from '@/components/home/MobileDrawer'
import WeatherCard from '@/components/home/WeatherCard'

// 导入装饰组件
import CursorGlow from '@/components/home/decorations/CursorGlow'
import MatrixCodeRain from '@/components/background/MatrixCodeRain'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* 全局装饰元素 */}
      <MatrixCodeRain />
      <CursorGlow />
      
      <ScrollProgress />
      <MobileDrawer />
      <WeatherCard />

      <div id="content" className="relative z-10">
        {/* Hero 区域 - 全屏高度，无上下间距 */}
        <HeroSection />

        {/* 精选推荐 - 紧凑入场 */}
        <section id="featured-highlights" className="relative py-16 sm:py-20 lg:py-24">
          <FeaturedHighlights />
        </section>

        {/* 统计面板 - 标准区块间距 */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <StatsPanel />
          </div>
        </section>

        {/* 技术栈 - 标准区块间距 */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <TechStack />
          </div>
        </section>

        {/* 阅读统计 - 标准区块间距 */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ReadingStats />
          </div>
        </section>

        {/* 时间线 - 带间距的区块 */}
        <section className="py-16 sm:py-20 lg:py-24">
          <Timeline />
        </section>

        {/* 订阅卡片 - 底部区块 */}
        <section className="py-16 sm:py-20 lg:py-24">
          <SubscribeCard />
        </section>
      </div>
    </div>
  )
}
