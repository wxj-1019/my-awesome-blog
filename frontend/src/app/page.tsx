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
        {/* Hero 区域 - 保持原有动画 */}
        <HeroSection />

        {/* 精选推荐 - 增强动画 */}
        <section id="featured-highlights" className="relative">
          <FeaturedHighlights />
        </section>

        {/* 统计面板 - 入场动画 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <StatsPanel />
        </div>

        {/* 技术栈 - 视差滚动 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <TechStack />
        </div>

        {/* 阅读统计 - 标签切换动画 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <ReadingStats />
        </div>

        {/* 时间线 - 滚动触发动画 */}
        <Timeline />

        {/* 订阅卡片 - 粒子背景 */}
        <SubscribeCard />
      </div>
    </div>
  )
}
