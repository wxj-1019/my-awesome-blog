'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose?: (id: string) => void;
}

const toastVariants = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
};

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ id, type = 'info', title, message, duration = 5000, onClose }, ref) => {
    const [progress, setProgress] = React.useState(100);
    const [isVisible, setIsVisible] = React.useState(true);

    const variant = toastVariants[type];
    const VariantIcon = variant.icon;

    React.useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress < 0 ? 0 : newProgress;
        });
      }, 100);

      const timeout = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }, [duration]);

    const handleClose = () => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.(id);
      }, 300);
    };

    return (
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative overflow-hidden"
          >
            <div
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xl min-w-[320px] max-w-md',
                variant.bgColor,
                variant.borderColor
              )}
            >
              <div className={cn('flex-shrink-0', variant.iconColor)}>
                <VariantIcon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                {title && (
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    {title}
                  </h4>
                )}
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {message}
                </p>
              </div>

              <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-black/10 transition-colors"
              >
                <X className="w-4 h-4 text-foreground/50" />
              </button>
            </div>

            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-current opacity-20"
              style={{ width: `${progress}%` }}
              initial={{ width: '100%' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

Toast.displayName = 'Toast';

export default Toast;

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose?: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ToastContainer = ({
  toasts,
  onClose,
  position = 'top-right',
}: ToastContainerProps) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-3 pointer-events-none',
        positionClasses[position]
      )}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback(
    (toast: Omit<ToastProps, 'id'>) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { ...toast, id }]);
      return id;
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = React.useCallback(
    (message: string, options?: Partial<ToastProps>) => {
      return addToast({ ...options, type: 'success', message });
    },
    [addToast]
  );

  const error = React.useCallback(
    (message: string, options?: Partial<ToastProps>) => {
      return addToast({ ...options, type: 'error', message });
    },
    [addToast]
  );

  const warning = React.useCallback(
    (message: string, options?: Partial<ToastProps>) => {
      return addToast({ ...options, type: 'warning', message });
    },
    [addToast]
  );

  const info = React.useCallback(
    (message: string, options?: Partial<ToastProps>) => {
      return addToast({ ...options, type: 'info', message });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
};
