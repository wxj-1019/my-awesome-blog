'use client';

import { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Eye, Heart, Clock, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import type { Article } from '@/types';

interface HoloCardProps {
  article: Article;
  isFeatured?: boolean;
  className?: string;
}

function HoloCard({ article, isFeatured = false, className }: HoloCardProps) {
  const { getThemeClass } = useThemedClasses();
  const [isExpanded, setIsExpanded] = useState(false);

  const cardSize = isFeatured ? 'lg:col-span-2 lg:row-span-2' : '';

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return (
    <>
      <div
        className={`
          relative group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-lg
          ${getThemeClass(
            'bg-glass/30 backdrop-blur-xl border border-glass-border shadow-inner before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:bg-gradient-to-br before:from-white/5 before:to-transparent',
            'bg-white/90 backdrop-blur-xl border-gray-300 shadow-gray-200/50 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:bg-gradient-to-br before:from-black/5 before:to-transparent'
          )}
          ${cardSize}
          ${className || ''}
        `}
      >
        <div
          style={{
            backgroundImage: article.cover_image
              ? `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%), url(${article.cover_image})`
              : 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          className="relative aspect-video"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {article.categories && article.categories.length > 0 && (
            <div className="absolute top-4 left-4">
              <span className={`
                px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
                ${getThemeClass(
                  'bg-[#EC4899]/90 text-white',
                  'bg-[#EC4899]/90 text-white'
                )}
              `}>
                {article.categories[0]?.name}
              </span>
            </div>
          )}

          {article.tags && article.tags.length > 0 && (
            <div className="absolute top-4 right-4 flex flex-wrap gap-1 justify-end">
              {article.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className={`
                    px-2 py-1 rounded text-xs backdrop-blur-sm
                    ${getThemeClass(
                      'bg-white/10 text-white',
                      'bg-white/80 text-gray-800'
                    )}
                  `}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className={`
              text-xl font-bold text-white mb-2 line-clamp-2
              group-hover:text-[#EC4899] transition-colors
            `}>
              {article.title}
            </h3>
            <p className={`
              text-sm text-gray-300 line-clamp-2 mb-4
              ${getThemeClass('', 'text-gray-600')}
            `}>
              {article.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-[#EC4899]" />
                  <span className="text-xs text-gray-300">{article.view_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-[#EC4899]" />
                  <span className="text-xs text-gray-300">{article.likes_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-300">{article.read_time} min</span>
                </div>
              </div>

              <button
                onClick={e => {
                  e.preventDefault();
                  handleExpand();
                }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 hover:scale-110 active:scale-95 backdrop-blur-sm transition-all duration-200"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCollapse}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className={`
                w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl
                ${getThemeClass(
                  'bg-glass/95 border border-glass-border shadow-inner backdrop-blur-xl',
                  'bg-white/95 border border-gray-300 shadow-gray-200/50 backdrop-blur-xl'
                )}
              `}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 backdrop-blur-lg border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {article.cover_image && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={article.cover_image}
                          alt={article.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h2 className={`text-xl font-bold ${getThemeClass('text-white', 'text-gray-900')}`}>
                        {article.title}
                      </h2>
                      <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')}`}>
                        {article.author.username} · {new Date(article.published_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCollapse}
                    className="p-2 rounded-full hover:bg-white/10 transition-all"
                  >
                    <svg className={`w-6 h-6 ${getThemeClass('text-white', 'text-gray-800')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {article.categories && article.categories.length > 0 && (
                      <span className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${getThemeClass(
                          'bg-[#EC4899]/90 text-white',
                          'bg-[#EC4899]/90 text-white'
                        )}
                      `}>
                        {article.categories[0]?.name}
                      </span>
                    )}
                    {article.tags?.map(tag => (
                      <span
                        key={tag.id}
                        className={`
                          px-3 py-1 rounded-full text-sm
                          ${getThemeClass(
                            'bg-white/10 text-white',
                            'bg-gray-200 text-gray-800'
                          )}
                        `}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  <p className={`text-lg leading-relaxed ${getThemeClass('text-white', 'text-gray-800')}`}>
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-[#EC4899]" />
                        <span className={getThemeClass('text-white', 'text-gray-800')}>{article.view_count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-[#EC4899]" />
                        <span className={getThemeClass('text-white', 'text-gray-800')}>{article.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className={getThemeClass('text-white', 'text-gray-800')}>{article.read_time} min</span>
                      </div>
                    </div>

                    <Link
                      href={`/articles/${article.id}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#EC4899] text-white rounded-full font-semibold hover:bg-[#EC4899]/90 transition-all active:scale-95"
                    >
                      阅读全文
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
}

const HoloCardWithMemo = memo(HoloCard);
HoloCardWithMemo.displayName = 'HoloCard';

export default HoloCardWithMemo;
