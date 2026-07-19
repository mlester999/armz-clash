import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  transpilePackages: [
    '@armz-clash/ui',
    '@armz-clash/config',
    '@armz-clash/observability',
    '@armz-clash/blockchain',
  ],
  poweredByHeader: false,
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
