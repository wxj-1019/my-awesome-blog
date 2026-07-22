'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Clock,
  TrendingUp,
  Target,
  Eye,
  Heart,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { Stagger, StaggerItem } from '@/components/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import {
  getPublicStatistics,
  type PublicStatisticsOverview,
} from '@/services/statisticsService';
import StatsSoftCard from './stats/StatsSoftCard';

const FALLBACK_HEATMAP = Array.from({ length: 49 }, (_, index) => ({
  week: Math.floor(index / 7),
  day: index % 7,
  count: 0,
  date: '',
}));

const FALLBACK_READING_TREND = [
  { month: '1月', articles: 0, time: 0, likes: 0 },
  { month: '2月', articles: 0, time: 0, likes: 0 },
  { month: '3月', articles: 0, time: 0, likes: 0 },
  { month: '4月', articles: 0, time: 0, likes: 0 },
  { month: '5月', articles: 0, time: 0, likes: 0 },
  { month: '6月', articles: 0, time: 0, likes: 0 },
];

const categoryPreferenceData = [
  {
    category: '前端开发',
    hours: 45,
    percentage: 35,
    barClass: 'bg-primary',
  },
  {
    category: '后端开发',
    hours: 32,
    percentage: 25,
    barClass: 'bg-violet-500',
  },
  {
    category: 'DevOps',
    hours: 20,
    percentage: 16,
    barClass: 'bg-emerald-500',
  },
  {
    category: '设计',
    hours: 18,
    percentage: 14,
    barClass: 'bg-amber-500',
  },
  {
    category: '其他',
    hours: 12,
    percentage: 10,
    barClass: 'bg-muted-foreground/60',
  },
];

const tooltipStyle = {
  backgroundColor: 'color-mix(in srgb, var(--card) 95%, transparent)',
  border: '1px solid color-mix(in srgb, var(--glass-border) 100%, transparent)',
  borderRadius: '12px',
  color: 'var(--foreground)',
  fontSize: '12px',
  padding: '8px 12px',
  backdropFilter: 'blur(12px)',
} as const;

function HeatmapCell({ count, date }: { count: number; date: string }) {
  const intensity =
    count === 0
      ? 'bg-muted/40'
      : count < 3
        ? 'bg-primary/25'
        : count < 6
          ? 'bg-primary/45'
          : count < 9
            ? 'bg-primary/70'
            : 'bg-primary';

  return (
    <div
      className={cn(
        'aspect-square w-full rounded-[4px]',
        'transition-transform duration-200 ease-out',
        'hover:z-10 hover:scale-110',
        'motion-reduce:hover:scale-100',
        intensity
      )}
      title={date ? `${date}: ${count}篇` : `${count}篇`}
      role="gridcell"
      aria-label={
        date ? `${date}阅读${count}篇文章` : `阅读${count}篇文章`
      }
    />
  );
}

export default function ReadingStats() {
  const reduced = useReducedMotion();
  const [selectedPeriod, setSelectedPeriod] = useState<
    'week' | 'month' | 'year'
  >('month');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'heatmap' | 'trends'
  >('overview');
  const [publicStats, setPublicStats] =
    useState<PublicStatisticsOverview | null>(null);

  useEffect(() => {
    void getPublicStatistics().then(setPublicStats);
  }, []);

  const readingTrendData = useMemo(() => {
    if (!publicStats?.monthly_stats.length) {
      return FALLBACK_READING_TREND;
    }
    return publicStats.monthly_stats.map((item) => ({
      month: `${item.month}月`,
      articles: item.articles,
      time: 0,
      likes: 0,
    }));
  }, [publicStats]);

  const heatmapData = useMemo(() => {
    if (!publicStats?.daily_articles.length) {
      return FALLBACK_HEATMAP;
    }
    const counts = new Map(
      publicStats.daily_articles.map((item) => [item.date, item.count])
    );
    return Array.from({ length: 49 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (48 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        week: Math.floor(index / 7),
        day: date.getDay(),
        count: counts.get(key) ?? 0,
        date: key,
      };
    });
  }, [publicStats]);

  const readingStats: Array<
    {
      label: string;
      unit: string;
      icon: typeof BookOpen;
    } & (
      | { numeric: true; value: number }
      | { numeric: false; value: string }
    )
  > = [
    {
      label: '已发布文章',
      value: publicStats?.total_articles ?? 0,
      numeric: true,
      unit: '篇',
      icon: BookOpen,
    },
    {
      label: '累计阅读',
      value: publicStats?.total_views ?? 0,
      numeric: true,
      unit: '次',
      icon: Eye,
    },
    {
      label: '读者评论',
      value: publicStats?.total_comments ?? 0,
      numeric: true,
      unit: '条',
      icon: MessageSquare,
    },
    {
      label: '数据来源',
      value: publicStats ? '实时' : '暂无',
      numeric: false,
      unit: '公开统计',
      icon: Heart,
    },
  ];

  const periods = [
    { id: 'week' as const, label: '本周' },
    { id: 'month' as const, label: '本月' },
    { id: 'year' as const, label: '全年' },
  ];

  const tabs = [
    { id: 'overview' as const, label: '概览', icon: Eye },
    { id: 'heatmap' as const, label: '热力图', icon: Calendar },
    { id: 'trends' as const, label: '趋势', icon: TrendingUp },
  ];

  const statsKey = String(publicStats !== null);
  const chartAnim = !reduced;
  const axisTick = { fill: 'var(--muted-foreground)', fontSize: 11 };
  const gridStroke = 'color-mix(in srgb, var(--border) 55%, transparent)';

  return (
    <StatsSoftCard
      title="内容统计"
      icon={<BookOpen className="h-4 w-4" aria-hidden />}
      aria-label="阅读统计"
      fadeIn
      meta={
        <p className="hidden text-xs text-muted-foreground sm:block">
          {publicStats ? '基于公开聚合数据' : '暂无真实数据，图表显示为 0'}
        </p>
      }
      className="p-5 sm:p-6 md:p-7"
    >
      {/* 保留 testid，兼容 HomeCyberLayers；仅顶线装饰 */}
      <div
        data-testid="reading-cockpit-layer"
        className="pointer-events-none absolute inset-0"
        aria-hidden
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground sm:hidden">
          {publicStats ? '基于公开聚合数据' : '暂无真实数据'}
        </p>
        <div
          className="inline-flex items-center gap-1 rounded-full border border-glass-border/60 bg-glass/25 p-1"
          role="group"
          aria-label="统计周期"
        >
          {periods.map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() => setSelectedPeriod(period.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 sm:text-sm',
                selectedPeriod === period.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={`切换到${period.label}数据`}
              aria-pressed={selectedPeriod === period.id}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <div
          className="flex items-center gap-1 border-b border-border/60"
          role="tablist"
          aria-label="内容统计视图"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors duration-200 sm:px-4 sm:text-sm',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label={`查看${tab.label}数据`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {tab.label}
                <span
                  className={cn(
                    'absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary transition-opacity duration-200',
                    active ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 面板：CSS 过渡，避免硬切 */}
      <div
        key={activeTab}
        className="motion-safe:animate-fade-in"
      >
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <Stagger
              className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
              itemCount={4}
            >
              {readingStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <StaggerItem key={stat.label}>
                    <div
                      className={cn(
                        'rounded-xl border border-glass-border/60 bg-glass/25 p-3 sm:p-4',
                        'transition-[border-color,background-color] duration-200',
                        'hover:border-primary/30 hover:bg-glass/35'
                      )}
                    >
                      <Icon className="mb-2 h-4 w-4 text-primary sm:h-5 sm:w-5" />
                      <div className="mb-0.5 text-xl font-bold tabular-nums text-foreground sm:text-2xl md:text-3xl">
                        {stat.numeric ? (
                          <AnimatedNumber
                            key={statsKey}
                            value={stat.value}
                          />
                        ) : (
                          stat.value
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-sm">
                        {stat.unit}
                      </div>
                      <div className="mt-1.5 text-[10px] text-muted-foreground/90 sm:text-xs">
                        {stat.label}
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-xl border border-glass-border/60 bg-glass/20 p-3.5 sm:p-4">
                <h4 className="mb-3 text-xs font-semibold text-foreground sm:text-sm">
                  分类偏好（示例）
                </h4>
                <div className="space-y-2.5 sm:space-y-3">
                  {categoryPreferenceData.map((item) => (
                    <div key={item.category}>
                      <div className="mb-1 flex items-center justify-between text-[10px] sm:text-xs">
                        <span className="text-foreground">{item.category}</span>
                        <span className="text-muted-foreground">
                          {item.hours}h ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50 sm:h-2">
                        <div
                          className={cn(
                            'h-full rounded-full transition-[width] duration-700 ease-out',
                            'motion-reduce:transition-none',
                            item.barClass
                          )}
                          style={{
                            width: reduced ? `${item.percentage}%` : `${item.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-glass-border/60 bg-glass/20 p-3.5 sm:p-4">
                <h4 className="mb-3 text-xs font-semibold text-foreground sm:text-sm">
                  内容目标（示例）
                </h4>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Target className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                      <span className="text-foreground">阅读文章</span>
                    </div>
                    <span className="text-xs font-bold text-primary sm:text-sm">
                      18/20
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50 sm:h-2">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
                      style={{ width: '90%' }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between sm:mt-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Clock className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                      <span className="text-foreground">阅读时长</span>
                    </div>
                    <span className="text-xs font-bold text-primary sm:text-sm">
                      45/60h
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50 sm:h-2">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
                      style={{ width: '75%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="rounded-xl border border-glass-border/60 bg-glass/20 p-3.5 sm:p-4">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h4 className="text-xs font-semibold text-foreground sm:text-sm">
                阅读热力图
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground sm:text-xs">
                <span>少</span>
                <div className="flex gap-1">
                  <div className="h-2.5 w-2.5 rounded-sm bg-primary/25 sm:h-3 sm:w-3" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-primary/45 sm:h-3 sm:w-3" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-primary/70 sm:h-3 sm:w-3" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-primary sm:h-3 sm:w-3" />
                </div>
                <span>多</span>
              </div>
            </div>

            <div
              className="grid grid-cols-7 gap-1 sm:gap-1.5"
              role="grid"
              aria-label="近七周阅读热力"
            >
              {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                <div
                  key={day}
                  className="mb-1 text-center text-[10px] text-muted-foreground sm:text-xs"
                >
                  {day}
                </div>
              ))}
              {heatmapData.map((item) => (
                <HeatmapCell
                  key={`${item.week}-${item.day}-${item.date}`}
                  count={item.count}
                  date={item.date}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="rounded-xl border border-glass-border/60 bg-glass/20 p-3.5 sm:p-4">
            <h4 className="mb-3 text-xs font-semibold text-foreground sm:mb-4 sm:text-sm">
              阅读趋势
            </h4>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={readingTrendData}>
                  <defs>
                    <linearGradient
                      id="softReadingArticles"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="articles"
                    stroke="var(--primary)"
                    strokeWidth={2.25}
                    fill="url(#softReadingArticles)"
                    name="文章"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    isAnimationActive={chartAnim}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </StatsSoftCard>
  );
}
