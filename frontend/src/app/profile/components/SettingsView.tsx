import { useState } from 'react';
import { Shield, Lock, Palette, Bell, Globe, Mail, KeyRound } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsView() {
  const [settings, setSettings] = useState({
    notifications: true,
    privacy: 'public',
    twoFactorAuth: false,
    newsletter: true,
    language: 'zh-CN',
    theme: 'auto'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <GlassCard className="overflow-hidden border-border shadow-lg transition-all duration-300">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-tech-cyan" />
          账户设置
        </h2>

        <div className="space-y-8">
          {/* 隐私设置 */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-tech-cyan" />
              隐私设置
            </h3>
            <div className="space-y-4 pl-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-foreground">个人资料可见性</Label>
                </div>
                <select 
                  value={settings.privacy} 
                  onChange={(e) => handleSettingChange('privacy', e.target.value)}
                  className="bg-glass border border-glass-border rounded px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan"
                >
                  <option value="public">公开</option>
                  <option value="private">私密</option>
                  <option value="friends">仅好友</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-foreground">允许邮件联系</Label>
                </div>
                <input
                  type="checkbox"
                  checked={settings.newsletter}
                  onChange={(e) => handleSettingChange('newsletter', e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border text-tech-cyan focus:ring-tech-cyan"
                />
              </div>
            </div>
          </div>

          {/* 通知设置 */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-tech-cyan" />
              通知设置
            </h3>
            <div className="space-y-4 pl-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-foreground">接收邮件通知</Label>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border text-tech-cyan focus:ring-tech-cyan"
                />
              </div>
            </div>
          </div>

          {/* 安全设置 */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-tech-cyan" />
              安全设置
            </h3>
            <div className="space-y-4 pl-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-foreground">两步验证</Label>
                </div>
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border text-tech-cyan focus:ring-tech-cyan"
                />
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  修改密码
                </Button>
              </div>
            </div>
          </div>

          {/* 显示设置 */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4 text-tech-cyan" />
              显示设置
            </h3>
            <div className="space-y-4 pl-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">界面语言</Label>
                <select 
                  value={settings.language} 
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="bg-glass border border-glass-border rounded px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-foreground">主题模式</Label>
                <select 
                  value={settings.theme} 
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="bg-glass border border-glass-border rounded px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan"
                >
                  <option value="auto">自动</option>
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-glass-border flex justify-end">
          <Button>保存设置</Button>
        </div>
      </div>
    </GlassCard>
  );
}