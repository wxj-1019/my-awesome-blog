'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
type AvailabilityStatus = 'available' | 'busy' | 'offline' | 'away';
interface AvailabilityInfo {
  status: AvailabilityStatus;
  label: string;
  description: string;
  responseTime: string;
  color: string;
  icon: React.ReactNode;
}
export default function AvailabilityCard() {
  const [availability, setAvailability] = useState<AvailabilityInfo>({
    status: 'available',
    label: '在线',
    description: '现在可以回复消息',
    responseTime: '通常在 24 小时内回复',
    color: 'text-green-500',
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
          color: 'text-green-500',
          icon: <CheckCircle className="w-5 h-5" />,
        };
      } else if (isWeekday && hour >= 18 && hour < 22) {
        return {
          status: 'busy',
          label: '忙碌',
          description: '正在处理紧急任务',
          responseTime: '可能在 24 小时内回复',
          color: 'text-yellow-500',
          icon: <AlertCircle className="w-5 h-5" />,
        };
      } else if (hour >= 22 || hour < 9) {
        return {
          status: 'away',
          label: '离线',
          description: '非工作时间',
          responseTime: '下一个工作日回复',
          color: 'text-gray-500',
          icon: <Clock className="w-5 h-5" />,
        };
      } else {
        return {
          status: 'offline',
          label: '离线',
          description: '周末休息',
          responseTime: '周一回复',
          color: 'text-gray-500',
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
  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="font-sf-pro-display text-3xl font-bold text-foreground mb-2">
              当前状态
            </h2>
            <p className="font-sf-pro-text text-foreground/70">
              了解我的工作状态和响应时间
            </p>
          </div>
          <GlassCard padding="lg">
            <div className="flex items-center gap-6 mb-8">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${availability.color.replace('text-', 'from-')} to-white/20 dark:to-black/20 flex items-center justify-center`}
              >
                <div className={availability.color}>
                  {availability.icon}
                </div>
              </motion.div>
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-sf-pro-display text-2xl font-semibold text-foreground">
                    {availability.label}
                  </h3>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className={`w-3 h-3 rounded-full ${availability.color.replace('text-', 'bg-')}`}
                  />
                </div>
                <p className="font-sf-pro-text text-foreground/70">
                  {availability.description}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-foreground/5 dark:bg-foreground/10 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-tech-cyan/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-tech-cyan" />
                </div>
                <div>
                  <h4 className="font-sf-pro-display font-semibold text-foreground mb-1">
                    响应时间
                  </h4>
                  <p className="font-sf-pro-text text-foreground/70">
                    {availability.responseTime}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-foreground/5 dark:bg-foreground/10 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-sf-pro-display font-semibold text-foreground mb-1">
                    工作时间
                  </h4>
                  <p className="font-sf-pro-text text-foreground/70">
                    周一至周五 09:00 - 18:00 (UTC+8)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-foreground/5 dark:bg-foreground/10 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h4 className="font-sf-pro-display font-semibold text-foreground mb-1">
                    紧急事项
                  </h4>
                  <p className="font-sf-pro-text text-foreground/70">
                    如果有紧急事项，请通过社交媒体直接联系我，我会优先处理。
                  </p>
                </div>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {availability.status === 'offline' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 bg-foreground/5 dark:bg-foreground/10 rounded-2xl"
                >
                  <p className="font-sf-pro-text text-foreground/70 text-center">
                    下一个工作日：<span className="text-tech-cyan font-semibold">{getNextWorkingDay()}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}