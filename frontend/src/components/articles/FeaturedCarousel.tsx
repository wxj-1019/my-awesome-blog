'use client';
import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { ArrowRight, Clock, Eye, Heart } from 'lucide-react';
import type { Article } from '@/types';
interface FeaturedCarouselProps {
  articles: Article[];
}
function FeaturedCarousel({ articles }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const { getThemeClass } = useThemedClasses();
  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      if (newDirection === 1) {
        return prevIndex === articles.length - 1 ? 0 : prevIndex + 1;
      } else {
        return prevIndex === 0 ? articles.length - 1 : prevIndex - 1;
      }
    });
  }, [articles.length]);
  const handleDotClick = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);
  const currentArticle = articles[currentIndex];
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
      zIndex: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };
  if (articles.length === 0) {return null;}
  return (
    <section className="relative h-[80vh] w-full overflow-hidden bg-black">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-8">
            <div className="hidden lg:block w-1/3">
              <div className="space-y-8">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-tech-cyan to-purple-500 mb-6"
                >
                  {currentArticle.title}
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`text-lg ${getThemeClass('text-gray-300', 'text-gray-700')} mb-6 line-clamp-3`}
                >
                  {currentArticle.excerpt}
                </motion.p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-tech-cyan" />
                    <span className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')}`}>
                      {currentArticle.view_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')}`}>
                      {currentArticle.likes_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-tech-deepblue" />
                    <span className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')}`}>
                      {currentArticle.read_time} min
                    </span>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link
                    href={`/articles/${currentArticle.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-tech-cyan text-white rounded-full font-semibold hover:bg-tech-cyan/90 transition-all active:scale-95"
                  >
                    阅读文章
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </div>
            </div>
            <div className="w-full lg:w-2/3 relative">
              {currentArticle.cover_image && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl"
                >
                  <Image
                    src={currentArticle.cover_image}
                    alt={currentArticle.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getThemeClass('bg-tech-cyan/90 text-white', 'bg-blue-600/90 text-white')}`}>
                      {currentArticle.category?.name || '未分类'}
                    </span>
                  </div>
                </motion.div>
              )}
              <button
                onClick={() => paginate(1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all z-20 active:scale-95"
                aria-label="下一篇"
              >
                <ArrowRight className="w-6 h-6 text-white" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {articles.map((article, index) => (
          <button
            key={article.id}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-tech-cyan w-8' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`转到第 ${index + 1} 篇文章`}
          />
        ))}
      </div>
      <div className="absolute bottom-8 right-8 hidden md:flex items-center gap-2 z-20">
        <span className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')}`}>
          {currentIndex + 1} / {articles.length}
        </span>
      </div>
    </section>
  );
}
const FeaturedCarouselWithMemo = memo(FeaturedCarousel);
FeaturedCarouselWithMemo.displayName = 'FeaturedCarousel';
export default FeaturedCarouselWithMemo;