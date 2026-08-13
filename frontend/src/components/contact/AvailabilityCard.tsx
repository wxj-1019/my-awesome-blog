'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { ScrollRevealLine } from '@/components/gsap/ScrollNarrative';
import { cn } from '@/lib/utils';

type AvailabilityStatus = 'available' | 'busy' | 'offline' | 'away';
interface AvailabilityInfo {
  status: AvailabilityStatus;
  label: string;
  description: string;
  responseTime: string;
  /** 图标/文字颜色 token 类 */
  color: string;
  /** 状态圆点背景 token 类（完整类名，保证 Tailwind 可扫描） */
  dotClass: string;
  /** 图标容器渐变起点 token 类 */
  gradientClass: string;
  icon: React.ReactNode;
}
export default function AvailabilityCard() {
  const [availability, setAvailability] = useState<AvailabilityInfo>({
    status: 'available',
    label: '在线',
    description: '现在可以回复消息',
    responseTime: '通常在 24 小时内回复',
    color: 'text-success',
    dotClass: 'bg-success',
    gradientClass: 'from-success',
    icon: <CheckCircle className="w-5 h-5" />,
  });
  useEffect(() => {
    const getCurrentAvailability = (): AvailabilityInfo => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      const isWeekday = day >= 1 && day <= 5;
      const isWorkHours = hour >= 9 && hour < 18;
      if (isWeekday && isWorkHours) {
        return {
          status: 'available',
          label: '在线',
          description: '现在可以回复消息',
          responseTime: '通常在 2 小时内回复',
          color: 'text-success',
          dotClass: 'bg-success',
          gradientClass: 'from-success',
          icon: <CheckCircle className="w-5 h-5" />,
        };
      } else if (isWeekday && hour >= 18 && hour < 22) {
        return {
          status: 'busy',
          label: '忙碌',
          description: '正在处理紧急任务',
          responseTime: '可能在 24 小时内回复',
          color: 'text-warning',
          dotClass: 'bg-warning',
          gradientClass: 'from-warning',
          icon: <AlertCircle className="w-5 h-5" />,
        };
      } else if (hour >= 22 || hour < 9) {
        return {
          status: 'away',
          label: '离线',
          description: '非工作时间',
          responseTime: '下一个工作日回复',
          color: 'text-muted-foreground',
          dotClass: 'bg-muted-foreground',
          gradientClass: 'from-muted-foreground',
          icon: <Clock className="w-5 h-5" />,
        };
      } else {
        return {
          status: 'offline',
          label: '离线',
          description: '周末休息',
          responseTime: '周一回复',
          color: 'text-muted-foreground',
          dotClass: 'bg-muted-foreground',
          gradientClass: 'from-muted-foreground',
          icon: <XCircle className="w-5 h-5" />,
        };
      }
    };
    setAvailability(getCurrentAvailability());
  }, []);
  const getNextWorkingDay = () => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilMonday = (8 - day) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    return nextMonday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  };
  const isOffline = availability.status === 'offline';
  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
              当前状态
            </h2>
            <p className="text-foreground/70">
              了解我的工作状态和响应时间
            </p>
            {/* 分区揭示线：scaleX 由外层 ScrollNarrative 的 GSAP 写入 */}
            <ScrollRevealLine className="mx-auto" />
          </div>
          <GlassCard padding="lg">
            <div className="flex items-center gap-6 mb-8">
              {/* 状态图标：静态展示，无循环呼吸动画 */}
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${availability.gradientClass} to-foreground/10 flex items-center justify-center`}
              >
                <div className={availability.color}>
                  {availability.icon}
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-serif text-2xl font-semibold text-foreground">
                    {availability.label}
                  </h3>
                  <div
                    className={`w-3 h-3 rounded-full ${availability.dotClass}`}
                  />
                </div>
                <p className="text-foreground/70">
                  {availability.description}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-foreground/5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-tech-cyan/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-tech-cyan" />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-foreground mb-1">
                    响应时间
                  </h4>
                  <p className="text-foreground/70">
                    {availability.responseTime}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-foreground/5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-tech-purple/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-tech-purple" />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-foreground mb-1">
                    工作时间
                  </h4>
                  <p className="text-foreground/70">
                    周一至周五 09:00 - 18:00 (UTC+8)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-foreground/5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-tech-pink/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-tech-pink" />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-foreground mb-1">
                    紧急事项
                  </h4>
                  <p className="text-foreground/70">
                    如果有紧急事项，请通过社交媒体直接联系我，我会优先处理。
                  </p>
                </div>
              </div>
            </div>
            {/* 展开动画：grid-rows 0fr→1fr + opacity，不触发布局属性动画 */}
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-out',
                isOffline ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden min-h-0">
                <div
                  className={cn(
                    'mt-6 p-4 bg-foreground/5 rounded-2xl transition-opacity duration-300',
                    isOffline ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <p className="text-foreground/70 text-center">
                    下一个工作日：<span className="text-tech-cyan font-semibold">{getNextWorkingDay()}</span>
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
