'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Mail, Globe, Twitter, Github, Linkedin, User, UserRound, AtSign, Link as LinkIcon, MapPin, Calendar } from 'lucide-react';
import { UserProfile, UserStats } from '@/types';
import { fetchCurrentUserProfile, updateUserProfile, uploadAvatar, fetchCurrentUserStats } from '@/lib/api/profile';
import { validateSocialLink } from '@/lib/validation';
import { useLoading } from '@/context/loading-context';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import TabNavigation from './components/TabNavigation';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import ActivityView from './components/ActivityView';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProfilePage() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const { themedClasses, getThemeClass } = useThemedClasses();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'activity'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    // ProtectedRoute 已经确保用户已认证，直接加载数据
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      showLoading();
      setIsPageLoading(true);

      // 加载资料和统计数据
      const [profileData, statsData] = await Promise.all([
        fetchCurrentUserProfile(),
        fetchCurrentUserStats()
      ]);

      setProfile(profileData);
      setStats(statsData);
      setFormData(profileData);
    } catch (error) {
      console.error('Error loading profile data:', error);
      // 数据加载失败，显示错误提示
      setSaveStatus({ 
        success: false, 
        message: '加载个人资料失败，请刷新页面重试' 
      });
    } finally {
      hideLoading();
      setIsPageLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        // 调用API上传头像
        const result = await uploadAvatar(file);
        setFormData((prev: Partial<UserProfile>) => ({
          ...prev,
          avatar: result.avatar_url
        }));
      } catch (error) {
        console.error('Error uploading avatar:', error);
        // 检查是否是认证错误
        if (error instanceof Error && error.message.includes('not authenticated')) {
          // 如果是认证错误，重定向到登录页面
          router.push('/login');
          return;
        }
        // 如果是其他错误，显示错误信息
        setSaveStatus({ success: false, message: '上传头像失败，请重试。' });
        setTimeout(() => setSaveStatus(null), 3000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 调用API更新用户信息
      await updateUserProfile(formData);

      // 重新获取用户资料和统计数据
      const updatedProfile = await fetchCurrentUserProfile();
      const updatedStats = await fetchCurrentUserStats();

      setProfile(updatedProfile);
      setStats(updatedStats);
      setIsEditing(false);
      setSaveStatus({ success: true, message: '个人资料已成功更新!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      // 检查是否是认证错误
      if (error instanceof Error && error.message.includes('not authenticated')) {
        // 如果是认证错误，重定向到登录页面
        router.push('/login');
        return;
      }
      // 如果是其他错误，显示错误信息
      setSaveStatus({ success: false, message: '更新个人资料时出错，请重试。' });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
        <div className="text-center">
          <p className="text-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
        <div className="p-8 max-w-md w-full mx-4 border-border">
          <div className="mb-6 flex justify-center">
            <img
              src="/assets/lulu.gif"
              alt="Access Restricted"
              className="w-full max-w-xs object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4 text-foreground">访问受限</h2>
          <p className="text-center text-muted-foreground mb-6">
            请先登录以查看您的个人资料
          </p>
          <div className="flex justify-center">
            <Button
              asChild
              variant="glass"
              className="hover:scale-105 transition-all duration-200"
            >
              <Link href="/login">
                前往登录
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 主题相关样式
  const containerBgClass = getThemeClass(
    'bg-gradient-to-br from-tech-darkblue/20 via-tech-deepblue/10 to-tech-cyan/5',
    'bg-gradient-to-br from-gray-100 to-gray-50'
  );

  const cardBgClass = themedClasses.cardBgClass;
  const textClass = themedClasses.textClass;
  const accentClass = getThemeClass(
    'text-tech-cyan',
    'text-blue-600'
  );

  return (
    <ProtectedRoute>
      <div className={`min-h-screen py-8 sm:py-12 transition-colors duration-300 ${containerBgClass}`}>
        <div className="container mx-auto px-4 max-w-4xl">
          {saveStatus && (
            <div className={`mb-6 p-4 rounded-lg transition-all duration-300 ${
              saveStatus.success 
                ? 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'
            }`}>
              {saveStatus.message}
            </div>
          )}

          <div className="mb-8 text-center">
            <h1 className={`text-4xl font-bold ${accentClass}`}>个人中心</h1>
            <p className={`text-lg mt-2 ${getThemeClass('text-foreground/70', 'text-gray-600')}`}>管理您的个人资料、设置和活动</p>
          </div>

          <TabNavigation activeTab={activeTab} setActiveTab={(tab: string) => setActiveTab(tab as 'profile' | 'settings' | 'activity')} />

          <div className="mt-6">
            {activeTab === 'profile' && (
              <ProfileView
                profile={profile}
                isEditing={isEditing}
                setEditing={setIsEditing}
                formData={formData}
                setFormData={setFormData}
                onSave={() => handleSubmit(new Event('submit') as unknown as React.FormEvent)}
                onCancel={() => {
                  setIsEditing(false);
                  setFormData(profile);
                }}
                onAvatarChange={handleAvatarUpload}
              />
            )}

            {activeTab === 'settings' && <SettingsView />}
            
            {activeTab === 'activity' && <ActivityView />}
          </div>

          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className={`${cardBgClass} rounded-xl p-4 text-center transition-transform duration-300 hover:scale-105`}>
                <div className="flex flex-col items-center justify-center">
                  <UserRound className="w-8 h-8 text-tech-cyan mb-2" />
                  <p className="text-2xl font-bold text-tech-cyan">{stats.article_count || 0}</p>
                  <p className="text-sm text-muted-foreground">文章数</p>
                </div>
              </div>
              <div className={`${cardBgClass} rounded-xl p-4 text-center transition-transform duration-300 hover:scale-105`}>
                <div className="flex flex-col items-center justify-center">
                  <Mail className="w-8 h-8 text-tech-cyan mb-2" />
                  <p className="text-2xl font-bold text-tech-cyan">{stats.comment_count || 0}</p>
                  <p className="text-sm text-muted-foreground">评论数</p>
                </div>
              </div>
              <div className={`${cardBgClass} rounded-xl p-4 text-center transition-transform duration-300 hover:scale-105`}>
                <div className="flex flex-col items-center justify-center">
                  <Globe className="w-8 h-8 text-tech-cyan mb-2" />
                  <p className="text-2xl font-bold text-tech-cyan">{stats.total_views || 0}</p>
                  <p className="text-sm text-muted-foreground">总浏览量</p>
                </div>
              </div>
              <div className={`${cardBgClass} rounded-xl p-4 text-center transition-transform duration-300 hover:scale-105`}>
                <div className="flex flex-col items-center justify-center">
                  <Calendar className="w-8 h-8 text-tech-cyan mb-2" />
                  <p className="text-2xl font-bold text-tech-cyan">{stats.joined_date || '-'}</p>
                  <p className="text-sm text-muted-foreground">加入日期</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}