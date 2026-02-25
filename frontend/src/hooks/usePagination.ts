import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage: number;
  onPageChange?: (page: number) => void;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  reset: () => void;
}

export function usePagination({ totalItems, itemsPerPage, onPageChange }: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPagesRef = useRef(Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    totalPagesRef.current = Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  }, [currentPage, hasNextPage, onPageChange, setCurrentPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  }, [currentPage, hasPrevPage, onPageChange, setCurrentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      onPageChange?.(page);
    }
  }, [currentPage, totalPages, onPageChange, setCurrentPage]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    onPageChange?.(1);
  }, [onPageChange, setCurrentPage]);

  return {
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    reset
  };
}
