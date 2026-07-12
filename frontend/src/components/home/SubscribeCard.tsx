'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import { Mail, CheckCircle, Loader2, Sparkles, ArrowRight, Bell } from 'lucide-react'
import { subscriptionService } from '@/services/subscriptionService'
import { useToast } from '@/components/ui/use-toast'
import ScrollReveal from './decorations/ScrollReveal'

const APPLE_EASE = [0.25, 0.1, 0.25, 1] as const

interface FloatingLabelInputProps {
  id: string
  type: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  icon?: React.ReactNode
}

function FloatingLabelInput({
  id,
  type,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  icon
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0

  return (
    <div className="relative">
      <motion.label
        htmlFor={id}
        className="absolute left-4 sm:left-5 text-muted-foreground pointer-events-none origin-left"
        initial={false}
        animate={{
          y: isFocused || hasValue ? -24 : 0,
          scale: isFocused || hasValue ? 0.85 : 1,
          color: isFocused ? 'rgb(6, 182, 212)' : 'rgb(156, 163, 175)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        {label}
      </motion.label>

      <div className="relative">
        {icon && (
          <motion.div 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            animate={{ color: isFocused ? 'rgb(6, 182, 212)' : 'rgb(156, 163, 175)' }}
          >
            {icon}
          </motion.div>
        )}
        
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? placeholder : ''}
          required={required}
          className={`
            w-full px-4 py-4 sm:px-5 sm:py-5 rounded-xl
            bg-glass/30 backdrop-blur-xl border border-glass-border
            text-foreground placeholder:text-muted-foreground/50
            focus:outline-none focus:border-tech-cyan/50 focus:ring-2 focus:ring-tech-cyan/20
            transition-all duration-200
            ${icon ? 'pl-12' : ''}
          `}
        />

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-tech-cyan to-tech-sky rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{ duration: 0.3, ease: APPLE_EASE }}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </div>
  )
}

interface FormatOption {
  id: string
  label: string
  description: string
  icon: React.ReactNode
}

const formatOptions: FormatOption[] = [
  { id: 'email', label: '邮件', description: '每日摘要', icon: <Mail className="w-4 h-4" /> },
  { id: 'push', label: '推送', description: '实时通知', icon: <Bell className="w-4 h-4" /> },
]

interface FormatSelectorProps {
  selected: string
  onSelect: (format: string) => void
}

function FormatSelector({ selected, onSelect }: FormatSelectorProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="flex gap-3">
      {formatOptions.map((option) => (
        <motion.button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`
            flex-1 p-3 rounded-xl border transition-all duration-200 cursor-pointer
            ${selected === option.id 
              ? 'bg-tech-cyan/20 border-tech-cyan/50 text-tech-cyan' 
              : 'bg-glass/30 border-glass-border text-muted-foreground hover:border-glass-border/80'}
          `}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -2 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            {option.icon}
            <span className="text-sm font-medium">{option.label}</span>
          </div>
          <span className="text-xs opacity-70">{option.description}</span>
        </motion.button>
      ))}
    </div>
  )
}

interface SuccessStateProps {
  onReset: () => void
}

function SuccessState({ onReset }: SuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="text-center py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-tech-cyan/20 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
        >
          <CheckCircle className="w-8 h-8 text-tech-cyan" />
        </motion.div>
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-foreground mb-2"
      >
        订阅成功！
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-6"
      >
        感谢您的订阅，我们会定期推送最新内容
      </motion.p>

      <motion.button
        onClick={onReset}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="text-sm text-tech-cyan hover:text-tech-lightcyan transition-colors cursor-pointer"
      >
        继续订阅其他邮箱
      </motion.button>
    </motion.div>
  )
}

// 浮动粒子组件
interface FloatingParticle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

function FloatingParticles() {
  const shouldReduceMotion = useReducedMotion()
  const [particles, setParticles] = useState<FloatingParticle[]>([])

  useEffect(() => {
    // 生成随机粒子
    const newParticles: FloatingParticle[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 4,
      delay: Math.random() * 2,
    }))
    setParticles(newParticles)
  }, [])

  if (shouldReduceMotion) {return null}

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-br from-tech-cyan/30 to-tech-sky/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// 磁吸按钮组件
interface MagneticButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

function MagneticButton({ children, onClick, disabled, loading, className }: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const shouldReduceMotion = useReducedMotion()

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (shouldReduceMotion || disabled || loading) {return}
    
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) {return}

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    
    // 磁吸效果 - 限制最大移动距离
    const maxMove = 8
    const x = (distanceX / rect.width) * maxMove
    const y = (distanceY / rect.height) * maxMove
    
    setPosition({ x, y })
  }, [shouldReduceMotion, disabled, loading])

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 })
  }, [])

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative overflow-hidden ${className}`}
      animate={{
        x: position.x,
        y: position.y,
      }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        mass: 0.1,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>处理中...</span>
        </motion.div>
      ) : (
        children
      )}
    </motion.button>
  )
}

export default function SubscribeCard() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [format, setFormat] = useState('email')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()
  const shouldReduceMotion = useReducedMotion()

  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, { once: true, margin: '-100px' })

  const handleSubmit = useCallback(async () => {
    if (!email) {
      toast({
        title: '请输入邮箱地址',
        variant: 'error'
      })
      return
    }

    setLoading(true)
    
    try {
      await subscriptionService.createSubscription(email)
      setSuccess(true)
      toast({
        title: '订阅成功！',
        description: '感谢您的订阅',
        variant: 'success'
      })
    } catch (error) {
      toast({
        title: '订阅失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [email, toast])

  const handleReset = useCallback(() => {
    setEmail('')
    setName('')
    setFormat('email')
    setSuccess(false)
  }, [])

  // 卡片动画配置
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 30 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.6,
        ease: APPLE_EASE,
        staggerChildren: 0.1,
      }
    }
  }

  return (
    <ScrollReveal animation="scaleIn" delay={0.1}>
      <motion.div
        ref={cardRef}
        className="relative mx-auto max-w-6xl bg-glass/30 backdrop-blur-xl border border-glass-border rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,.12)]"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={shouldReduceMotion ? { hidden: {}, visible: {} } : cardVariants}
      >
        {/* 沉浸式结尾面板 */}
        <div data-testid="subscribe-band-layer" className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(6,182,212,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,.5)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-tech-cyan/10 shadow-[0_0_90px_rgba(6,182,212,.14)]" />
          <div className="absolute -right-24 top-8 h-64 w-64 rounded-full border border-tech-sky/10 shadow-[0_0_90px_rgba(14,165,233,.12)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-tech-cyan/60 to-transparent" />
        </div>

        {/* 顶部渐变线 */}
        <motion.div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-cyan to-transparent"
          animate={shouldReduceMotion ? {} : { opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* 浮动粒子背景 */}
        <FloatingParticles />

        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-40 h-40 bg-tech-cyan/5 rounded-full blur-3xl"
            animate={shouldReduceMotion ? {} : {
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-40 h-40 bg-tech-sky/5 rounded-full blur-3xl"
            animate={shouldReduceMotion ? {} : {
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        <div className="relative p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {success ? (
              <SuccessState key="success" onReset={handleReset} />
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div 
                  className="flex items-center gap-3 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldReduceMotion ? 0 : 0.2 }}
                >
                  <motion.div
                    className="p-3 rounded-xl bg-tech-cyan/20"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <Sparkles className="w-6 h-6 text-tech-cyan" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">订阅更新</h3>
                    <p className="text-sm text-muted-foreground">获取最新文章和动态</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="space-y-4 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldReduceMotion ? 0 : 0.3 }}
                >
                  <FloatingLabelInput
                    id="subscribe-email"
                    type="email"
                    label="邮箱地址"
                    value={email}
                    onChange={setEmail}
                    placeholder="your@email.com"
                    required
                    icon={<Mail className="w-5 h-5" />}
                  />
                  
                  <FloatingLabelInput
                    id="subscribe-name"
                    type="text"
                    label="您的称呼（可选）"
                    value={name}
                    onChange={setName}
                    placeholder="请输入您的称呼"
                  />
                </motion.div>

                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldReduceMotion ? 0 : 0.4 }}
                >
                  <p className="text-sm text-muted-foreground mb-3">接收方式</p>
                  <FormatSelector selected={format} onSelect={setFormat} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldReduceMotion ? 0 : 0.5 }}
                >
                  <MagneticButton
                    onClick={handleSubmit}
                    disabled={!email}
                    loading={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-tech-cyan to-tech-sky text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-tech-cyan/20 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>立即订阅</span>
                    <ArrowRight className="w-5 h-5" />
                  </MagneticButton>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    订阅即表示您同意接收我们的更新通知，您可以随时取消订阅
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </ScrollReveal>
  )
}
