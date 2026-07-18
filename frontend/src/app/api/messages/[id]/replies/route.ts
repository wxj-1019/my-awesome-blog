import { NextRequest } from 'next/server';
import { API_BASE_URL } from '@/config/api';

// GET /api/messages/[id]/replies - 获取留言的回复列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const response = await fetch(`${API_BASE_URL}/messages/${id}/replies`, {
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
      message: '回复列表获取成功',
    });
  } catch (error) {
    console.error('获取回复列表失败:', error);
    
    return Response.json(
      {
        success: false,
        message: '获取回复列表失败',
        error: error instanceof Error ? error.message : '未知错误',
        data: [],
      },
      { status: 500 }
    );
  }
}
