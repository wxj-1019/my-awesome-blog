'use client';

import { motion } from '@/lib/framer-motion';
import { Calendar } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl p-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-tech-cyan/20 via-tech-purple/10 to-tech-sky/20 backdrop-blur-md" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.1)_0%,transparent_50%)]" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              仪表盘
            </motion.h1>
            <motion.p
              className="text-foreground/70 mt-2 text-lg"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              欢迎来到您的博客管理系统
            </motion.p>
          </div>

          <motion.div
            className="hidden lg:flex items-center gap-3 text-sm text-foreground/60 bg-glass/20 backdrop-blur-lg px-4 py-2 rounded-full border border-glass-border/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Calendar className="w-4 h-4" />
            <span>
              {new Date().toLocaleDateString('zh-CN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
