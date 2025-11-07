/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  async rewrites() {
    const bffOrigin = process.env.NEXT_PUBLIC_BFF_ORIGIN?.replace(/\/$/, '');
    if (!bffOrigin) return [];
    return [
      {
        source: '/bff/:path*',
        destination: `${bffOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
