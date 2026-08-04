'use client';
import { AtSign, Mail, Edit3, Save, X, Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
interface ProfileHeaderProps {
  profile: {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    avatar?: string;
    bio?: string;
    website?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  isEditing?: boolean;
  onEditToggle?: () => void;
  onAvatarChange?: (avatar: string) => void;
}
export default function ProfileHeader({
  profile,
  isEditing = false,
  onEditToggle
}: ProfileHeaderProps) {
  return (
    <GlassCard 
      padding="none" 
      className="overflow-hidden border-tech-cyan/20 hover:shadow-[0_0_40px_var(--shadow-tech-cyan)] transition-colors duration-500"
    >
      {/* 渐变背景头部 */}
      <div className="relative h-32 bg-gradient-to-r from-tech-cyan/20 via-tech-sky/20 to-tech-cyan/20 overflow-hidden">
        {/* 动态背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-tech-cyan/10 to-transparent animate-gradient-move" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMzcsIDk5LCAyMzUsIDAuMSkiLz48L3N2Zz4=')] opacity-30" />
        
        {/* 顶部按钮 */}
        <div className="absolute top-4 right-4 flex gap-2">
          {!isEditing ? (
            <Button
              onClick={onEditToggle}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-[colors,transform] duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">编辑资料</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onEditToggle}
                className="border-tech-cyan/50 hover:bg-tech-cyan/10 text-foreground hover:text-tech-cyan transition-[colors,transform] duration-300 hover:scale-105"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-[colors,transform] duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">保存</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* 主要内容区域 */}
      <div className="px-6 pb-8 pt-4">
        {/* 右侧：用户信息 */}
        <div className="flex-grow pt-2">
          <div className="space-y-4">
            {/* 用户名和邮箱 */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <span className="text-gradient-primary animate-fade-in-up">
                  {profile.fullName || profile.username}
                </span>
                {isEditing && (
                  <Sparkles className="w-5 h-5 text-tech-cyan animate-pulse" />
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 hover:text-tech-cyan transition-colors cursor-pointer group">
                  <AtSign className="w-4 h-4 text-tech-cyan group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-tech-cyan transition-colors">@{profile.username}</span>
                </div>
                <div className="flex items-center gap-2 hover:text-tech-cyan transition-colors cursor-pointer group">
                  <Mail className="w-4 h-4 text-tech-cyan group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-tech-cyan transition-colors">{profile.email}</span>
                </div>
              </div>
            </div>
            {/* 个人简介 */}
            {profile.bio && (
              <div className="max-w-2xl">
                <p className="text-foreground leading-relaxed animate-fade-in-up">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 底部发光效果 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-tech-cyan to-transparent opacity-50 animate-pulse" />
    </GlassCard>
  );
}