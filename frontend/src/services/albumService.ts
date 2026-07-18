import { apiRequest } from '@/lib/api-client';
import { Album } from '@/types';
import logger from '@/utils/logger';

const API_URL = '/albums';

// 获取所有相册
export const getAllAlbums = async (): Promise<Album[]> => {
  try {
    return await apiRequest(`${API_URL}/`);
  } catch (error) {
    logger.error('Error fetching albums:', error);
    throw error;
  }
};

// 获取特色相册
export const getFeaturedAlbums = async (): Promise<Album[]> => {
  try {
    return await apiRequest(`${API_URL}/featured/list`);
  } catch (error) {
    logger.error('Error fetching featured albums:', error);
    throw error;
  }
};

// 根据ID获取特定相册
export const getAlbumById = async (id: string): Promise<Album> => {
  try {
    return await apiRequest(`${API_URL}/${id}`);
  } catch (error) {
    logger.error(`Error fetching album with id ${id}:`, error);
    throw error;
  }
};

// 获取相册内的图片
export const getAlbumImages = async (albumId: string) => {
  try {
    return await apiRequest(`${API_URL}/${albumId}/images`);
  } catch (error) {
    logger.error(`Error fetching images for album ${albumId}:`, error);
    throw error;
  }
};
