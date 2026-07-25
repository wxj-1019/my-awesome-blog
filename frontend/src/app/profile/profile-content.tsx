'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Mail, Globe, UserRound, Calendar } from 'lucide-react';
import { UserProfile, UserStats } from '@/types';
import { fetchCurrentUserProfile, updateUserProfile, uploadAvatar, fetchCurrentUserStats } from '@/lib/api/profile';
import { useLoading } from '@/context/loading-context';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import PageActHeader from '@/components/layout/PageActHeader';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import TabNavigation from './components/TabNavigation';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import ActivityView from './components/ActivityView';
import ProtectedRoute from '@/components/ProtectedRoute';
export default function ProfilePageContent() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const { themedClasses } = useThemedClasses();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'activity'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{success: boolean; message: string} | null>(null);
  useEffect(() => {
    // ProtectedRoute 已经确保用户已认证，直接加载数据
    const loadProfileData = async () => {
      try {
        showLoading();
        setIsPageLoading(true);
        // 加载资料和统计数据
        const [profileData, statsData] = await Promise.allSettled([
          fetchCurrentUserProfile(),
          fetchCurrentUserStats()
        ]);
        // 处理 profile 数据
        if (profileData.status === 'fulfilled') {
          setProfile(profileData.value);
          setFormData(profileData.value);
        } else {
          console.error('Failed to load profile:', profileData.reason);
          throw profileData.reason;
        }
        // 处理 stats 数据（可选，失败不影响 profile 显示）
        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        } else {
          console.error('Failed to load stats:', statsData.reason);
          // stats 加载失败不影响 profile 显示
          setStats({
            article_count: 0,
            comment_count: 0,
            total_views: 0,
            joined_date: ''
          });
        }
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

    loadProfileData();
  }, [showLoading, hideLoading]);
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
            <Image
              src="/assets/lulu.gif"
              alt="Access Restricted"
              width={320}
              height={240}
              className="w-full h-auto max-w-xs object-contain"
              unoptimized
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
              className="hover:scale-105 transition-transform duration-200"
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
  const cardBgClass = themedClasses.cardBgClass;
  return (
    <ProtectedRoute>
      <div className="min-h-screen pt-24 pb-12 transition-colors duration-300">
        <div className="container mx-auto px-4 max-w-4xl">
          {saveStatus && (
            <div className={`mb-6 p-4 rounded-lg transition-all duration-300 ${
              saveStatus.success 
                ? 'bg-success/20 text-success border border-success/30' 
                : 'bg-destructive/20 text-destructive border border-destructive/30'
            }`}>
              {saveStatus.message}
            </div>
          )}
          <PageActHeader
            kicker="账户 · PROFILE"
            title="个人中心"
            description="管理您的个人资料、设置和活动"
          />
          <FadeIn delay={0.1}>
            <TabNavigation activeTab={activeTab} setActiveTab={(tab: string) => setActiveTab(tab as 'profile' | 'settings' | 'activity')} />
          </FadeIn>
          <div className="mt-6">
            {activeTab === 'profile' && (
              <FadeIn direction="none" duration={0.4}>
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
              </FadeIn>
            )}
            {activeTab === 'settings' && (
              <FadeIn direction="none" duration={0.4}>
                <SettingsView />
              </FadeIn>
            )}
            
            {activeTab === 'activity' && (
              <FadeIn direction="none" duration={0.4}>
                <ActivityView />
              </FadeIn>
            )}
          </div>
          {stats && (
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <StaggerItem className={`${cardBgClass} rounded-xl p-4 text-center transition-transform duration-300 hover:scale-105`}>
                <div className="flex flex-col items-center justify-center">
                  <UserRound className="w-8 h-8 text-tech-cyan mb-2" />
                  <p className="text-2xl font-bold text-tech-cyan">{stats.article_count || 0}</p>
                  <p className="text-sm text-muted-foreground">文章数</p>
                </div>
              </StaggerItem>
              <StaggerItem className={`${cardBgClass} rounded-xl p-4 text-center transition-transform duration-300 hover:scale-105`}>
                <div className="flex flex-col items-center justify-center">
                  <Mail className="w-8 h-8 text-tech-cyan mb-2" />
                  <p className="text-2xl font-bold text-tech-cyan">{stats.comment_count || 0}</p>
                  <p className="text-sm text-muted-foreground">评论数</p>
                </div>
              </StaggerItem>
              <StaggerItem className={`${cardBgClass} rounded-xl p-4 text-center transition-transform duration-300 hover:scale-105`}>
                <div className="flex flex-col items-center justify-center">
                  <Globe className="w-8 h-8 text-tech-cyan mb-2" />
                  <p className="text-2xl font-bold text-tech-cyan">{stats.total_views || 0}</p>
                  <p className="text-sm text-muted-foreground">总浏览量</p>
                </div>
              </StaggerItem>
              <StaggerItem className={`${cardBgClass} rounded-xl p-4 text-center transition-transform duration-300 hover:scale-105`}>
                <div className="flex flex-col items-center justify-center">
                  <Calendar className="w-8 h-8 text-tech-cyan mb-2" />
                  <p className="text-2xl font-bold text-tech-cyan">{stats.joined_date || '-'}</p>
                  <p className="text-sm text-muted-foreground">加入日期</p>
                </div>
              </StaggerItem>
            </Stagger>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
