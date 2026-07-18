'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Sparkles } from 'lucide-react';
import type { MemorySearchResult } from '@/types';

interface MemorySearchProps {
  onSearch: (query: string) => void;
  results?: MemorySearchResult[];
  searching?: boolean;
}

export default function MemorySearch({ onSearch, results, searching }: MemorySearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-xl p-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索记忆（语义检索）..."
            className="w-full bg-white/5 text-white placeholder:text-white/50 rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              aria-label="清除"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim() || searching}
          className="flex items-center gap-2 bg-tech-cyan hover:bg-tech-lightcyan text-white rounded-lg px-4 py-2.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {searching ? (
            <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">搜索</span>
        </button>
      </div>

      {results && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="space-y-2 pt-3 border-t border-white/10"
        >
          <p className="text-xs text-white/50 mb-2">找到 {results.length} 条相关记忆</p>
          {results.map((result, index) => (
            <motion.div
              key={result.memory.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                  result.memory.memory_type === 'short_term'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  <span>{result.memory.memory_type === 'short_term' ? '短期' : '长期'}</span>
                </span>
                <span className="text-xs text-tech-cyan font-medium">
                  相似度 {Math.round(result.similarity_score * 100)}%
                </span>
              </div>
              <p className="text-sm text-white/80 line-clamp-2">
                {result.memory.content}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {results && results.length === 0 && !searching && query && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Search className="w-12 h-12 mx-auto text-white/30 mb-3" />
          <p className="text-sm text-white/50">未找到相关记忆</p>
          <p className="text-xs text-white/30 mt-1">尝试使用不同的关键词</p>
        </motion.div>
      )}
    </motion.div>
  );
}
