'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { motion } from '@/lib/framer-motion';
import {
  Users, MessageSquare, TrendingUp, Activity, Zap, Globe,
  BarChart2, Clock, Flame, Heart, Tag, Trophy,
  Calendar, Eye, Reply
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

interface LeaderboardItem {
  rank: number;
  name: string;
  value: number;
  metric: string;
  avatar?: string;
  change?: number;
}

interface TimeRange {
  label: string;
  value: string;
}

function RealTimeStats() {
  const [onlineUsers, setOnlineUsers] = useState(10);
  const [messageRate, setMessageRate] = useState(0);
  const [activeTab, setActiveTab] = useState<'realtime' | 'stats' | 'leaderboard'>('realtime');
  const [timeRange, setTimeRange] = useState<string>('24h');

  const [stats, setStats] = useState<StatItem[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [messageStats, setMessageStats] = useState<StatItem[]>([]);

  // 时间范围选项
  const timeRanges: TimeRange[] = [
    { label: '24小时', value: '24h' },
    { label: '7天', value: '7d' },
    { label: '30天', value: '30d' },
    { label: '全部', value: 'all' }
  ];

  // 模拟数据初始化
  // messageRate 仅用于初始化统计卡片，加入依赖会导致每次 rate 变化时重复初始化
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // 初始化实时数据
    const initialOnlineUsers = Math.floor(Math.random() * 50) + 10;
    const initialActiveUsers = Math.floor(Math.random() * 20) + 5;
    setOnlineUsers(initialOnlineUsers);
    setMessageRate(3);

    // 实时统计卡片
    setStats([
      {
        label: '在线用户',
        value: initialOnlineUsers,
        change: Math.floor(Math.random() * 5) - 2,
        icon: <Users className="w-4 h-4" />,
        color: 'tech-cyan'
      },
      {
        label: '今日留言',
        value: 42,
        change: Math.floor(Math.random() * 10) + 1,
        icon: <MessageSquare className="w-4 h-4" />,
        color: 'tech-purple'
      },
      {
        label: '活跃度',
        value: `${messageRate}/min`,
        change: Math.floor(Math.random() * 3) - 1,
        icon: <Activity className="w-4 h-4" />,
        color: 'tech-pink'
      },
      {
        label: '新用户',
        value: initialActiveUsers,
        change: Math.floor(Math.random() * 2),
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'green-500'
      }
    ]);

    // 详细留言统计
    setMessageStats([
      {
        label: '总留言数',
        value: '1,256',
        change: 12,
        icon: <MessageSquare className="w-4 h-4" />,
        color: 'tech-cyan'
      },
      {
        label: '平均回复数',
        value: '3.2',
        change: 0.5,
        icon: <Reply className="w-4 h-4" />,
        color: 'tech-purple'
      },
      {
        label: '平均点赞数',
        value: '8.7',
        change: 1.2,
        icon: <Heart className="w-4 h-4" />,
        color: 'tech-pink'
      },
      {
        label: '带图留言',
        value: '23%',
        change: 2,
        icon: <Eye className="w-4 h-4" />,
        color: 'green-500'
      },
      {
        label: '热门标签',
        value: '18',
        change: 1,
        icon: <Tag className="w-4 h-4" />,
        color: 'yellow-500'
      },
      {
        label: '用户互动率',
        value: '68%',
        change: 3,
        icon: <Activity className="w-4 h-4" />,
        color: 'blue-500'
      }
    ]);

    // 排行榜数据
    setLeaderboardData([
      { rank: 1, name: 'Admin', value: 156, metric: '留言数', change: 12 },
      { rank: 2, name: 'TechGuru', value: 89, metric: '留言数', change: 8 },
      { rank: 3, name: 'Designer', value: 67, metric: '留言数', change: 5 },
      { rank: 4, name: 'Developer', value: 245, metric: '点赞数', change: 32 },
      { rank: 5, name: 'Creator', value: 189, metric: '点赞数', change: 21 },
      { rank: 6, name: 'Innovator', value: 78, metric: '回复数', change: 9 },
      { rank: 7, name: 'Thinker', value: 134, metric: '浏览量', change: 18 },
      { rank: 8, name: 'Writer', value: 56, metric: '留言数', change: 4 }
    ]);
    // messageRate 仅用于初始化统计卡片，加入依赖会导致每次 rate 变化时重复初始化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => {
        const change = Math.floor(Math.random() * 3) - 1;
        return Math.max(5, prev + change);
      });

      setMessageRate(_prev => {
        const newRate = Math.floor(Math.random() * 10) + 1;
        return newRate;
      });

      setStats(prevStats => prevStats.map(stat => ({
        ...stat,
        change: Math.floor(Math.random() * 5) - 2,
        value: stat.label === '活跃度' ? `${Math.floor(Math.random() * 10) + 1}/min` : stat.value
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 活动数据 - 24小时趋势
  const activityData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      // 模拟真实数据：白天活跃度高，夜间低
      const hour = i;
      let base = 20;
      if (hour >= 9 && hour <= 12) {base = 70;}  // 上午高峰
      if (hour >= 14 && hour <= 17) {base = 65;} // 下午高峰
      if (hour >= 20 && hour <= 22) {base = 55;} // 晚上高峰
      if (hour >= 23 || hour <= 6) {base = 15;}  // 夜间低谷
      return base + Math.random() * 20;
    });
  }, []);

  // 标签分布数据
  const tagDistribution = useMemo(() => [
    { tag: '技术', count: 45, color: 'tech-cyan' },
    { tag: '设计', count: 38, color: 'tech-purple' },
    { tag: '生活', count: 32, color: 'green-500' },
    { tag: '音乐', count: 28, color: 'tech-pink' },
    { tag: '游戏', count: 21, color: 'yellow-500' },
    { tag: '其他', count: 18, color: 'blue-500' }
  ], []);

  const StatCard = ({ stat, index }: { stat: StatItem; index: number }) => (
    <motion.div
      className="relative overflow-hidden rounded-xl border backdrop-blur-xl p-4"
      style={{
        borderColor: `rgba(${stat.color === 'tech-cyan' ? '0,217,255' : stat.color === 'tech-purple' ? '124,58,237' : stat.color === 'tech-pink' ? '244,63,94' : stat.color === 'green-500' ? '34,197,94' : stat.color === 'yellow-500' ? '251,191,36' : '59,130,246'}, 0.2)`,
        background: `rgba(${stat.color === 'tech-cyan' ? '0,217,255' : stat.color === 'tech-purple' ? '124,58,237' : stat.color === 'tech-pink' ? '244,63,94' : stat.color === 'green-500' ? '34,197,94' : stat.color === 'yellow-500' ? '251,191,36' : '59,130,246'}, 0.05)`
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, borderColor: `rgba(${stat.color === 'tech-cyan' ? '0,217,255' : stat.color === 'tech-purple' ? '124,58,237' : stat.color === 'tech-pink' ? '244,63,94' : stat.color === 'green-500' ? '34,197,94' : stat.color === 'yellow-500' ? '251,191,36' : '59,130,246'}, 0.4)` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`text-${stat.color} bg-${stat.color}/10 p-2 rounded-lg`}>
          {stat.icon}
        </div>
        {stat.change !== undefined && (
          <motion.span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              stat.change > 0
                ? "bg-green-500/20 text-green-400"
                : stat.change < 0
                ? "bg-red-500/20 text-red-400"
                : "bg-gray-500/20 text-gray-400"
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {stat.change > 0 ? '+' : ''}{stat.change}
          </motion.span>
        )}
      </div>

      <motion.div
        className="text-2xl font-bold text-white"
        key={stat.value}
        initial={{ opacity: 0.5, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {stat.value}
      </motion.div>

      <div className="text-xs text-white/50 mt-1">{stat.label}</div>

      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${stat.color} 50%, transparent 100%)`
        }}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
      />
    </motion.div>
  );

  const LeaderboardCard = ({ item }: { item: LeaderboardItem }) => (
    <motion.div 
      className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-tech-cyan/30 transition-colors backdrop-blur-sm"
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
        item.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
        item.rank === 2 ? "bg-gray-400/20 text-gray-300" :
        item.rank === 3 ? "bg-amber-700/20 text-amber-500" :
        "bg-white/5 text-white/60"
      )}>
        {item.rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{item.name}</div>
        <div className="text-xs text-white/50 flex items-center gap-1">
          <span>{item.value}</span>
          <span className="text-white/30">•</span>
          <span>{item.metric}</span>
        </div>
      </div>
      {item.change !== undefined && (
        <div className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          item.change > 0
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400"
        )}>
          {item.change > 0 ? '+' : ''}{item.change}
        </div>
      )}
    </motion.div>
  );

  const renderRealTimeTab = () => (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      <motion.div
        className="relative rounded-xl border backdrop-blur-xl overflow-hidden"
        style={{
          borderColor: 'rgba(0,217,255,0.2)',
          background: 'rgba(0,217,255,0.03)'
        }}
      >
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            background: 'linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,0.25) 50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))',
            backgroundSize: '100% 2px, 3px 100%'
          }}
        />

        <div className="relative z-10 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <Clock className="w-4 h-4" />
              24小时活跃趋势
            </div>
            <div className="flex gap-1">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={cn(
                    "text-xs px-2 py-1 rounded-md transition-colors",
                    timeRange === range.value
                      ? "bg-tech-cyan text-black font-medium"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-32">
            <div className="flex items-end gap-1 h-full">
              {/* 24 小时活动柱状图：index 即小时，作为稳定 key */}
              {activityData.map((height, i) => (
                <motion.div
                  key={`hour-${i}`}
                  className="flex-1 bg-gradient-to-t from-tech-cyan to-tech-cyan/30 rounded-t-sm relative group will-change-transform"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.02, duration: 0.5 }}
                >
                  <div className="absolute inset-x-0 bottom-0 h-full bg-tech-cyan/0 group-hover:bg-tech-cyan/30 transition-colors rounded-t-sm" />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {i}:00 - {height.toFixed(0)}条
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-white/30 mt-2">
              <span>0:00</span>
              <span>12:00</span>
              <span>24:00</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-tech-cyan/50" />
              <div>
                <div className="text-2xl font-bold text-tech-cyan">{onlineUsers}</div>
                <div className="text-xs text-white/50">全球连接用户</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/70">峰值时间</div>
              <div className="text-white font-medium">10:00 - 12:00</div>
              <div className="text-xs text-white/50">活跃度最高</div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );

  const renderStatsTab = () => (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {messageStats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      <motion.div
        className="relative rounded-xl border backdrop-blur-xl overflow-hidden p-4"
        style={{
          borderColor: 'rgba(124,58,237,0.2)',
          background: 'rgba(124,58,237,0.03)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-white flex items-center gap-2">
            <Tag className="w-4 h-4" />
            标签分布
          </div>
          <div className="text-xs text-white/50">
            共 {tagDistribution.reduce((sum, tag) => sum + tag.count, 0)} 个标签
          </div>
        </div>

        <div className="space-y-3">
          {tagDistribution.map((tag, index) => (
            <div key={tag.tag} className="flex items-center gap-3">
              <div className="w-20 text-sm text-white/70 truncate">{tag.tag}</div>
              <div className="flex-1">
                <div className="h-2 rounded-full overflow-hidden bg-white/10">
                  <motion.div
                    className={`h-full bg-${tag.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(tag.count / 45) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  />
                </div>
              </div>
              <div className="w-10 text-right text-sm text-white">{tag.count}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="relative rounded-xl border backdrop-blur-xl overflow-hidden p-4"
        style={{
          borderColor: 'rgba(34,197,94,0.2)',
          background: 'rgba(34,197,94,0.03)'
        }}
      >
        <div className="text-sm font-medium text-white flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4" />
          月度趋势
        </div>
        <div className="flex items-end gap-1 h-24">
          {/* 12 个月度柱状图：顺序固定，使用 index 作为 key */}
          {Array.from({ length: 12 }, (_, i) => {
            // 模拟月度数据
            const monthValue = 30 + Math.random() * 40;
            return (
              <motion.div
                key={i}
                className="flex-1 bg-gradient-to-t from-green-500 to-green-500/30 rounded-t-sm"
                initial={{ height: 0 }}
                animate={{ height: `${monthValue}%` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-white/30 mt-2">
          <span>1月</span>
          <span>6月</span>
          <span>12月</span>
        </div>
      </motion.div>
    </>
  );

  const renderLeaderboardTab = () => (
    <div className="space-y-4">
      <motion.div
        className="relative rounded-xl border backdrop-blur-xl overflow-hidden p-4"
        style={{
          borderColor: 'rgba(251,191,36,0.2)',
          background: 'rgba(251,191,36,0.03)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            活跃用户排行榜
          </div>
          <div className="text-xs text-white/50 flex items-center gap-1">
            <span>按留言数排序</span>
          </div>
        </div>

        <div className="space-y-2">
          {leaderboardData.slice(0, 5).map((item) => (
            <LeaderboardCard key={`${item.rank}-${item.name}`} item={item} />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs text-white/50 mb-2">其他榜单</div>
          <div className="grid grid-cols-2 gap-2">
            <button className="text-left p-2 rounded-lg border border-white/10 hover:border-tech-cyan/30 transition-colors">
              <div className="text-xs text-white/70">最多点赞</div>
              <div className="text-white font-medium">@Developer</div>
              <div className="text-xs text-white/50">245 个赞</div>
            </button>
            <button className="text-left p-2 rounded-lg border border-white/10 hover:border-tech-cyan/30 transition-colors">
              <div className="text-xs text-white/70">最佳回复</div>
              <div className="text-white font-medium">@Thinker</div>
              <div className="text-xs text-white/50">134 次回复</div>
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="relative rounded-xl border backdrop-blur-xl overflow-hidden p-4"
        style={{
          borderColor: 'rgba(244,63,94,0.2)',
          background: 'rgba(244,63,94,0.03)'
        }}
      >
        <div className="text-sm font-medium text-white flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-orange-500" />
          热门留言
        </div>
        <div className="space-y-3">
          {[
            { id: 1, content: '这个设计太棒了！', likes: 89, replies: 23 },
            { id: 2, content: '技术分享很有帮助', likes: 76, replies: 18 },
            { id: 3, content: '期待更多音乐推荐', likes: 64, replies: 15 }
          ].map((msg, index) => (
            <motion.div
              key={msg.id}
              className="p-3 rounded-lg border border-white/10 hover:border-orange-500/30 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-sm text-white mb-2 truncate">{msg.content}</div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {msg.likes}
                </span>
                <span className="flex items-center gap-1">
                  <Reply className="w-3 h-3" /> {msg.replies}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Zap className="w-5 h-5 text-tech-cyan animate-pulse" />
          {activeTab === 'realtime' ? '实时数据' : activeTab === 'stats' ? '留言统计' : '排行榜'}
        </h3>
        <div className="flex items-center gap-2">
          <motion.div
            className="flex items-center gap-2 text-xs text-white/50"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            实时更新
          </motion.div>
        </div>
      </div>

      {/* 选项卡导航 */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('realtime')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2",
            activeTab === 'realtime'
              ? "border-tech-cyan text-tech-cyan"
              : "border-transparent text-white/50 hover:text-white"
          )}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            实时数据
          </div>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2",
            activeTab === 'stats'
              ? "border-tech-purple text-tech-purple"
              : "border-transparent text-white/50 hover:text-white"
          )}
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            留言统计
          </div>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2",
            activeTab === 'leaderboard'
              ? "border-yellow-500 text-yellow-500"
              : "border-transparent text-white/50 hover:text-white"
          )}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            排行榜
          </div>
        </button>
      </div>

      {/* 选项卡内容 */}
      <div className="space-y-4">
        {activeTab === 'realtime' && renderRealTimeTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
      </div>
    </div>
  );
}

export default memo(RealTimeStats);
