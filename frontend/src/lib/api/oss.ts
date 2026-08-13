import { apiFetch } from '@/lib/api-client';
export interface OSSUploadResponse {
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  upload_time: string;
}

export const uploadFile = async (file: File, folder = 'general'): Promise<OSSUploadResponse> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch(`/oss/upload?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  return response.json();
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/oss/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({ file_url: fileUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }
};

export const getFileUrl = async (fileName: string): Promise<string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await apiFetch(`/oss/url?file_name=${encodeURIComponent(fileName)}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.file_url || data.url;
};
