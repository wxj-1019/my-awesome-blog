'use client'

import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

const toastVariants = {
  default: {
    icon: Info,
    className: "border-tech-cyan/30 bg-glass/30 backdrop-blur-xl border-glass-border"
  },
  success: {
    icon: CheckCircle,
    className: "border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl border-emerald-500/30"
  },
  error: {
    icon: AlertCircle,
    className: "border-red-500/30 bg-red-500/10 backdrop-blur-xl border-red-500/30"
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-500/30 bg-amber-500/10 backdrop-blur-xl border-amber-500/30"
  },
  destructive: {
    icon: AlertCircle,
    className: "border-red-500/50 bg-red-500/20 backdrop-blur-xl border-red-500/50"
  }
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, action, variant = 'default', open: _open, onOpenChange: _onOpenChange, ...props }) {
        const toastVariant = toastVariants[variant as keyof typeof toastVariants] || toastVariants.default
        const Icon = toastVariant.icon

        return (
          <div
            key={id}
            className={cn(
              "group pointer-events-auto relative flex w-full items-start justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-2xl",
              "transition-transform duration-300 ease-out",
              "data-[swipe=cancel]:translate-x-0",
              "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
              "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
              "data-[swipe=move]:transition-none",
              "data-[state=open]:animate-in",
              "data-[state=closed]:animate-out",
              "data-[swipe=end]:animate-out",
              "data-[state=closed]:fade-out-80",
              "data-[state=closed]:slide-out-to-right-full",
              "data-[state=open]:slide-in-from-top-full",
              "data-[state=open]:sm:slide-in-from-bottom-full",
              toastVariant.className,
              "hover:shadow-2xl hover:shadow-tech-cyan/10"
            )}
            {...props}
          >
            <div className="flex items-start space-x-3 flex-1">
              <div className={cn(
                "flex-shrink-0 mt-0.5",
                variant === 'success' && "text-emerald-400",
                variant === 'error' || variant === 'destructive' ? "text-red-400" : "",
                variant === 'warning' ? "text-amber-400" : "",
                variant === 'default' && "text-tech-cyan"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="grid gap-1.5 flex-1 min-w-0">
                {title && (
                  <div className="text-sm font-semibold text-white leading-tight">
                    {title}
                  </div>
                )}
                {description && (
                  <div className="text-sm text-white/80 leading-relaxed break-words">
                    {description}
                  </div>
                )}
              </div>
            </div>
            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
            <button
              onClick={() => dismiss(id)}
              className={cn(
                "absolute right-2 top-2 rounded-md p-1.5",
                "text-white/50 opacity-0 transition-colors duration-200",
                "hover:text-white hover:bg-white/10",
                "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20",
                "group-hover:opacity-100"
              )}
              aria-label="关闭提示"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
