'use client';

import { useState, useCallback } from 'react';

interface UseErrorBoundaryReturn {
  error: Error | null;
  hasError: boolean;
  setError: (error: Error | null) => void;
  resetError: () => void;
}

export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    hasError: error !== null,
    setError,
    resetError
  };
}