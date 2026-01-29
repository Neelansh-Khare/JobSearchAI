import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*' // Proxy to Backend
      }
    ];
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: '/api',
  }
};

export default nextConfig;
