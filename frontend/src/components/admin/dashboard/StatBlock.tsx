'use client';

import { motion } from '@/lib/framer-motion';
import { TrendingUp } from 'lucide-react';
import GlassCardAdmin from '@/components/ui/GlassCardAdmin';

interface StatBlockItem {
  label: string;
  value: string;
  description: string;
  color: string;
}

interface StatBlockProps {
  blocks: StatBlockItem[];
}

export default function StatBlock({ blocks }: StatBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6 }}
    >
      <GlassCardAdmin className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-tech-cyan/40 to-tech-sky/40">
            <TrendingUp className="w-5 h-5 text-tech-cyan" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">数据概览</h2>
            <p className="text-sm text-foreground/60">网站整体运行情况</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {blocks.map((block) => (
            <div
              key={block.label}
              className="text-center p-4 rounded-xl bg-glass/20 border border-glass-border/20 hover:bg-glass/30 transition-all duration-300"
            >
              <p className="text-sm text-foreground/70 mb-1">{block.label}</p>
              <p className={`text-2xl font-bold mb-1 ${block.color}`}>{block.value}</p>
              <p className="text-xs text-foreground/50">{block.description}</p>
            </div>
          ))}
        </div>
      </GlassCardAdmin>
    </motion.div>
  );
}
