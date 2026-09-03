'use client';

import dynamic from 'next/dynamic';

import HeroSection from '@/components/home/HeroSection';
import FeaturedHighlights from '@/components/home/FeaturedHighlights';
import StatsPanel from '@/components/home/StatsPanel';
import TechStack from '@/components/home/TechStack';
import Timeline from '@/components/home/Timeline';
import ScrollProgress from '@/components/home/ScrollProgress';
import MobileDrawer from '@/components/home/MobileDrawer';
import WeatherCard from '@/components/home/WeatherCard';
import CursorGlow from '@/components/home/decorations/CursorGlow';
import {
  DiveTransition,
  HomeActSection,
  HOME_GLOW,
  ShoreBeacon,
} from '@/components/home/narrative';

// 阅读统计（recharts 图表，~500KB）位于第三幕、首屏之外：拆独立 chunk 懒加载，
// 避免图表库进入首屏关键路径（ssr:false 对首屏外组件无感知影响）
// 经 charts-bundle 共享 recharts 依赖，避免与 StatsCharts 各复制一份图表库
const ReadingStats = dynamic(
  () => import('@/components/home/stats/charts-bundle').then((m) => m.ReadingStats),
  { ssr: false }
);

/**
 * 首页 · 深海 × 电影
 * 片头 → 入水 → 分幕（展厅 → 仪表 → 洋流）→ 港口航标收束（无订阅）。
 * 「航迹」已并入「洋流」幕，数据航迹与历程共用同一深层环境。
 */
export default function Home() {
  return (
    // 底色由 body 提供；本页不再铺 bg-background，让全局 AmbientBackground 透出，
    // 与四期 DepthAmbience 叠加（全局水感 + 分幕变化）
    <div className="min-h-screen text-foreground">
      <CursorGlow color={HOME_GLOW.color} size={HOME_GLOW.size} />
      <ScrollProgress />
      <MobileDrawer />
      <WeatherCard />

      <div id="content" className="relative z-10">
        <HeroSection />
        <DiveTransition />

        <HomeActSection
          id="act-gallery"
          actLabel="第一幕 · 展厅"
          description="从浪线之下开始，拾起值得停留的篇章"
          contained={false}
          depth="shallow"
          className="mt-12 sm:mt-16"
        >
          <FeaturedHighlights />
        </HomeActSection>

        <HomeActSection
          id="act-console"
          actLabel="第二幕 · 仪表"
          description="航行读数与舱内工具"
          contained={false}
          depth="cabin"
          className="mt-12 sm:mt-16"
        >
          <StatsPanel />
          <TechStack />
        </HomeActSection>

        <HomeActSection
          id="act-current"
          actLabel="第三幕 · 洋流"
          description="数据航迹与历程随潮汐展开"
          contained={false}
          depth="current"
          className="mt-12 sm:mt-16"
        >
          {/* 原「航迹」幕并入：阅读统计收进洋流的深层水域 */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <ReadingStats />
          </div>
          <Timeline />
        </HomeActSection>

        <HomeActSection
          id="act-shore"
          actLabel="第四幕 · 靠岸"
          description="航标已亮，下一段航程任选"
          className="pb-8 sm:pb-12"
          depth="shore"
        >
          {/* contained 默认 true：由 Act 提供 container，ShoreBeacon 不再套一层 */}
          <ShoreBeacon />
        </HomeActSection>
      </div>
    </div>
  );
}
