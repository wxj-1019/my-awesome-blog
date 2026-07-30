'use client';

import * as React from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
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
    bgColor: 'bg-success dark:bg-success/20',
    iconColor: 'text-success dark:text-success',
    borderColor: 'border-success dark:border-success',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-destructive dark:bg-destructive/20',
    iconColor: 'text-destructive dark:text-destructive',
    borderColor: 'border-destructive dark:border-destructive',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-warning dark:bg-warning/20',
    iconColor: 'text-warning dark:text-warning',
    borderColor: 'border-warning dark:border-warning',
  },
  info: {
    icon: Info,
    bgColor: 'bg-cat-1 dark:bg-cat-1/20',
    iconColor: 'text-cat-1 dark:text-cat-1',
    borderColor: 'border-cat-1 dark:border-cat-1',
  },
};

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ id, type = 'info', title, message, duration = 5000, onClose }, ref) => {
    const [progress, setProgress] = React.useState(100);
    const [isVisible, setIsVisible] = React.useState(true);

    const variant = toastVariants[type];
    const VariantIcon = variant.icon;

    const handleClose = React.useCallback(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.(id);
      }, 300);
    }, [onClose, id]);

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
    }, [duration, handleClose]);

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
                aria-label="关闭"
              >
                <X className="w-4 h-4 text-foreground/50" aria-hidden="true" />
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

interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, options?: Partial<ToastProps>) => string;
  error: (message: string, options?: Partial<ToastProps>) => string;
  warning: (message: string, options?: Partial<ToastProps>) => string;
  info: (message: string, options?: Partial<ToastProps>) => string;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/**
 * Toast 状态管理（原 useToast 的内部实现）。
 *
 * 历史问题：useToast 每次调用都创建独立的局部状态，子组件里弹的 toast
 * 只在它自己的（未渲染的）状态里，永远不会显示。改为 Context 共享后，
 * 任意层级组件弹出的 toast 都由 ToastProvider 统一渲染。
 */
const useToastState = (): ToastContextValue => {
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

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/** 在 admin 布局根部挂载一次，子树内所有 useToast 共享同一组 toast。 */
export const ToastProvider = ({
  children,
  position = 'top-right',
}: ToastProviderProps) => {
  const value = useToastState();
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer
        toasts={value.toasts}
        onClose={value.removeToast}
        position={position}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast 必须在 <ToastProvider> 内使用（见 admin/layout.tsx）');
  }
  return ctx;
};
