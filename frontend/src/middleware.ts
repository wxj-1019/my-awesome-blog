import { NextRequest, NextResponse } from 'next/server';

/**
 * 边缘路由保护（cookie 存在性检查）。
 * 完整鉴权仍由后端 JWT + 前端 ProtectedRoute 负责。
 * 登录时 auth-utils.setToken 会同步写入 auth_token cookie。
 */
const protectedPathPrefixes = [
  '/admin',
  '/dashboard',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const cookieToken = request.cookies.get('auth_token')?.value;
  const headerAuth = request.headers.get('Authorization');
  const hasSession =
    Boolean(cookieToken && cookieToken.length > 0) ||
    Boolean(headerAuth?.startsWith('Bearer '));

  if (!hasSession) {
    const login = new URL('/login', request.url);
    login.searchParams.set('message', '请先登录以访问管理后台');
    login.searchParams.set(
      'redirect',
      pathname + request.nextUrl.search
    );
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|assets).*)',
  ],
};
