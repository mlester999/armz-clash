/**
 * Monorepo-safe root .env loader.
 * Walks up from cwd (and optional start paths) to find the Armz Clash root .env.
 * Never overrides already-set process.env keys. Never logs secret values.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MARKER_FILES = ['pnpm-workspace.yaml', 'turbo.json'] as const;

export function findMonorepoRoot(startDir = process.cwd()): string | null {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 8; i += 1) {
    const isRoot = MARKER_FILES.every((f) => existsSync(path.join(dir, f)));
    if (isRoot) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function parseEnvFile(filePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(filePath)) return out;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Load root `.env` (and optional `.env.local`) into process.env without override.
 * Returns the path that was loaded, or null if none found.
 */
export function loadRootEnv(options?: { startDir?: string; includeLocal?: boolean }): {
  root: string | null;
  loaded: string[];
} {
  const root = findMonorepoRoot(options?.startDir ?? process.cwd());
  const loaded: string[] = [];
  if (!root) return { root: null, loaded };

  const files = [path.join(root, '.env')];
  if (options?.includeLocal !== false) {
    files.push(path.join(root, '.env.local'));
  }

  for (const file of files) {
    const parsed = parseEnvFile(file);
    if (Object.keys(parsed).length === 0 && !existsSync(file)) continue;
    let applied = 0;
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
        applied += 1;
      }
    }
    if (applied > 0 || existsSync(file)) loaded.push(file);
  }

  return { root, loaded };
}

/** Public client keys that may be synchronized into Next app env files. Never secrets. */
export const PUBLIC_CLIENT_ENV_KEYS = [
  'NEXT_PUBLIC_ARMZ_PRODUCT_NAME',
  'NEXT_PUBLIC_ARMZ_TOKEN_NAME',
  'NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL',
  'NEXT_PUBLIC_ARMZ_NETWORK',
  'NEXT_PUBLIC_ARMZ_DOCS_VERSION',
  'NEXT_PUBLIC_ARMZ_ENVIRONMENT',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_REOWN_PROJECT_ID',
  'NEXT_PUBLIC_ARMZ_TOKEN_MINT',
  'NEXT_PUBLIC_ARMZ_NFT_COLLECTION',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_ARMZ_API_URL',
  'NEXT_PUBLIC_ARMZ_WEB_URL',
  'NEXT_PUBLIC_ARMZ_GAME_URL',
  'NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED',
  'NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED',
  'NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED',
  'NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED',
  'NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED',
  'NEXT_PUBLIC_ARMZ_MAINNET_ENABLED',
] as const;

export function pickPublicClientEnv(
  source: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of PUBLIC_CLIENT_ENV_KEYS) {
    const value = source[key];
    if (value !== undefined && value !== '') out[key] = value;
  }
  return out;
}
