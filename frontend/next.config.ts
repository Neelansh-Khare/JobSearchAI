import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/:path*' // Use backend service name for Docker
      }
    ];
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: '/api',
  }
};

export default nextConfig;
