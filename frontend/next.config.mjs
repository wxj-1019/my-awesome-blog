/** @type {import('next').NextConfig} */

// MinIO 对象存储对外域名（nginx 反代）经 env 注入，与后端 MINIO_PUBLIC_BASE_URL 同名同值；
// 避免把裸 IP / 明文 HTTP 硬编码进仓库。本地开发不配此项，图片走 localhost 条目。
function originToRemotePattern(origin) {
  try {
    const url = new URL(origin);
    return {
      protocol: url.protocol.replace(/:$/, ''),
      hostname: url.hostname,
      // 不带 port = 匹配默认端口；带了则严格锁定，避免任意端口都能作图片来源
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    return null;
  }
}

const minioRemotePattern = originToRemotePattern(
  process.env.MINIO_PUBLIC_BASE_URL || ''
);

const nextConfig = {
  output: 'standalone',
  typedRoutes: true,
  // 避免 /api/v1/foo/ 被 308 成无尾斜杠，再被 FastAPI 307 到绝对 :8989 引发 CORS Failed to fetch
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'my-awesome-blog.oss-cn-hangzhou.aliyuncs.com',
      },
      // Pexels 素材站（admin 封面选择器常用来源）
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      // MinIO 对象存储对外域名（nginx 反代）：生产部署经 MINIO_PUBLIC_BASE_URL 注入
      ...(minioRemotePattern ? [minioRemotePattern] : []),
    ],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    return [
      {
        source: '/posts',
        destination: '/articles',
        permanent: true,
      },
      {
        source: '/posts/:id',
        destination: '/articles/:id',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // 本地开发默认代理到本机后端；Docker 内设置 INTERNAL_API_URL=http://backend:8989
    const internalApi =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_ORIGIN ||
      'http://127.0.0.1:8989';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${internalApi.replace(/\/$/, '')}/api/v1/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }
    return config;
  },
  turbopack: {
    // 空配置，用于消除 Next.js 16 的警告
  },
};

export default nextConfig;