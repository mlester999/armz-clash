import type { NextConfig } from 'next';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Load monorepo root .env public vars into process.env for Next embedding.
 * App-level .env.local still wins when Next loads it; we only fill missing keys.
 * Never logs values.
 */
function loadMonorepoPublicEnv(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, '../..');
  const envPath = path.join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    if (!k.startsWith('NEXT_PUBLIC_')) continue;
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

loadMonorepoPublicEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Local and Playwright use 127.0.0.1 exclusively for this project.
  allowedDevOrigins: ['127.0.0.1'],
  transpilePackages: [
    '@armz-clash/ui',
    '@armz-clash/config',
    '@armz-clash/observability',
    '@armz-clash/blockchain',
    '@armz-clash/game-core',
  ],
  poweredByHeader: false,
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
