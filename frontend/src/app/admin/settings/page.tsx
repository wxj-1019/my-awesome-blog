'use client'

import { useState, useEffect } from 'react'
import { motion } from '@/lib/framer-motion'
import { 
  Settings as SettingsIcon,
  Globe,
  Mail,
  Shield,
  Server,
  Bell,
  Palette,
  Save,
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/admin/Button'
import FormInput from '@/components/admin/FormInput'
import { useToast } from '@/components/admin/Toast'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'
import { useTheme } from '@/context/theme-context'
import type { ThemeMode } from '@/lib/theme-config'

interface SiteSettings {
  siteName: string
  siteDescription: string
  siteKeywords: string
  siteUrl: string
  authorName: string
  authorEmail: string
  authorBio: string
}

interface SEOSettings {
  metaTitle: string
  metaDescription: string
  ogImage: string
  twitterCard: string
  googleAnalyticsId: string
  baiduAnalyticsId: string
}

interface EmailSettings {
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpFrom: string
  emailEnabled: boolean
}

interface SecuritySettings {
  registrationEnabled: boolean
  emailVerificationRequired: boolean
  twoFactorEnabled: boolean
  sessionTimeout: number
  maxLoginAttempts: number
}

interface NotificationSettings {
  emailNotifications: boolean
  newCommentNotification: boolean
  newSubscriptionNotification: boolean
  systemAlerts: boolean
  weeklyReport: boolean
}

type SettingsSection = 'site' | 'seo' | 'email' | 'security' | 'notifications' | 'appearance'

const SECTIONS: { id: SettingsSection; label: string; icon: typeof Globe }[] = [
  { id: 'site', label: '网站设置', icon: Globe },
  { id: 'seo', label: 'SEO 设置', icon: Server },
  { id: 'email', label: '邮件设置', icon: Mail },
  { id: 'security', label: '安全设置', icon: Shield },
  { id: 'notifications', label: '通知设置', icon: Bell },
  { id: 'appearance', label: '外观设置', icon: Palette },
]

export default function SettingsPage() {
  const { success, error } = useToast()
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<SettingsSection>('site')
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'My Awesome Blog',
    siteDescription: '一个现代化的个人博客系统',
    siteKeywords: '博客, 技术, 开发, 编程',
    siteUrl: 'https://blog.example.com',
    authorName: 'Admin',
    authorEmail: 'admin@example.com',
    authorBio: '全栈开发者，热爱技术与分享',
  })
  
  const [seoSettings, setSeoSettings] = useState<SEOSettings>({
    metaTitle: 'My Awesome Blog',
    metaDescription: '一个现代化的个人博客系统，分享技术与生活',
    ogImage: '/og-image.png',
    twitterCard: 'summary_large_image',
    googleAnalyticsId: '',
    baiduAnalyticsId: '',
  })
  
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpFrom: 'noreply@example.com',
    emailEnabled: false,
  })
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    registrationEnabled: true,
    emailVerificationRequired: false,
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  })
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    newCommentNotification: true,
    newSubscriptionNotification: true,
    systemAlerts: true,
    weeklyReport: false,
  })

  const [appearanceSettings, setAppearanceSettings] = useState({
    defaultTheme: 'system',
    primaryColor: '#06b6d4',
    fontFamily: 'Inter',
    borderRadius: 'lg',
    animationsEnabled: true,
  })

  useEffect(() => {
    const savedSettings = localStorage.getItem('admin_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        if (parsed.site) {setSiteSettings(parsed.site)}
        if (parsed.seo) {setSeoSettings(parsed.seo)}
        if (parsed.email) {setEmailSettings(parsed.email)}
        if (parsed.security) {setSecuritySettings(parsed.security)}
        if (parsed.notifications) {setNotificationSettings(parsed.notifications)}
        if (parsed.appearance) {setAppearanceSettings(parsed.appearance)}
      } catch (e) {
        console.error('Failed to parse saved settings:', e)
      }
    }
  }, [])

  const saveSettings = async () => {
    setLoading(true)
    try {
      const allSettings = {
        site: siteSettings,
        seo: seoSettings,
        email: emailSettings,
        security: securitySettings,
        notifications: notificationSettings,
        appearance: appearanceSettings,
      }
      
      localStorage.setItem('admin_settings', JSON.stringify(allSettings))
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      success('设置已保存')
      setHasChanges(false)
    } catch (err) {
      console.error('Failed to save settings:', err)
      error('保存设置失败')
    } finally {
      setLoading(false)
    }
  }

  const resetSettings = () => {
    localStorage.removeItem('admin_settings')
    window.location.reload()
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'site':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">网站名称</label>
                  <FormInput
                    type="text"
                    value={siteSettings.siteName}
                    onChange={(e) => { setSiteSettings({ ...siteSettings, siteName: e.target.value }); setHasChanges(true) }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">网站地址</label>
                  <FormInput
                    type="text"
                    value={siteSettings.siteUrl}
                    onChange={(e) => { setSiteSettings({ ...siteSettings, siteUrl: e.target.value }); setHasChanges(true) }}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">网站描述</label>
              <textarea
                value={siteSettings.siteDescription}
                onChange={(e) => { setSiteSettings({ ...siteSettings, siteDescription: e.target.value }); setHasChanges(true) }}
                className="w-full px-4 py-3 bg-glass/30 border border-glass-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 resize-none"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">关键词（用逗号分隔）</label>
              <FormInput
                type="text"
                value={siteSettings.siteKeywords}
                onChange={(e) => { setSiteSettings({ ...siteSettings, siteKeywords: e.target.value }); setHasChanges(true) }}
              />
            </div>
            
            <div className="pt-4 border-t border-glass-border/30">
              <h3 className="text-lg font-semibold text-foreground mb-4">作者信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">作者名称</label>
                  <FormInput
                    type="text"
                    value={siteSettings.authorName}
                    onChange={(e) => { setSiteSettings({ ...siteSettings, authorName: e.target.value }); setHasChanges(true) }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">作者邮箱</label>
                  <FormInput
                    type="email"
                    value={siteSettings.authorEmail}
                    onChange={(e) => { setSiteSettings({ ...siteSettings, authorEmail: e.target.value }); setHasChanges(true) }}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground/70 mb-2">作者简介</label>
                <textarea
                  value={siteSettings.authorBio}
                  onChange={(e) => { setSiteSettings({ ...siteSettings, authorBio: e.target.value }); setHasChanges(true) }}
                  className="w-full px-4 py-3 bg-glass/30 border border-glass-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )
        
      case 'seo':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">元数据设置</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">默认标题</label>
                  <FormInput
                    type="text"
                    value={seoSettings.metaTitle}
                    onChange={(e) => { setSeoSettings({ ...seoSettings, metaTitle: e.target.value }); setHasChanges(true) }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Meta 描述</label>
                  <textarea
                    value={seoSettings.metaDescription}
                    onChange={(e) => { setSeoSettings({ ...seoSettings, metaDescription: e.target.value }); setHasChanges(true) }}
                    className="w-full px-4 py-3 bg-glass/30 border border-glass-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">OG 图片 URL</label>
                  <FormInput
                    type="text"
                    value={seoSettings.ogImage}
                    onChange={(e) => { setSeoSettings({ ...seoSettings, ogImage: e.target.value }); setHasChanges(true) }}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-glass-border/30">
              <h3 className="text-lg font-semibold text-foreground mb-4">分析工具</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Google Analytics ID</label>
                  <FormInput
                    type="text"
                    placeholder="G-XXXXXXXXXX"
                    value={seoSettings.googleAnalyticsId}
                    onChange={(e) => { setSeoSettings({ ...seoSettings, googleAnalyticsId: e.target.value }); setHasChanges(true) }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">百度统计 ID</label>
                  <FormInput
                    type="text"
                    value={seoSettings.baiduAnalyticsId}
                    onChange={(e) => { setSeoSettings({ ...seoSettings, baiduAnalyticsId: e.target.value }); setHasChanges(true) }}
                  />
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'email':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-glass/20 rounded-lg border border-glass-border/50">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-tech-cyan" />
                <div>
                  <p className="font-medium text-foreground">启用邮件服务</p>
                  <p className="text-sm text-foreground/50">开启后将发送系统邮件通知</p>
                </div>
              </div>
              <motion.button
                onClick={() => { setEmailSettings({ ...emailSettings, emailEnabled: !emailSettings.emailEnabled }); setHasChanges(true) }}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors duration-200",
                  emailSettings.emailEnabled ? "bg-tech-cyan" : "bg-glass-border"
                )}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ left: emailSettings.emailEnabled ? 28 : 4 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.button>
            </div>
            
            <div className={cn("space-y-4", !emailSettings.emailEnabled && "opacity-50 pointer-events-none")}>
              <h3 className="text-lg font-semibold text-foreground">SMTP 配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">SMTP 服务器</label>
                  <FormInput
                    type="text"
                    value={emailSettings.smtpHost}
                    onChange={(e) => { setEmailSettings({ ...emailSettings, smtpHost: e.target.value }); setHasChanges(true) }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">端口</label>
                  <FormInput
                    type="number"
                    value={emailSettings.smtpPort.toString()}
                    onChange={(e) => { setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) || 587 }); setHasChanges(true) }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">用户名</label>
                  <FormInput
                    type="text"
                    value={emailSettings.smtpUsername}
                    onChange={(e) => { setEmailSettings({ ...emailSettings, smtpUsername: e.target.value }); setHasChanges(true) }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">密码</label>
                  <FormInput
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => { setEmailSettings({ ...emailSettings, smtpPassword: e.target.value }); setHasChanges(true) }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">发件人地址</label>
                <FormInput
                  type="email"
                  value={emailSettings.smtpFrom}
                  onChange={(e) => { setEmailSettings({ ...emailSettings, smtpFrom: e.target.value }); setHasChanges(true) }}
                />
              </div>
            </div>
          </div>
        )
        
      case 'security':
        return (
          <div className="space-y-6">
            {[
              { key: 'registrationEnabled', label: '允许用户注册', desc: '新用户可以自行注册账号' },
              { key: 'emailVerificationRequired', label: '邮箱验证', desc: '注册时需要验证邮箱地址' },
              { key: 'twoFactorEnabled', label: '双因素认证', desc: '用户可启用2FA增强安全性' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-glass/20 rounded-lg border border-glass-border/50">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-tech-cyan" />
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-foreground/50">{item.desc}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => { setSecuritySettings({ ...securitySettings, [item.key]: !securitySettings[item.key as keyof SecuritySettings] }); setHasChanges(true) }}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors duration-200",
                    securitySettings[item.key as keyof SecuritySettings] ? "bg-tech-cyan" : "bg-glass-border"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                    animate={{ left: securitySettings[item.key as keyof SecuritySettings] ? 28 : 4 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              </div>
            ))}
            
            <div className="pt-4 border-t border-glass-border/30">
              <h3 className="text-lg font-semibold text-foreground mb-4">会话设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">会话超时（分钟）</label>
                  <FormInput
                    type="number"
                    value={securitySettings.sessionTimeout.toString()}
                    onChange={(e) => { setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) || 30 }); setHasChanges(true) }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">最大登录尝试次数</label>
                  <FormInput
                    type="number"
                    value={securitySettings.maxLoginAttempts.toString()}
                    onChange={(e) => { setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) || 5 }); setHasChanges(true) }}
                  />
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'notifications':
        return (
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: '邮件通知', desc: '接收系统邮件通知', icon: Mail },
              { key: 'newCommentNotification', label: '新评论通知', desc: '有新评论时通知', icon: Bell },
              { key: 'newSubscriptionNotification', label: '新订阅通知', desc: '有新订阅时通知', icon: Bell },
              { key: 'systemAlerts', label: '系统警报', desc: '重要系统事件通知', icon: Bell },
              { key: 'weeklyReport', label: '周报', desc: '每周发送运营报告', icon: Bell },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-glass/20 rounded-lg border border-glass-border/50">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-tech-cyan" />
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-foreground/50">{item.desc}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => { setNotificationSettings({ ...notificationSettings, [item.key]: !notificationSettings[item.key as keyof NotificationSettings] }); setHasChanges(true) }}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors duration-200",
                    notificationSettings[item.key as keyof NotificationSettings] ? "bg-tech-cyan" : "bg-glass-border"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                    animate={{ left: notificationSettings[item.key as keyof NotificationSettings] ? 28 : 4 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              </div>
            ))}
          </div>
        )
        
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">主题模式</h3>
              <p className="text-sm text-muted-foreground mb-4">
                即时生效，写入 localStorage（与导航绳切换同源）。色值见 variables.css 语义 token。
              </p>
              <div className="grid grid-cols-3 gap-4">
                {(
                  [
                    { id: 'light' as ThemeMode, label: '浅色' },
                    { id: 'dark' as ThemeMode, label: '深色' },
                    { id: 'auto' as ThemeMode, label: '跟随系统' },
                  ] as const
                ).map((opt) => (
                  <motion.button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTheme(opt.id)
                      setAppearanceSettings({
                        ...appearanceSettings,
                        defaultTheme: opt.id === 'auto' ? 'system' : opt.id,
                      })
                      setHasChanges(true)
                    }}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all',
                      theme === opt.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card/40 hover:border-primary/40'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="font-medium text-foreground">{opt.label}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border border-border text-sm text-muted-foreground">
              自定义主题色 / 第二套皮肤尚未启用。请在{' '}
              <code className="text-primary">frontend/src/styles/base/variables.css</code>{' '}
              修改 <code className="text-primary">--primary</code> 等 token。详见{' '}
              <code className="text-primary">docs/theme-tokens.md</code>。
            </div>

            <div className="flex items-center justify-between p-4 bg-card/40 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">启用动画（本地偏好）</p>
                  <p className="text-sm text-muted-foreground">
                    仅保存设置草稿；系统「减少动态效果」仍优先生效
                  </p>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={() => {
                  setAppearanceSettings({
                    ...appearanceSettings,
                    animationsEnabled: !appearanceSettings.animationsEnabled,
                  })
                  setHasChanges(true)
                }}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors duration-200',
                  appearanceSettings.animationsEnabled
                    ? 'bg-primary'
                    : 'bg-border'
                )}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-primary-foreground rounded-full shadow-md"
                  animate={{
                    left: appearanceSettings.animationsEnabled ? 28 : 4,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </motion.button>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCardAdmin className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <SettingsIcon className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  系统设置
                </h1>
                <p className="text-foreground/60 mt-0.5 flex items-center gap-4">
                  <span>管理网站配置</span>
                  {hasChanges && (
                    <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      有未保存的更改
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={resetSettings}
                  variant="ghost"
                  leftIcon={RefreshCw}
                >
                  重置
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={saveSettings}
                  variant="primary"
                  leftIcon={Save}
                  loading={loading}
                  disabled={!hasChanges}
                >
                  保存设置
                </Button>
              </motion.div>
            </div>
          </div>
        </GlassCardAdmin>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <GlassCardAdmin className="p-2" variant="secondary">
            <nav className="space-y-1">
              {SECTIONS.map((section) => (
                <motion.button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200",
                    activeSection === section.id
                      ? "bg-tech-cyan/20 text-tech-cyan"
                      : "text-foreground/70 hover:bg-glass/20 hover:text-foreground"
                  )}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    activeSection === section.id && "rotate-90"
                  )} />
                </motion.button>
              ))}
            </nav>
          </GlassCardAdmin>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3"
        >
          <GlassCardAdmin className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </GlassCardAdmin>
        </motion.div>
      </div>
    </div>
  )
}

function AnimatePresence({ children, mode: _mode }: { children: React.ReactNode; mode: string }) {
  void _mode;
  return <>{children}</>
}
