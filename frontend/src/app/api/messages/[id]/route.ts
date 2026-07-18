import { NextRequest } from 'next/server';
import { API_BASE_URL } from '@/config/api';

// DELETE /api/messages/[id] - 删除留言
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 从请求头中获取认证令牌
    const authHeader = request.headers.get('Authorization');
    
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return Response.json({
      success: true,
      message: '留言删除成功',
    });
  } catch (error) {
    console.error('删除留言失败:', error);
    
    return Response.json(
      {
        success: false,
        message: '删除留言失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// GET /api/messages/[id] - 获取单条留言
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
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
      message: '留言获取成功',
    });
  } catch (error) {
    console.error('获取留言失败:', error);
    
    return Response.json(
      {
        success: false,
        message: '获取留言失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
