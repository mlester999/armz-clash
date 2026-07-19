import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@armz-clash/ui', '@armz-clash/config', '@armz-clash/observability'],
  poweredByHeader: false,
};

export default nextConfig;
