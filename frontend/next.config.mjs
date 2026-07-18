/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typedRoutes: true,
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
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
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