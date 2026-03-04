'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface LoadingStateProps {
  message?: string
  className?: string
}

export default function LoadingState({ message = '加载中...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="w-12 h-12 border-4 border-t-4 border-b-4 border-tech-cyan/30 rounded-full animate-spin mb-4" />
      <p className="text-gray-400">{message}</p>
    </div>
  )
}
