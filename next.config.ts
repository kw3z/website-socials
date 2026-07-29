import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/badapple/:path*',
        destination:
          'https://github.com/kw3z/website-socials/releases/download/badapple-assets-v1/:path*',
      },
    ];
  },
};

export default nextConfig;
