/**
 * Load root .env into process.env for Playwright webServer children.
 * Does not override already-set process env (CI secrets win).
 *
 * E2E strategy notes:
 * - Hostname is standardized to 127.0.0.1 for apps and API.
 * - next dev is used for iteration speed; production-like `next start`
 *   remains the preferred long-term approach once CI build time allows.
 * - Real secrets are never logged. NEXT_PUBLIC_* values are public by design.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const E2E_HOST = '127.0.0.1';

export function loadE2eEnv(root = process.cwd()): Record<string, string> {
  const envPath = path.join(root, '.env');
  const out: Record<string, string> = {};
  if (!existsSync(envPath)) return out;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
    if (process.env[k] === undefined) process.env[k] = v;
  }
  return out;
}

/** Public env forwarded to Next apps during E2E. Always pin hosts to 127.0.0.1. */
export function publicE2eEnv(): Record<string, string> {
  loadE2eEnv();
  const pick = (key: string, fallback = '') => process.env[key] ?? fallback;

  const web = `http://${E2E_HOST}:3000`;
  const game = `http://${E2E_HOST}:3001`;
  const admin = `http://${E2E_HOST}:3002`;
  const api = `http://${E2E_HOST}:4000`;

  return {
    NEXT_PUBLIC_REOWN_PROJECT_ID: pick('NEXT_PUBLIC_REOWN_PROJECT_ID'),
    NEXT_PUBLIC_ARMZ_NETWORK: pick('NEXT_PUBLIC_ARMZ_NETWORK', 'devnet'),
    NEXT_PUBLIC_ARMZ_API_URL: api,
    NEXT_PUBLIC_ARMZ_WEB_URL: web,
    NEXT_PUBLIC_ARMZ_GAME_URL: game,
    NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL: pick('NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL', 'ARMZ'),
    NEXT_PUBLIC_ARMZ_PRODUCT_NAME: pick('NEXT_PUBLIC_ARMZ_PRODUCT_NAME', 'Armz Clash'),
    NEXT_PUBLIC_ARMZ_ENVIRONMENT: pick('NEXT_PUBLIC_ARMZ_ENVIRONMENT', 'development'),
    NEXT_PUBLIC_ARMZ_TOKEN_MINT: pick('NEXT_PUBLIC_ARMZ_TOKEN_MINT'),
    NEXT_PUBLIC_ARMZ_NFT_COLLECTION: pick('NEXT_PUBLIC_ARMZ_NFT_COLLECTION'),
    NEXT_PUBLIC_SUPABASE_URL: pick('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: pick('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED: pick('NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED', 'true'),
    NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED: 'false',
    NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED: 'false',
    NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED: 'false',
    NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED: 'false',
    NEXT_PUBLIC_ARMZ_MAINNET_ENABLED: 'false',
    // Align CORS / cookie origins with E2E host (override localhost from .env).
    ARMZ_WEB_ORIGIN: web,
    ARMZ_GAME_ORIGIN: game,
    ARMZ_ADMIN_ORIGIN: admin,
    ARMZ_API_ORIGIN: api,
  };
}

/** Server env for the API webServer (forwards secrets already in process.env). */
export function apiE2eEnv(): Record<string, string> {
  const publicEnv = publicE2eEnv();
  const pick = (key: string, fallback = '') => process.env[key] ?? fallback;

  return {
    ...publicEnv,
    ARMZ_ENVIRONMENT: pick('ARMZ_ENVIRONMENT', 'development'),
    ARMZ_APP_VERSION: pick('ARMZ_APP_VERSION', '0.1.0'),
    ARMZ_LOG_LEVEL: pick('ARMZ_LOG_LEVEL', 'info'),
    ARMZ_API_PORT: '4000',
    ARMZ_SESSION_SIGNING_SECRET: pick('ARMZ_SESSION_SIGNING_SECRET'),
    ARMZ_WALLET_NONCE_SECRET: pick('ARMZ_WALLET_NONCE_SECRET'),
    ARMZ_REQUEST_METADATA_SECRET: pick('ARMZ_REQUEST_METADATA_SECRET'),
    SUPABASE_SERVICE_ROLE_KEY: pick('SUPABASE_SERVICE_ROLE_KEY'),
    SUPABASE_DATABASE_URL: pick('SUPABASE_DATABASE_URL'),
    SUPABASE_PROJECT_REF: pick('SUPABASE_PROJECT_REF'),
    // Feature flags stay hard-disabled for safety.
    ARMZ_MAINNET_ENABLED: 'false',
    ARMZ_REAL_MINT_ENABLED: 'false',
    ARMZ_REAL_REWARDS_ENABLED: 'false',
    ARMZ_CLAIMS_ENABLED: 'false',
    ARMZ_MARKETPLACE_ENABLED: 'false',
    ARMZ_MARKETPLACE_SETTLEMENT_ENABLED: 'false',
    ARMZ_ORACLE_ENABLED: 'false',
    ARMZ_ADMIN_ECONOMY_WRITES_ENABLED: 'false',
    ARMZ_DEMO_MODE_ENABLED: pick('ARMZ_DEMO_MODE_ENABLED', 'true'),
  };
}

export function hasReownProjectId(): boolean {
  loadE2eEnv();
  return Boolean(process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim());
}
