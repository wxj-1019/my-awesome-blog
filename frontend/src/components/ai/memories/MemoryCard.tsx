'use client';

import { motion } from '@/lib/framer-motion';
import { Edit, Trash2, Clock, BarChart2 } from 'lucide-react';
import type { Memory } from '@/types';

interface MemoryCardProps {
  memory: Memory;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MemoryCard({ memory, onEdit, onDelete }: MemoryCardProps) {
  const getTypeColor = (type: string) => {
    return type === 'short_term'
      ? 'bg-blue-500/20 text-blue-400'
      : 'bg-purple-500/20 text-purple-400';
  };

  const getTypeLabel = (type: string) => {
    return type === 'short_term' ? '短期' : '长期';
  };

  const getImportanceColor = (importance?: number) => {
    if (!importance) {return 'bg-gray-500/20 text-gray-400';}
    if (importance >= 0.8) {return 'bg-red-500/20 text-red-400';}
    if (importance >= 0.5) {return 'bg-yellow-500/20 text-yellow-400';}
    return 'bg-green-500/20 text-green-400';
  };

  const getImportanceLabel = (importance?: number) => {
    if (!importance) {return '未设置';}
    if (importance >= 0.8) {return '高';}
    if (importance >= 0.5) {return '中';}
    return '低';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-xl p-4 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(memory.memory_type)}`}>
            <Clock className="w-3 h-3" />
            <span>{getTypeLabel(memory.memory_type)}</span>
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getImportanceColor(memory.importance)}`}>
            <BarChart2 className="w-3 h-3" />
            <span>{getImportanceLabel(memory.importance)}</span>
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(memory.id)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(memory.id)}
            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-white/80 mb-3 line-clamp-3 min-h-[60px]">
        {memory.content}
      </p>

      <div className="flex items-center justify-between text-xs text-white/50 pt-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <span>访问 {memory.access_count} 次</span>
          {memory.expires_at && (
            <span>
              {new Date(memory.expires_at) < new Date() ? '已过期' : `过期于 ${new Date(memory.expires_at).toLocaleDateString('zh-CN')}`}
            </span>
          )}
        </div>
        <span>
          {new Date(memory.created_at).toLocaleString('zh-CN')}
        </span>
      </div>
    </motion.div>
  );
}
