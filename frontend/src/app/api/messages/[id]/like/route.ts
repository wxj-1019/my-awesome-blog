import { NextRequest } from 'next/server';
import { API_BASE_URL } from '@/config/api';

// POST /api/messages/[id]/like - 点赞留言
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 从请求头中获取认证令牌
    const authHeader = request.headers.get('Authorization');
    
    const response = await fetch(`${API_BASE_URL}/messages/${id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return Response.json({
      success: true,
      data,
      message: '点赞成功',
    });
  } catch (error) {
    console.error('点赞失败:', error);
    
    return Response.json(
      {
        success: false,
        message: '点赞失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
