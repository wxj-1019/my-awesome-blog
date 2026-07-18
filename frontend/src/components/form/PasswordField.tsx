'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemedClasses } from '@/hooks/useThemedClasses';

export interface PasswordStrength {
  score: number;
  feedback: string;
  color: string;
}

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showStrength?: boolean;
  minLength?: number;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const calculateStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length === 0) {
    return { score: 0, feedback: '', color: 'bg-gray-300' };
  }

  if (password.length >= 8) {score += 1;}
  else {feedback.push('至少8个字符');}

  if (password.length >= 12) {score += 1;}

  if (/[a-z]/.test(password)) {score += 1;}
  else {feedback.push('小写字母');}

  if (/[A-Z]/.test(password)) {score += 1;}
  else {feedback.push('大写字母');}

  if (/[0-9]/.test(password)) {score += 1;}
  else {feedback.push('数字');}

  if (/[^a-zA-Z0-9]/.test(password)) {score += 1;}
  else {feedback.push('特殊字符');}

  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-emerald-500'
  ];

  const messages = [
    '非常弱',
    '弱',
    '一般',
    '强',
    '很强',
    '非常强'
  ];

  return {
    score: Math.min(5, score),
    feedback: feedback.slice(0, 2).join('、') || messages[Math.min(5, score)],
    color: colors[Math.min(5, score)]
  };
};

export default function PasswordField({
  value,
  onChange,
  label,
  placeholder = '请输入密码',
  showStrength = true,
  minLength = 8,
  required = false,
  error,
  disabled = false,
  className
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { getThemeClass } = useThemedClasses();
  const strength = calculateStrength(value);

  const requirements = [
    { id: 'length', label: `${minLength}个字符以上`, check: value.length >= minLength },
    { id: 'lower', label: '包含小写字母', check: /[a-z]/.test(value) },
    { id: 'upper', label: '包含大写字母', check: /[A-Z]/.test(value) },
    { id: 'number', label: '包含数字', check: /[0-9]/.test(value) },
    { id: 'special', label: '包含特殊字符', check: /[^a-zA-Z0-9]/.test(value) },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium flex items-center gap-1">
          <Lock className="w-4 h-4" />
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full pl-4 pr-12 py-3 rounded-lg border transition-all',
            getThemeClass(
              error
                ? 'border-red-500 focus:ring-red-500/20 text-foreground'
                : 'border-glass-border focus:ring-tech-cyan/20 text-foreground',
              'border-gray-300 focus:ring-blue-500/20 text-gray-800'
            ),
            'focus:outline-none focus:ring-2 focus:border-transparent',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />

        <motion.button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={showPassword ? '隐藏密码' : '显示密码'}
        >
          {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
        </motion.button>
      </div>

      {showStrength && value && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-300 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(strength.score / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
                className={cn('h-full transition-colors', strength.color)}
              />
            </div>
            <span className="text-xs text-foreground/60 whitespace-nowrap">
              {strength.score > 0 ? strength.feedback : '输入密码以查看强度'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            {requirements.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: requirements.indexOf(req) * 0.05 }}
                className="flex items-center gap-1.5 text-foreground/70"
              >
                {req.check ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <X className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span className={req.check ? 'text-green-500' : ''}>{req.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-1.5 text-red-400 text-xs"
          >
            <X className="w-3.5 h-3.5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
