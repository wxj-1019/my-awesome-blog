'use client';

import * as React from 'react';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, X, Check, AlertCircle } from 'lucide-react';

export interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  rightIcon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  onRightIconClick?: () => void;
  onClear?: () => void;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  showPasswordToggle?: boolean;
  animationDelay?: number;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({
    label,
    error,
    success,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    onRightIconClick,
    onClear,
    variant = 'default',
    size = 'md',
    loading = false,
    showPasswordToggle = false,
    animationDelay = 0,
    className: _className,
    type = 'text',
    value,
    onChange,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    React.useEffect(() => {
      setHasValue(!!value);
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleClear = () => {
      if (inputRef.current) {
        inputRef.current.value = '';
        setHasValue(false);
        const event = { target: inputRef.current } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(event);
      }
      onClear?.();
    };

    const sizeClasses = {
      sm: {
        input: 'h-9 px-3 text-sm',
        icon: 'w-4 h-4',
        label: 'text-xs',
      },
      md: {
        input: 'h-11 px-4 text-base',
        icon: 'w-5 h-5',
        label: 'text-sm',
      },
      lg: {
        input: 'h-13 px-5 text-lg',
        icon: 'w-6 h-6',
        label: 'text-base',
      },
    };

    const currentSize = sizeClasses[size];

    /* 只消费语义 token：primary / destructive / success 本身随主题切换，无需 dark: 分支 */
    const variantClasses = {
      default: {
        container: 'bg-glass/60',
        border: 'border-glass-border',
        focusBorder: 'focus:border-primary/50',
        focusRing: 'focus:ring-2 focus:ring-ring/40',
      },
      filled: {
        container: 'bg-secondary/50',
        border: 'border-transparent',
        focusBorder: 'focus:border-primary/50',
        focusRing: 'focus:ring-2 focus:ring-ring/40',
      },
      outlined: {
        container: 'bg-transparent',
        border: 'border-2 border-glass-border',
        focusBorder: 'focus:border-primary',
        focusRing: 'focus:ring-0',
      },
    };

    const currentVariant = variantClasses[variant];

    const stateClasses = {
      error: {
        border: 'border-destructive/50',
        focusBorder: 'focus:border-destructive',
        focusRing: 'focus:ring-destructive/20',
        iconColor: 'text-destructive',
      },
      success: {
        border: 'border-success/50',
        focusBorder: 'focus:border-success',
        focusRing: 'focus:ring-success/20',
        iconColor: 'text-success',
      },
    };

    const currentState = error ? stateClasses.error : success ? stateClasses.success : null;

    const inputType = type === 'password' && showPassword ? 'text' : type;
    const PasswordToggleIcon = showPassword ? Eye : EyeOff;

    return (
      <div className="relative">
        {label && (
          <motion.label
            className={cn(
              'block font-medium text-foreground mb-2',
              error && 'text-destructive',
              success && 'text-success',
              currentSize.label
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay / 1000, duration: 0.3 }}
          >
            {label}
          </motion.label>
        )}

        <motion.div
          className={cn(
            'relative rounded-xl border transition-[border-color,box-shadow] duration-200',
            currentVariant.container,
            currentVariant.border,
            currentVariant.focusBorder,
            currentVariant.focusRing,
            isFocused && 'shadow-tech-cyan',
            currentState?.border,
            currentState?.focusBorder,
            currentState?.focusRing,
            error && 'shadow-lg shadow-destructive/10',
            success && 'shadow-lg shadow-success/10',
            loading && 'opacity-60 pointer-events-none'
          )}
          initial={{ opacity: 0, y: 10, scale: 1 }}
          animate={{ opacity: 1, y: 0, scale: isFocused ? 1.01 : 1 }}
          transition={{ delay: animationDelay / 1000 + 0.1, duration: 0.3 }}
        >
          {LeftIcon && (
            <motion.div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2',
                isFocused ? 'text-primary' : 'text-foreground/50',
                currentSize.icon
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: animationDelay / 1000 + 0.2, duration: 0.2 }}
            >
              {React.isValidElement(LeftIcon) 
                ? LeftIcon 
                : typeof LeftIcon === 'function' 
                  ? <LeftIcon className={currentSize.icon} /> 
                  : null}
            </motion.div>
          )}

          <input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'w-full bg-transparent outline-none transition-colors duration-200',
              'placeholder:text-foreground/40',
              'text-foreground',
              currentSize.input,
              LeftIcon && 'pl-10',
              (RightIcon || showPasswordToggle || onClear || loading) && 'pr-10'
            )}
            {...props}
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading && (
              <motion.div
                className={currentSize.icon}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-full h-full border-2 border-primary/30 border-t-primary rounded-full" />
              </motion.div>
            )}

            {hasValue && onClear && !loading && (
              <motion.button
                type="button"
                onClick={handleClear}
                className={cn(currentSize.icon, 'text-foreground/40 hover:text-foreground/70 transition-colors')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                aria-label="清除"
              >
                <X className={currentSize.icon} aria-hidden="true" />
              </motion.button>
            )}

            {showPasswordToggle && !loading && (
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(currentSize.icon, 'text-foreground/40 hover:text-foreground/70 transition-colors')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                <PasswordToggleIcon className={currentSize.icon} aria-hidden="true" />
              </motion.button>
            )}

            {RightIcon && !loading && (
              <motion.button
                type="button"
                onClick={onRightIconClick}
                className={cn(
                  currentSize.icon,
                  isFocused ? 'text-primary' : 'text-foreground/50',
                  'transition-colors'
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: animationDelay / 1000 + 0.2, duration: 0.2 }}
                aria-label="操作"
              >
                {React.isValidElement(RightIcon) 
                  ? RightIcon 
                  : typeof RightIcon === 'function' 
                    ? <RightIcon className={currentSize.icon} aria-hidden="true" /> 
                    : null}
              </motion.button>
            )}

            {success && !loading && (
              <motion.div
                className={cn(currentSize.icon, currentState?.iconColor)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Check className={currentSize.icon} />
              </motion.div>
            )}

            {error && !loading && (
              <motion.div
                className={cn(currentSize.icon, currentState?.iconColor)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <AlertCircle className={currentSize.icon} />
              </motion.div>
            )}
          </div>
        </motion.div>

        {(error || success) && (
          <motion.div
            className={cn(
              'mt-1.5 text-xs flex items-center gap-1',
              error && 'text-destructive',
              success && 'text-success'
            )}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {error || success}
          </motion.div>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
