import { NextRequest } from 'next/server';
import { Album } from '@/types';
import { API_BASE_URL } from '@/config/api';

// GET /api/albums - 获取所有相册
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '100';

    // 从后端API获取相册数据
    const response = await fetch(`${API_BASE_URL}/albums?skip=${skip}&limit=${limit}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`后端API请求失败: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();

    let albums: Album[];
    try {
      albums = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      throw new Error('Invalid JSON response from backend');
    }
    
    if (!Array.isArray(albums)) {
      console.error('后端返回的数据不是数组:', typeof albums);
      throw new Error('Backend returned non-array data');
    }
    
    return Response.json({
      success: true,
      data: albums,
      message: '相册数据获取成功'
    });
  } catch (error) {
    console.error('获取相册数据失败:', error);
    
    return Response.json(
      {
        success: false,
        message: '获取相册数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}