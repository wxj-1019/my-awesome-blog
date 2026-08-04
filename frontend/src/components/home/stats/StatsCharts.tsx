'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  TrendingUp,
  Activity,
  FileText,
  Eye,
  ArrowUp,
  ArrowDown,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { Stagger, StaggerItem } from '@/components/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import StatsSoftCard, { StatsKpiCell } from './StatsSoftCard';
import type { PublicStatisticsOverview } from './types';
import { cn } from '@/lib/utils';

const FALLBACK_MONTHLY = [
  { month: '1月', articles: 8, views: 12450, likes: 320 },
  { month: '2月', articles: 12, views: 18920, likes: 485 },
  { month: '3月', articles: 15, views: 24680, likes: 620 },
  { month: '4月', articles: 10, views: 21340, likes: 540 },
  { month: '5月', articles: 18, views: 28750, likes: 780 },
  { month: '6月', articles: 22, views: 34560, likes: 950 },
];

const FALLBACK_WEEKLY = [
  { day: '周一', visitors: 145, engagement: 78 },
  { day: '周二', visitors: 168, engagement: 85 },
  { day: '周三', visitors: 152, engagement: 72 },
  { day: '周四', visitors: 178, engagement: 90 },
  { day: '周五', visitors: 165, engagement: 82 },
  { day: '周六', visitors: 132, engagement: 65 },
  { day: '周日', visitors: 128, engagement: 60 },
];

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;

const tooltipStyle = {
  backgroundColor: 'color-mix(in srgb, var(--card) 95%, transparent)',
  border: '1px solid color-mix(in srgb, var(--glass-border) 100%, transparent)',
  borderRadius: '12px',
  color: 'var(--foreground)',
  fontSize: '12px',
  padding: '8px 12px',
  backdropFilter: 'blur(12px)',
} as const;

function buildMonthlyChartData(stats: PublicStatisticsOverview | null) {
  if (!stats?.monthly_stats?.length) {
    return { data: FALLBACK_MONTHLY, isFallback: true as const };
  }
  const data = stats.monthly_stats.map((item) => ({
    month: `${item.month}月`,
    articles: item.articles,
    views: item.views,
    likes: 0,
  }));
  return { data, isFallback: false as const };
}

function buildWeeklyChartData(stats: PublicStatisticsOverview | null) {
  if (!stats) {
    return { data: FALLBACK_WEEKLY, isFallback: true as const };
  }
  const articleByDate = new Map(
    (stats.daily_articles ?? []).map((d) => [d.date, d.count])
  );
  const commentByDate = new Map(
    (stats.daily_comments ?? []).map((d) => [d.date, d.count])
  );
  const days: { day: string; visitors: number; engagement: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const articles =
      articleByDate.get(iso) ??
      articleByDate.get(String(d.toLocaleDateString('en-CA'))) ??
      0;
    const comments =
      commentByDate.get(iso) ??
      commentByDate.get(String(d.toLocaleDateString('en-CA'))) ??
      0;
    days.push({
      day: DAY_LABELS[d.getDay()],
      visitors: articles + comments,
      engagement: comments,
    });
  }
  const hasAny = days.some((x) => x.visitors > 0 || x.engagement > 0);
  if (!hasAny) {
    return { data: FALLBACK_WEEKLY, isFallback: true as const };
  }
  return { data: days, isFallback: false as const };
}

function MetaPill({ children, live }: { children: ReactNode; live?: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-glass-border/60',
        'bg-glass/30 px-2.5 py-1 text-[11px] text-muted-foreground'
      )}
    >
      {live ? (
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-500/90"
          aria-hidden
        />
      ) : null}
      {children}
    </div>
  );
}

export function StatsCharts({
  stats,
}: {
  stats: PublicStatisticsOverview | null;
}) {
  const reduced = useReducedMotion();
  const { data: monthlyStatsData, isFallback: monthlyFallback } =
    buildMonthlyChartData(stats);
  const { data: weeklyActivityData, isFallback: weeklyFallback } =
    buildWeeklyChartData(stats);
  const statsKey = String(stats !== null);
  const chartAnim = !reduced;

  // lieflat：hover 某柱时该柱加亮、其余变淡（联动）
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  /** 按文章数线性映射柱浓度：最小 0.35、最大 0.95 */
  const monthlyValues = monthlyStatsData.map((d) => d.articles);
  const minVal = Math.min(...monthlyValues, 0);
  const maxVal = Math.max(...monthlyValues, 1);
  const opacityFor = (val: number) => {
    if (maxVal === minVal) {return 0.65;}
    return 0.35 + (0.6 * (val - minVal)) / (maxVal - minVal);
  };

  const monthlyTotal = monthlyStatsData.reduce(
    (sum, item) => sum + item.articles,
    0
  );
  const monthlyViewsTotal = monthlyStatsData.reduce(
    (sum, item) => sum + item.views,
    0
  );
  const monthlyAvg = monthlyStatsData.length
    ? Math.round(monthlyTotal / monthlyStatsData.length)
    : 0;
  const firstMonth = monthlyStatsData[0]?.articles ?? 0;
  const lastMonth =
    monthlyStatsData[monthlyStatsData.length - 1]?.articles ?? 0;
  const monthlyGrowth =
    firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;

  const weeklyVisitorsTotal = weeklyActivityData.reduce(
    (sum, item) => sum + item.visitors,
    0
  );
  const weeklyAvg = weeklyActivityData.length
    ? Math.round(weeklyVisitorsTotal / weeklyActivityData.length)
    : 0;
  const peakDay = weeklyActivityData.reduce(
    (max, item) => (item.visitors > max.visitors ? item : max),
    weeklyActivityData[0] ?? { day: '-', visitors: 0, engagement: 0 }
  );
  const engagementRate =
    weeklyVisitorsTotal > 0
      ? Math.round(
          (weeklyActivityData.reduce((sum, item) => sum + item.engagement, 0) /
            weeklyVisitorsTotal) *
            100
        )
      : 0;

  const axisTick = { fill: 'var(--muted-foreground)', fontSize: 11 };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <StatsSoftCard
        title="月度统计"
        icon={<TrendingUp className="h-4 w-4" aria-hidden />}
        meta={
          <MetaPill>
            {monthlyFallback ? '示例 · 6个月' : '近6个月'}
          </MetaPill>
        }
      >
        <Stagger className="mb-5 grid grid-cols-3 gap-3" itemCount={3}>
          <StaggerItem>
            <StatsKpiCell
              label={
                <>
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  文章数
                </>
              }
              hint={
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium',
                    monthlyGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'
                  )}
                >
                  {monthlyGrowth >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(monthlyGrowth).toFixed(1)}%
                </span>
              }
            >
              <span className="text-primary">
                <AnimatedNumber key={statsKey} value={monthlyTotal} />
              </span>
            </StatsKpiCell>
          </StaggerItem>
          <StaggerItem>
            <StatsKpiCell
              label={
                <>
                  <Eye className="h-3.5 w-3.5 text-violet-500" />
                  访问量
                </>
              }
              hint={`月均 ${monthlyAvg}`}
            >
              <span className="text-violet-500">
                <AnimatedNumber
                  key={statsKey}
                  value={monthlyViewsTotal}
                  formatFn={(v) => `${(v / 1000).toFixed(1)}k`}
                />
              </span>
            </StatsKpiCell>
          </StaggerItem>
          <StaggerItem>
            <StatsKpiCell
              label={
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                  月均
                </>
              }
              hint="发文节奏"
            >
              <span className="text-amber-500">
                <AnimatedNumber key={statsKey} value={monthlyAvg} />
              </span>
            </StatsKpiCell>
          </StaggerItem>
        </Stagger>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyStatsData}
              margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* lieflat：去虚线网格，仅一条底部细基线 */}
              <ReferenceLine y={0} stroke="color-mix(in srgb, var(--primary) 20%, transparent)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={axisTick}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                width={32}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'color-mix(in srgb, var(--primary) 6%, transparent)' }}
              />
              <Bar
                dataKey="articles"
                fill="var(--primary)"
                radius={[6, 6, 2, 2]}
                name="文章数"
                maxBarSize={44}
                isAnimationActive={chartAnim}
                animationDuration={900}
                animationEasing="ease-out"
                onMouseEnter={(_, i) => setHoverIndex(i)}
              >
                {monthlyStatsData.map((entry, i) => {
                  const base = opacityFor(entry.articles);
                  const op = hoverIndex === null
                    ? base
                    : hoverIndex === i
                      ? Math.min(1, base + 0.15)
                      : 0.2;
                  return (
                    <Cell
                      key={`bar-${i}`}
                      fill="var(--primary)"
                      fillOpacity={op}
                    />
                  );
                })}
                <LabelList
                  dataKey="articles"
                  position="top"
                  fill="var(--primary)"
                  fontSize={11}
                  fontFamily="Georgia, serif"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </StatsSoftCard>

      <StatsSoftCard
        title="周活跃度"
        icon={<Activity className="h-4 w-4" aria-hidden />}
        meta={
          <MetaPill live={!weeklyFallback}>
            {weeklyFallback ? '示例数据' : '近7日活跃'}
          </MetaPill>
        }
      >
        <Stagger className="mb-5 grid grid-cols-3 gap-3" itemCount={3}>
          <StaggerItem>
            <StatsKpiCell
              label={
                <>
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {weeklyFallback ? '本周访客' : '本周活跃'}
                </>
              }
              hint={`日均 ${weeklyAvg}`}
            >
              <span className="text-primary">
                <AnimatedNumber key={statsKey} value={weeklyVisitorsTotal} />
              </span>
            </StatsKpiCell>
          </StaggerItem>
          <StaggerItem>
            <StatsKpiCell
              label={
                <>
                  <Activity className="h-3.5 w-3.5 text-pink-500" />
                  互动率
                </>
              }
              hint="评论 / 活跃"
            >
              <span className="text-pink-500">
                <AnimatedNumber key={statsKey} value={engagementRate} />%
              </span>
            </StatsKpiCell>
          </StaggerItem>
          <StaggerItem>
            <StatsKpiCell
              label={
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  峰值日
                </>
              }
              hint={`${peakDay.visitors} 次`}
            >
              <span className="text-emerald-500">{peakDay.day}</span>
            </StatsKpiCell>
          </StaggerItem>
        </Stagger>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyActivityData}
              margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="softAreaVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <ReferenceLine y={0} stroke="color-mix(in srgb, var(--primary) 20%, transparent)" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={axisTick}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                width={32}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
              {/* lieflat 单色：visitors 实线浓、engagement 虚线淡 */}
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="var(--primary)"
                strokeWidth={2.25}
                fill="url(#softAreaVisitors)"
                fillOpacity={hoverIndex === null ? 1 : 0.3}
                name={weeklyFallback ? '访客数' : '活跃度'}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive={chartAnim}
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke="var(--primary)"
                strokeWidth={1.75}
                strokeDasharray="4 3"
                fill="none"
                fillOpacity={hoverIndex === null ? 1 : 0.3}
                name="互动数"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={chartAnim}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </StatsSoftCard>
    </div>
  );
}
