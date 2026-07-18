'use client';
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false 
    };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error 
    };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 错误状态已由 getDerivedStateFromError 设置，此处不再重复 setState
    // 调用外部错误处理函数
    this.props.onError?.(error, errorInfo);
    // 生产环境可以发送错误报告到监控服务
    if (process.env.NODE_ENV === 'production') {
      // 这里可以集成错误监控服务如 Sentry
      this.reportError(error, errorInfo);
    }
  }
  private reportError(error: Error, errorInfo: ErrorInfo) {
    // 错误上报逻辑
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };
    // 避免 unused 告警，同时保留上报数据结构
    void errorReport;
    // 发送到错误监控服务
    // fetch('/api/error-report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // }).catch(console.error);
  }
  private handleRetry = () => {
    this.setState({ 
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };
  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback 组件
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // 默认错误 UI
      return (
        <div 
          className={cn(
            "min-h-screen flex items-center justify-center p-4",
            "bg-gradient-to-br from-destructive/10 via-background to-destructive/5"
          )}
          role="alert"
          aria-live="polite"
        >
          <div className={cn(
            "max-w-md w-full bg-glass backdrop-blur-xl border border-destructive/30",
            "rounded-2xl p-8 shadow-2xl text-center"
          )}>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                出现了一些问题
              </h2>
              <p className="text-foreground/70">
                很抱歉，页面加载出现了意外错误。请尝试刷新页面或稍后重试。
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                aria-label="重试加载页面"
              >
                <RefreshCw className="h-4 w-4" />
                重试
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
                aria-label="刷新页面"
              >
                刷新页面
              </Button>
            </div>
            {this.props.showDetails && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-foreground/70 hover:text-foreground">
                  查看错误详情
                </summary>
                <div className="mt-2 p-3 bg-destructive/5 rounded-lg">
                  <p className="text-sm font-mono text-destructive">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 text-xs text-foreground/60 overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
            <div className="mt-6 text-xs text-foreground/50">
              错误ID: {this.state.error?.message.substring(0, 8) || 'unknown'}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;