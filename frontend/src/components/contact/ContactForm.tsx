'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, MessageSquare, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';
export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) {return '请输入您的姓名';}
        if (value.length < 2) {return '姓名至少需要2个字符';}
        return '';
      case 'email':
        if (!value.trim()) {return '请输入您的邮箱';}
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {return '请输入有效的邮箱地址';}
        return '';
      case 'subject':
        if (!value.trim()) {return '请输入主题';}
        if (value.length < 3) {return '主题至少需要3个字符';}
        return '';
      case 'message':
        if (!value.trim()) {return '请输入消息内容';}
        if (value.length < 10) {return '消息内容至少需要10个字符';}
        return '';
      default:
        return '';
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name as keyof FormData, value),
      }));
    }
  };
  const handleBlur = (name: keyof FormData, value: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key as keyof FormData, value);
      if (error) {newErrors[key as keyof FormData] = error;}
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({
        name: true,
        email: true,
        subject: true,
        message: true,
      });
      return;
    }
    setStatus('submitting');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTouched({});
      setErrors({});
      
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };
  const renderInput = (
    name: keyof FormData,
    label: string,
    type: string = 'text',
    icon: React.ReactNode,
    rows?: number
  ) => {
    const error = errors[name];
    const isTouched = touched[name];
    const showError = isTouched && error;
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground/90 font-sf-pro-text">
          {label}
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-tech-cyan transition-colors duration-200">
            {icon}
          </div>
          {rows ? (
            <textarea
              name={name}
              value={formData[name]}
              onChange={handleChange}
              onBlur={() => handleBlur(name, formData[name])}
              rows={rows}
              className={`
                w-full pl-12 pr-4 py-4 rounded-2xl border-2
                bg-background/80 dark:bg-foreground/5
                text-foreground dark:text-white
                placeholder-foreground/40 dark:placeholder-white/30
                transition-all duration-300
                resize-none
                ${showError 
                  ? 'border-red-500 dark:border-red-400 focus:ring-4 focus:ring-red-500/10' 
                  : 'border-foreground/10 dark:border-white/10 hover:border-foreground/20 dark:hover:border-white/20 focus:border-tech-cyan focus:ring-4 focus:ring-tech-cyan/10'
                }
                focus:outline-none focus:bg-background dark:focus:bg-foreground/10
                font-sf-pro-text
              `}
              placeholder={`请输入${label}...`}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              onBlur={() => handleBlur(name, formData[name])}
              className={`
                w-full pl-12 pr-4 py-4 rounded-2xl border-2
                bg-background/80 dark:bg-foreground/5
                text-foreground dark:text-white
                placeholder-foreground/40 dark:placeholder-white/30
                transition-all duration-300
                ${showError 
                  ? 'border-red-500 dark:border-red-400 focus:ring-4 focus:ring-red-500/10' 
                  : 'border-foreground/10 dark:border-white/10 hover:border-foreground/20 dark:hover:border-white/20 focus:border-tech-cyan focus:ring-4 focus:ring-tech-cyan/10'
                }
                focus:outline-none focus:bg-background dark:focus:bg-foreground/10
                font-sf-pro-text
              `}
              placeholder={`请输入${label}...`}
            />
          )}
        </div>
        <AnimatePresence mode="wait">
          {showError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  };
  return (
    <section className="w-full py-12 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* 标题区域 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <h2 className="font-sf-pro-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              发送消息
            </h2>
            <p className="font-sf-pro-text text-foreground/70 max-w-xl mx-auto">
              填写下面的表单，我会尽快回复你。通常在 24 小时内回复。
            </p>
          </motion.div>
          <GlassCard padding="lg" className="shadow-xl shadow-foreground/5 dark:shadow-black/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput('name', '姓名', 'text', <User className="w-5 h-5" />)}
                {renderInput('email', '邮箱', 'email', <Mail className="w-5 h-5" />)}
              </div>
              {renderInput('subject', '主题', 'text', <MessageSquare className="w-5 h-5" />)}
              {renderInput('message', '消息内容', 'text', <MessageSquare className="w-5 h-5" />, 6)}
              <motion.button
                type="submit"
                disabled={status === 'submitting'}
                whileHover={{ scale: status === 'submitting' ? 1 : 1.02, y: status === 'submitting' ? 0 : -2 }}
                whileTap={{ scale: status === 'submitting' ? 1 : 0.98 }}
                className={`
                  w-full py-4 rounded-2xl font-semibold font-sf-pro-text
                  transition-all duration-300
                  flex items-center justify-center gap-3
                  shadow-lg
                  ${status === 'submitting'
                    ? 'bg-foreground/20 dark:bg-white/10 cursor-not-allowed text-foreground/50'
                    : 'bg-gradient-to-r from-tech-cyan via-cyan-500 to-blue-500 text-white shadow-tech-cyan/25 hover:shadow-xl hover:shadow-tech-cyan/30'
                  }
                `}
              >
                {status === 'submitting' ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>发送中...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>发送消息</span>
                  </>
                )}
              </motion.button>
            </form>
            <AnimatePresence mode="wait">
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mt-6 p-4 bg-green-500/10 dark:bg-green-500/20 border border-green-500/20 dark:border-green-500/30 rounded-2xl"
                >
                  <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-sf-pro-text">消息发送成功！我会尽快回复你。</p>
                  </div>
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mt-6 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-2xl"
                >
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-sf-pro-text">发送失败，请稍后重试。</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}