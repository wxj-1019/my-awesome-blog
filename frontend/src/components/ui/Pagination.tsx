'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  showItemsInfo?: boolean;
}

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
  showItemsInfo = true
}: PaginationProps) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <motion.div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4",
        "bg-gradient-to-br from-glass/20 to-glass/10 backdrop-blur-xl",
        "border border-glass-border/30 rounded-2xl p-4 shadow-lg",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Items Info */}
      {showItemsInfo && (
        <div className="text-sm text-foreground/70">
          显示第 <span className="font-medium text-foreground">{startIndex}</span> 到{' '}
          <span className="font-medium text-foreground">{endIndex}</span> 条，
          共 <span className="font-medium text-foreground">{totalItems}</span> 条记录
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <motion.button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
            currentPage === 1
              ? "bg-glass/10 text-foreground/30 cursor-not-allowed"
              : "bg-glass/30 text-foreground/70 hover:bg-glass/50 hover:text-foreground hover:-translate-y-0.5"
          )}
          whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
          whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="w-10 h-10 flex items-center justify-center text-foreground/50"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </div>
              );
            }

            return (
              <motion.button
                key={page as number}
                onClick={() => onPageChange(page as number)}
                className={cn(
                  "w-10 h-10 rounded-xl font-medium transition-all duration-300 flex items-center justify-center",
                  page === currentPage
                    ? "bg-gradient-to-br from-tech-cyan to-tech-sky text-white shadow-lg shadow-tech-cyan/30"
                    : "bg-glass/30 text-foreground/70 hover:bg-glass/50 hover:text-foreground hover:-translate-y-0.5"
                )}
                whileHover={page !== currentPage ? { scale: 1.05 } : {}}
                whileTap={page !== currentPage ? { scale: 0.95 } : {}}
                animate={page === currentPage ? { scale: 1.05 } : { scale: 1 }}
              >
                {page}
              </motion.button>
            );
          })}
        </div>

        {/* Next Button */}
        <motion.button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
            currentPage === totalPages
              ? "bg-glass/10 text-foreground/30 cursor-not-allowed"
              : "bg-glass/30 text-foreground/70 hover:bg-glass/50 hover:text-foreground hover:-translate-y-0.5"
          )}
          whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
          whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Pagination;