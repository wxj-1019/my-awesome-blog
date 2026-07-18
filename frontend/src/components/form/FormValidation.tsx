'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidationRule<T = unknown> {
  name: string;
  validate: (value: T) => boolean | string;
  message: string;
}

export interface FieldValidation {
  isValid: boolean;
  error?: string;
  touched: boolean;
}

export interface FormValidationProps {
  children: React.ReactNode;
  onSubmit: (data: Record<string, unknown>) => void;
  className?: string;
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule[]>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = (name: keyof T, value: unknown) => {
    const rules = validationRules[name];
    if (!rules) {return true;}

    for (const rule of rules) {
      const result = rule.validate(value);
      if (typeof result === 'string') {
        return result;
      }
      if (!result) {
        return rule.message;
      }
    }
    return true;
  };

  const validateAll = () => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const key in values) {
      const error = validateField(key, values[key]);
      if (error !== true) {
        newErrors[key] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (name: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error === true ? undefined : error
      }));
    }
  };

  const handleBlur = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error === true ? undefined : error
    }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
}

export function ValidationError({ message, showIcon = true }: { message: string; showIcon?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-start gap-1.5 mt-1.5 text-red-400 text-xs"
    >
      {showIcon && <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
      <span>{message}</span>
    </motion.div>
  );
}

export function ValidationSuccess({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 mt-1.5 text-green-400 text-xs"
    >
      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
}

export function FormFieldWrapper({
  label,
  error,
  success,
  required,
  children,
  className
}: {
  label?: string;
  error?: string;
  success?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-sm font-medium flex items-center gap-1">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      {children}
      <AnimatePresence mode="wait">
        {error && <ValidationError message={error} />}
        {success && !error && <ValidationSuccess message={success} />}
      </AnimatePresence>
    </div>
  );
}
