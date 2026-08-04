'use client';
import { motion } from '@/lib/framer-motion';
import { Copy, Edit, Trash2, Eye, TrendingUp } from 'lucide-react';
import type { Prompt } from '@/types';
interface PromptCardProps {
  prompt: Prompt;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (prompt: Prompt) => void;
}
export default function PromptCard({ prompt, onEdit, onDelete, onDuplicate }: PromptCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-xl p-4 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-white mb-1">{prompt.name}</h3>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>v{prompt.version}</span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded ${
              prompt.is_active ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {prompt.is_active ? '活跃' : '未活跃'}
            </span>
            {prompt.category && (
              <>
                <span>•</span>
                <span>{prompt.category}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicate(prompt)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            title="复制"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(prompt.id)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(prompt.id)}
            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-white/80 mb-4 line-clamp-2">
        {prompt.description || prompt.content}
      </p>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-tech-cyan" />
          <div>
            <p className="text-xs text-white/50">使用次数</p>
            <p className="text-sm font-medium text-white">{prompt.usage_count}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-tech-cyan" />
          <div>
            <p className="text-xs text-white/50">成功率</p>
            <p className="text-sm font-medium text-white">{prompt.success_rate}%</p>
          </div>
        </div>
      </div>
      {prompt.ab_test_group && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
            prompt.ab_test_group === 'A' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
          }`}>
            <span className="font-medium">A/B 测试</span>
            <span>•</span>
            <span>分组 {prompt.ab_test_group}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}