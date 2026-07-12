'use client';

import { useState } from 'react';
import { Camera, Mail, Globe, Twitter, Github, Linkedin, MapPin, Calendar, ExternalLink, Edit3, Save, X, UserRound } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { UserProfile } from '@/types';

// 类型定义
interface ProfileViewProps {
  profile: UserProfile;
  isEditing: boolean;
  setEditing: (editing: boolean) => void;
  formData: Partial<UserProfile>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<UserProfile>>>;
  onSave: () => void;
  onCancel: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileView({
  profile,
  isEditing,
  setEditing,
  formData,
  setFormData,
  onSave,
  onCancel,
  onAvatarChange
}: ProfileViewProps) {
  const { themedClasses, getThemeClass } = useThemedClasses();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 主题相关样式
  const cardBgClass = themedClasses.cardBgClass;
  const textClass = themedClasses.textClass;
  const accentClass = getThemeClass(
    'text-tech-cyan',
    'text-blue-600'
  );

  const mutedClass = themedClasses.mutedTextClass;

  return (
    <GlassCard className={`overflow-hidden border-border shadow-lg transition-all duration-300 hover:shadow-xl ${cardBgClass}`}>
      {/* 个人资料头部 */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 pb-8 border-b border-dashed border-opacity-30 p-6">
        <div className="flex flex-col items-center gap-6">
          {/* 头像区域 */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl transition-all duration-300 group-hover:shadow-2xl">
              {formData.avatar ? (
                <img 
                  src={formData.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-tech-cyan/20 to-tech-sky/20 flex items-center justify-center">
                  <UserRound className="w-12 h-12 text-tech-cyan" />
                </div>
              )}
            </div>
            {isEditing && (
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-2 right-2 bg-tech-cyan p-2 rounded-full cursor-pointer hover:bg-tech-cyan/90 transition-all duration-200 hover:scale-110 shadow-lg"
              >
                <Camera className="w-5 h-5 text-white" />
                <input 
                  id="avatar-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={onAvatarChange}
                />
              </label>
            )}
          </div>
          
          {/* 用户信息 */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {isEditing ? (
                <Input
                  name="fullName"
                  value={formData.fullName || ''}
                  onChange={handleInputChange}
                  className="text-3xl font-bold bg-transparent border-none focus:border-tech-cyan px-0 h-auto py-0 text-center text-foreground"
                />
              ) : (
                formData.fullName || formData.username
              )}
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="w-2 h-2 rounded-full bg-tech-cyan"></span>
              <p className={mutedClass}>@{formData.username}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4 text-tech-cyan" />
              <span className={mutedClass}>{formData.email}</span>
            </div>
          </div>

          {/* 编辑按钮 */}
          <div className="flex gap-3 mt-4">
            {!isEditing ? (
              <Button 
                onClick={() => setEditing(true)} 
                className="cursor-pointer transition-all duration-200 hover:scale-105 flex items-center gap-2 bg-tech-cyan hover:bg-tech-cyan/90"
              >
                <Edit3 className="w-4 h-4" />
                编辑个人资料
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 flex items-center gap-2 ${getThemeClass(
                    'border-glass-border text-foreground hover:bg-glass/40',
                    'border-gray-300 text-gray-800 hover:bg-gray-50'
                  )}`}
                >
                  <X className="w-4 h-4" />
                  取消
                </Button>
                <Button 
                  onClick={onSave} 
                  className="cursor-pointer transition-all duration-200 hover:scale-105 flex items-center gap-2 bg-tech-cyan hover:bg-tech-cyan/90"
                >
                  <Save className="w-4 h-4" />
                  保存更改
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 个人资料内容 */}
      <div className="p-6">
        {isEditing ? (
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username" className={`text-foreground flex items-center gap-2 ${textClass}`}>
                  <span className="w-5 h-5 flex items-center justify-center bg-tech-cyan/20 rounded-full text-tech-cyan">
                    👤
                  </span>
                  用户名
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleInputChange}
                  readOnly
                  className="border-glass-border text-foreground placeholder:text-foreground/50 transition-colors duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className={`text-foreground flex items-center gap-2 ${textClass}`}>
                  <Mail className="w-4 h-4 text-tech-cyan" />
                  邮箱
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="border-glass-border text-foreground placeholder:text-foreground/50 transition-colors duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className={`text-foreground flex items-center gap-2 ${textClass}`}>
                  <Globe className="w-4 h-4 text-tech-cyan" />
                  个人网站
                </Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="border-glass-border text-foreground placeholder:text-foreground/50 transition-colors duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className={`text-foreground flex items-center gap-2 ${textClass}`}>
                  <Twitter className="w-4 h-4 text-tech-cyan" />
                  Twitter
                </Label>
                <Input
                  id="twitter"
                  name="twitter"
                  value={formData.twitter || ''}
                  onChange={handleInputChange}
                  placeholder="@username"
                  className="border-glass-border text-foreground placeholder:text-foreground/50 transition-colors duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github" className={`text-foreground flex items-center gap-2 ${textClass}`}>
                  <Github className="w-4 h-4 text-tech-cyan" />
                  GitHub
                </Label>
                <Input
                  id="github"
                  name="github"
                  value={formData.github || ''}
                  onChange={handleInputChange}
                  placeholder="username"
                  className="border-glass-border text-foreground placeholder:text-foreground/50 transition-colors duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className={`text-foreground flex items-center gap-2 ${textClass}`}>
                  <Linkedin className="w-4 h-4 text-tech-cyan" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  name="linkedin"
                  value={formData.linkedin || ''}
                  onChange={handleInputChange}
                  placeholder="username"
                  className="border-glass-border text-foreground placeholder:text-foreground/50 transition-colors duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className={`text-foreground flex items-center gap-2 ${textClass}`}>
                <MapPin className="w-4 h-4 text-tech-cyan" />
                个人简介
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio || ''}
                onChange={handleInputChange}
                rows={4}
                className="border-glass-border text-foreground placeholder:text-foreground/50 resize-none transition-colors duration-200"
                placeholder="介绍一下自己..."
              />
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            {/* 个人简介 */}
            {formData.bio && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-tech-cyan/5 to-tech-sky/5 border border-dashed border-opacity-30">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-tech-cyan" />
                  关于我
                </h3>
                <p className={`leading-relaxed ${textClass}`}>{formData.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 联系方式 */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-tech-cyan" />
                  联系方式
                </h3>
                <div className="space-y-3 pl-2">
                  <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer group">
                    <Mail className="w-4 h-4 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
                    <a 
                      href={`mailto:${formData.email}`}
                      className={`hover:text-tech-cyan transition-colors ${textClass}`}
                    >
                      {formData.email}
                    </a>
                  </div>
                  {formData.website && (
                    <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer group">
                      <Globe className="w-4 h-4 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
                      <a 
                        href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hover:text-tech-cyan transition-colors flex items-center gap-1 ${textClass}`}
                      >
                        {formData.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 社交媒体 */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center bg-tech-cyan/20 rounded-full text-tech-cyan">
                    👥
                  </span>
                  社交媒体
                </h3>
                <div className="space-y-3 pl-2">
                  {formData.twitter && (
                    <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer group">
                      <Twitter className="w-4 h-4 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
                      <a 
                        href={`https://twitter.com/${formData.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hover:text-tech-cyan transition-colors flex items-center gap-1 ${textClass}`}
                      >
                        {formData.twitter}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {formData.github && (
                    <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer group">
                      <Github className="w-4 h-4 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
                      <a 
                        href={`https://github.com/${formData.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hover:text-tech-cyan transition-colors flex items-center gap-1 ${textClass}`}
                      >
                        {formData.github}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {formData.linkedin && (
                    <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer group">
                      <Linkedin className="w-4 h-4 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
                      <a 
                        href={`https://linkedin.com/in/${formData.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hover:text-tech-cyan transition-colors flex items-center gap-1 ${textClass}`}
                      >
                        {formData.linkedin}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}