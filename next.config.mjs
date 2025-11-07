const DEFAULT_PROXY_TARGET = 'https://cryptip-backend.vercel.app';
const rawProxyTarget = process.env.API_PROXY_TARGET;
const API_PROXY_TARGET = rawProxyTarget === undefined ? DEFAULT_PROXY_TARGET : rawProxyTarget;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  async rewrites() {
    if (!API_PROXY_TARGET) return [];
    const destinationBase = API_PROXY_TARGET.replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${destinationBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
