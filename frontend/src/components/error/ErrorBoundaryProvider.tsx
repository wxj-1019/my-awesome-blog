'use client';

import { ReactNode, createContext, useContext } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface ErrorBoundaryContextType {
  resetError: () => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextType | null>(null);

export function useErrorBoundary() {
  const context = useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error('useErrorBoundary must be used within an ErrorBoundaryProvider');
  }
  return context;
}

interface ErrorBoundaryProviderProps {
  children: ReactNode;
  showDetails?: boolean;
}

export function ErrorBoundaryProvider({ 
  children, 
  showDetails = false 
}: ErrorBoundaryProviderProps) {
  return (
    <ErrorBoundaryContext.Provider value={{ resetError: () => {} }}>
      <ErrorBoundary showDetails={showDetails}>
        {children}
      </ErrorBoundary>
    </ErrorBoundaryContext.Provider>
  );
}