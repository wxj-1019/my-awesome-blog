import { NextRequest, NextResponse } from 'next/server';

// 定义需要认证的路径模式
// 注意：由于前端将令牌存储在 localStorage 中，服务端中间件无法访问
// 因此只对服务端渲染的受保护路由使用中间件保护
// 客户端路由（如 /profile）由 ProtectedRoute 组件保护
const protectedPaths = [
  '/dashboard',
  // 可以在这里添加更多需要认证的路径
];

export function middleware(request: NextRequest) {
  // 检查当前路径是否需要认证
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    // 检查是否存在认证令牌 (从cookies或headers中获取)
    const hasValidSession = request.cookies.get('auth_token')?.value ||
                           request.headers.get('Authorization')?.startsWith('Bearer ');

    if (!hasValidSession) {
      // 重定向到登录页面，并保留原始路径
      const redirectUrl = `/login?message=${encodeURIComponent('请先登录以查看此页面')}&redirect=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
}

// 配置哪些路径会触发中间件
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了:
     * - 所有静态文件 (/css, /js, /images, /fonts)
     * - public 目录下的所有文件
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|assets).*)',
  ],
};