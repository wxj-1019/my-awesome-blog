'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { motion } from '@/lib/framer-motion';

interface MessagePaginationProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  showEdgeButtons?: boolean;
  showEllipsis?: boolean;
}

const MessagePagination = ({
  currentPage: propCurrentPage = 1,
  totalPages: propTotalPages = 1,
  onPageChange = () => {},
  className,
  showEdgeButtons = true,
  showEllipsis: _showEllipsis = true
}: MessagePaginationProps) => {
  const currentPage = (typeof propCurrentPage === 'number' && !isNaN(propCurrentPage)) ? propCurrentPage : 1;
  const totalPages = (typeof propTotalPages === 'number' && !isNaN(propTotalPages)) ? propTotalPages : 1;

  const { getThemeClass } = useThemedClasses();

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (totalPages <= 1) {return null;}

  const pageNumbers = getPageNumbers();

  return (
    <motion.div
      className={cn('flex items-center justify-center gap-2', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      key={currentPage}
    >
      {showEdgeButtons && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={cn(
              'w-10 h-10 p-0',
              getThemeClass(
                'border-glass-border text-foreground hover:bg-glass/40',
                'border-gray-300 text-gray-700 hover:bg-gray-100'
              )
            )}
            aria-label="首页"
          >
            <ChevronsLeft className="w-4 h-4" aria-hidden="true" />
          </Button>
        </motion.div>
      )}

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'w-10 h-10 p-0',
            getThemeClass(
              'border-glass-border text-foreground hover:bg-glass/40',
              'border-gray-300 text-gray-700 hover:bg-gray-100'
            )
          )}
          aria-label="上一页"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Button>
      </motion.div>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => (
          typeof page === 'number' ? (
            <motion.div
              key={page}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              <Button
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={cn(
                  'w-10 h-10 p-0 font-medium',
                  currentPage === page
                    ? 'bg-tech-cyan text-black'
                    : getThemeClass(
                        'border-glass-border text-foreground hover:bg-glass/40',
                        'border-gray-300 text-gray-700 hover:bg-gray-100'
                      )
                )}
              >
                {page}
              </Button>
            </motion.div>
          ) : (
            // 省略号占位符：使用 index 作为 key
            <motion.span
              key={index}
              className={cn(
                'w-10 h-10 flex items-center justify-center text-sm',
                getThemeClass('text-foreground/50', 'text-gray-400')
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ...
            </motion.span>
          )
        ))}
      </div>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'w-10 h-10 p-0',
            getThemeClass(
              'border-glass-border text-foreground hover:bg-glass/40',
              'border-gray-300 text-gray-700 hover:bg-gray-100'
            )
          )}
          aria-label="下一页"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </motion.div>

      {showEdgeButtons && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={cn(
              'w-10 h-10 p-0',
              getThemeClass(
                'border-glass-border text-foreground hover:bg-glass/40',
                'border-gray-300 text-gray-700 hover:bg-gray-100'
              )
            )}
            aria-label="末页"
          >
            <ChevronsRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </motion.div>
      )}

      <motion.div
        className={cn(
          'px-4 py-2 rounded-lg text-sm',
          getThemeClass(
            'bg-glass/20 text-foreground/70',
            'bg-gray-100 text-gray-600'
          )
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        第 {currentPage} / {totalPages} 页
      </motion.div>
    </motion.div>
  );
};

export default MessagePagination;