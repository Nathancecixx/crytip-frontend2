const rawProxyTarget = process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_BASE_URL;
const API_PROXY_TARGET = rawProxyTarget ? rawProxyTarget.trim().replace(/\/$/, '') : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  async rewrites() {
    if (!API_PROXY_TARGET) return [];
    const destinationBase = API_PROXY_TARGET;
    return [
      {
        source: '/api/:path*',
        destination: `${destinationBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
