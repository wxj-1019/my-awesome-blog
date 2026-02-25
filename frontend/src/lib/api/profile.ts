import { UserProfile } from '@/types';
import { getToken } from '../auth-utils';
import { API_BASE_URL } from '@/config/api';

export interface UserStats {
  article_count: number;
  comment_count: number;
  total_views: number;
  joined_date: string;
}

// 获取当前用户信息
export const fetchCurrentUserProfile = async (): Promise<UserProfile> => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
};

// 更新用户信息
export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  const payload = {
    ...(profileData.fullName !== undefined && { full_name: profileData.fullName }),
    ...(profileData.email !== undefined && { email: profileData.email }),
    ...(profileData.username !== undefined && { username: profileData.username }),
    ...(profileData.bio !== undefined && { bio: profileData.bio }),
    ...(profileData.avatar !== undefined && { avatar: profileData.avatar }),
    ...(profileData.website !== undefined && { website: profileData.website }),
    ...(profileData.twitter !== undefined && { twitter: profileData.twitter }),
    ...(profileData.github !== undefined && { github: profileData.github }),
    ...(profileData.linkedin !== undefined && { linkedin: profileData.linkedin })
  };

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorData;
    let errorText = '';
    try {
      errorText = await response.text();
      console.log('Raw error response:', errorText);
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { detail: errorText || `HTTP error! status: ${response.status}` };
    }
    console.error('Update profile error:', errorData, 'Status:', response.status);
    if (response.status === 401) {
      throw new Error('User not authenticated');
    }
    throw new Error(errorData.detail || errorData.message || 'Failed to update profile');
  }

  return response.json();
};

// 获取用户统计信息
export const fetchCurrentUserStats = async (): Promise<UserStats> => {
  const token = getToken();
  const url = `${API_BASE_URL}/users/me/stats`;
  console.log('Fetching user stats from:', url);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch user stats:', response.status, errorText);
    throw new Error(`Failed to fetch user stats: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('User stats data:', data);
  return data;
};

// 上传头像
export const uploadAvatar = async (file: File): Promise<{ avatar_url: string }> => {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的文件类型，仅支持 JPG, PNG, GIF, WEBP 格式');
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('文件过大，最大支持 5MB');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    let errorData;
    let errorText = '';
    try {
      errorText = await response.text();
      console.log('Raw error response:', errorText);
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { detail: errorText || `HTTP error! status: ${response.status}` };
    }
    console.error('Upload avatar error:', errorData, 'Status:', response.status);
    if (response.status === 401) {
      throw new Error('User not authenticated');
    }
    throw new Error(errorData.detail || errorData.message || 'Failed to upload avatar');
  }

  const result = await response.json();
  console.log('Avatar upload successful:', result);
  return { avatar_url: result.avatar_url };
};
