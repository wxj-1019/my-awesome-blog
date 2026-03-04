'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'
import { cn } from '@/lib/utils'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'warning' | 'info'
}

const VARIANT_CLASSES = {
  destructive: 'border-red-500/30',
  warning: 'border-yellow-500/30',
  info: 'border-blue-500/30',
}

const BUTTON_VARIANT = {
  destructive: 'destructive' as const,
  warning: 'default' as const,
  info: 'default' as const,
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <GlassCardAdmin
              className={cn('max-w-md w-full', VARIANT_CLASSES[variant])}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-300 mb-6">{message}</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose}>
                  {cancelText}
                </Button>
                <Button variant={BUTTON_VARIANT[variant]} onClick={onConfirm}>
                  {confirmText}
                </Button>
              </div>
            </GlassCardAdmin>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
