import { NextRequest } from 'next/server';
import { API_BASE_URL } from '@/config/api';

// GET /api/messages - 获取所有留言
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const danmakuOnly = searchParams.get('danmaku') === 'true';
    
    // 构建后端API URL
    const endpoint = danmakuOnly 
      ? `${API_BASE_URL}/messages/danmaku`
      : `${API_BASE_URL}/messages/`;
    
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return Response.json({
      success: true,
      data,
      message: '留言数据获取成功',
    });
  } catch (error) {
    console.error('获取留言数据失败:', error);
    
    return Response.json(
      {
        success: false,
        message: '获取留言数据失败',
        error: error instanceof Error ? error.message : '未知错误',
        data: [],
      },
      { status: 500 }
    );
  }
}

// POST /api/messages - 创建新留言
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 从请求头中获取认证令牌
    const authHeader = request.headers.get('Authorization');
    
    const response = await fetch(`${API_BASE_URL}/messages/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return Response.json({
      success: true,
      data,
      message: '留言创建成功',
    });
  } catch (error) {
    console.error('创建留言失败:', error);
    
    return Response.json(
      {
        success: false,
        message: '创建留言失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
