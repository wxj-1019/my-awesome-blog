'use client';

import * as React from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

const ConfirmDialog = React.forwardRef<HTMLDivElement, ConfirmDialogProps>(
  ({
    isOpen,
    onClose,
    onConfirm,
    title = '确认操作',
    description = '您确定要执行此操作吗？',
    confirmText = '确认',
    cancelText = '取消',
    variant = 'danger',
    isLoading = false,
  }, ref) => {
    const [isConfirming, setIsConfirming] = React.useState(false);

    const handleConfirm = async () => {
      setIsConfirming(true);
      try {
        await onConfirm();
        onClose();
      } catch (error) {
        console.error('Confirm dialog error:', error);
      } finally {
        setIsConfirming(false);
      }
    };

    const variants = {
      danger: {
        icon: AlertTriangle,
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        confirmBg: 'bg-red-600 hover:bg-red-700',
      },
      warning: {
        icon: AlertTriangle,
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
      },
      info: {
        icon: Info,
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        confirmBg: 'bg-blue-600 hover:bg-blue-700',
      },
      success: {
        icon: CheckCircle,
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
        confirmBg: 'bg-green-600 hover:bg-green-700',
      },
    };

    const currentVariant = variants[variant];
    const VariantIcon = currentVariant.icon;

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              ref={ref}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="mx-4 overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <motion.div
                      className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                        currentVariant.iconBg
                      )}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    >
                      <VariantIcon className={cn('w-6 h-6', currentVariant.iconColor)} />
                    </motion.div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {title}
                      </h3>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        {description}
                      </p>
                    </div>

                    <button
                      onClick={onClose}
                      disabled={isConfirming || isLoading}
                      className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50"
                      aria-label="关闭"
                    >
                      <X className="w-5 h-5 text-foreground/50" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    disabled={isConfirming || isLoading}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cancelText}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    disabled={isConfirming || isLoading}
                    className={cn(
                      'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
                      currentVariant.confirmBg
                    )}
                  >
                    {(isConfirming || isLoading) && (
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      />
                    )}
                    {confirmText}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;
