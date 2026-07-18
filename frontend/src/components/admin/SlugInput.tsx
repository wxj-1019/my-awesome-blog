'use client';
import * as React from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Unlock,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
export interface SlugInputProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  onGenerateFromTitle?: () => string;
  onValidate?: (slug: string) => Promise<{ valid: boolean; message?: string }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showValidation?: boolean;
  autoGenerate?: boolean;
  existingSlugs?: string[];
}
const SlugInput = React.forwardRef<HTMLInputElement, SlugInputProps>(
  ({
    value,
    onChange,
    title = '',
    onGenerateFromTitle,
    onValidate,
    placeholder = 'article-url-slug',
    disabled = false,
    className,
    showValidation = true,
    autoGenerate = true,
    existingSlugs = [],
  }, ref) => {
    const [isLocked, setIsLocked] = React.useState(false);
    const [isValidating, setIsValidating] = React.useState(false);
    const [validationResult, setValidationResult] = React.useState<{
      valid: boolean;
      message?: string;
    } | null>(null);
    const [copied, setCopied] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current!);
    const generateSlug = React.useCallback((text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
    }, []);
    const validateSlug = React.useCallback(async (slug: string) => {
      if (!slug) {
        setValidationResult(null);
        return;
      }
      if (existingSlugs.includes(slug)) {
        setValidationResult({
          valid: false,
          message: '此别名已被使用',
        });
        return;
      }
      const invalidPattern = /[^a-z0-9-]/;
      if (invalidPattern.test(slug)) {
        setValidationResult({
          valid: false,
          message: '别名只能包含小写字母、数字和连字符',
        });
        return;
      }
      if (slug.startsWith('-') || slug.endsWith('-')) {
        setValidationResult({
          valid: false,
          message: '别名不能以连字符开头或结尾',
        });
        return;
      }
      if (slug.length < 3) {
        setValidationResult({
          valid: false,
          message: '别名至少需要3个字符',
        });
        return;
      }
      if (onValidate) {
        setIsValidating(true);
        try {
          const result = await onValidate(slug);
          setValidationResult(result);
        } catch {
          setValidationResult({
            valid: false,
            message: '验证失败，请重试',
          });
        } finally {
          setIsValidating(false);
        }
      } else {
        setValidationResult({ valid: true });
      }
    }, [existingSlugs, onValidate]);
    React.useEffect(() => {
      if (autoGenerate && title && !isLocked && !value) {
        const newSlug = generateSlug(title);
        onChange(newSlug);
      }
    }, [title, autoGenerate, isLocked, value, generateSlug, onChange]);
    React.useEffect(() => {
      const timer = setTimeout(() => {
        if (value) {
          validateSlug(value);
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [value, validateSlug]);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
      onChange(newValue);
    };
    const handleRegenerate = () => {
      if (onGenerateFromTitle) {
        const newSlug = onGenerateFromTitle();
        onChange(generateSlug(newSlug));
      } else if (title) {
        onChange(generateSlug(title));
      }
    };
    const toggleLock = () => {
      setIsLocked(!isLocked);
    };
    const handleCopy = async () => {
      if (value) {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };
    const getValidationIcon = () => {
      if (isValidating) {
        return <Loader2 className="w-4 h-4 animate-spin text-tech-cyan" />;
      }
      if (!validationResult || !value) {
        return null;
      }
      if (validationResult.valid) {
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      }
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    };
    return (
      <div className={cn('relative', className)}>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground/80">
            文章别名 (Slug)
            <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLock}
              className={cn(
                'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all',
                isLocked
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-tech-cyan/10 text-tech-cyan hover:bg-tech-cyan/20'
              )}
              title={isLocked ? '点击解锁自动生成' : '点击锁定，禁止自动生成'}
            >
              {isLocked ? (
                <>
                  <Lock className="w-3 h-3" />
                  已锁定
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" />
                  自动
                </>
              )}
            </button>
          </div>
        </div>
        <motion.div
          className={cn(
            'relative flex items-center rounded-xl border transition-all duration-200',
            'bg-background/50 backdrop-blur-sm',
            validationResult?.valid && 'border-green-500/50 focus-within:border-green-500',
            validationResult && !validationResult.valid && 'border-red-500/50 focus-within:border-red-500',
            !validationResult && 'border-border/50 focus-within:border-tech-cyan/50',
            disabled && 'opacity-60 pointer-events-none'
          )}
        >
          <div className="flex items-center pl-4 pr-2 text-foreground/40">
            <Link2 className="w-4 h-4" />
            <span className="ml-2 text-sm">/</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'flex-1 py-3 pr-2 bg-transparent outline-none text-foreground',
              'placeholder:text-foreground/30 text-sm'
            )}
          />
          <div className="flex items-center gap-1 pr-2">
            <AnimatePresence mode="wait">
              {getValidationIcon() && (
                <motion.div
                  key={validationResult?.valid ? 'valid' : 'invalid'}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {getValidationIcon()}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={disabled || !title}
              className={cn(
                'p-1.5 rounded-md transition-all',
                'text-foreground/40 hover:text-foreground hover:bg-background/50',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              title="根据标题重新生成"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!value}
              className={cn(
                'p-1.5 rounded-md transition-all',
                'text-foreground/40 hover:text-foreground hover:bg-background/50',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              title="复制别名"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="copied"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>
        <AnimatePresence>
          {showValidation && validationResult && !validationResult.valid && validationResult.message && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="mt-2"
            >
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {validationResult.message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {value && validationResult?.valid && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-xs text-green-500 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3 h-3" />
            别名格式正确
          </motion.p>
        )}
        <p className="mt-1.5 text-xs text-foreground/40">
          别名用于文章URL，只能包含小写字母、数字和连字符
        </p>
      </div>
    );
  }
);
SlugInput.displayName = 'SlugInput';
export default SlugInput;