import { z } from 'zod';
import { SolanaNetworkSchema, DEFAULT_SOLANA_NETWORK } from '../network';
import { DEFAULT_FEATURE_FLAGS, parseStrictBoolean } from '../features';

/**
 * Client-safe environment only.
 * Never put service-role keys, session secrets, or treasury signers here.
 *
 * IMPORTANT: Next.js only statically embeds NEXT_PUBLIC_* values when they are
 * referenced as direct `process.env.NEXT_PUBLIC_*` expressions. Do not default
 * to a generic `process.env as Record` cast for browser resolution.
 */
export const ClientEnvSchema = z.object({
  NEXT_PUBLIC_ARMZ_PRODUCT_NAME: z.string().min(1).default('Armz Clash'),
  NEXT_PUBLIC_ARMZ_TOKEN_NAME: z.string().min(1).default('Armz'),
  NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL: z.string().min(1).default('ARMZ'),
  NEXT_PUBLIC_ARMZ_NETWORK: SolanaNetworkSchema.default(DEFAULT_SOLANA_NETWORK),
  NEXT_PUBLIC_ARMZ_DOCS_VERSION: z.string().min(1).default('0.1.0-phase1'),
  NEXT_PUBLIC_ARMZ_ENVIRONMENT: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(''),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(''),
  NEXT_PUBLIC_REOWN_PROJECT_ID: z.string().optional().default(''),
  NEXT_PUBLIC_ARMZ_TOKEN_MINT: z.string().optional().default(''),
  NEXT_PUBLIC_ARMZ_NFT_COLLECTION: z.string().optional().default(''),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(''),
  NEXT_PUBLIC_ARMZ_API_URL: z.string().optional().default('http://127.0.0.1:4000'),
  NEXT_PUBLIC_ARMZ_WEB_URL: z.string().optional().default('http://127.0.0.1:3000'),
  NEXT_PUBLIC_ARMZ_GAME_URL: z.string().optional().default('http://127.0.0.1:3001'),
  // Feature flags mirrored for client display only (non-authoritative).
  NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED: z.boolean().default(DEFAULT_FEATURE_FLAGS.demoModeEnabled),
  NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED: z.boolean().default(DEFAULT_FEATURE_FLAGS.realMintEnabled),
  NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED: z
    .boolean()
    .default(DEFAULT_FEATURE_FLAGS.realRewardsEnabled),
  NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED: z.boolean().default(DEFAULT_FEATURE_FLAGS.claimsEnabled),
  NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED: z
    .boolean()
    .default(DEFAULT_FEATURE_FLAGS.marketplaceEnabled),
  NEXT_PUBLIC_ARMZ_MAINNET_ENABLED: z.boolean().default(DEFAULT_FEATURE_FLAGS.mainnetEnabled),
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;

/** Public env bag used for browser defaults and unit-test overrides. */
export type PublicEnvironment = Record<string, string | undefined>;

/**
 * Explicit direct process.env.NEXT_PUBLIC_* reads so Next.js can embed values
 * into client bundles. Never replace this with dynamic key access for defaults.
 */
export function readBundledPublicEnvironment(): PublicEnvironment {
  return {
    NEXT_PUBLIC_ARMZ_PRODUCT_NAME: process.env.NEXT_PUBLIC_ARMZ_PRODUCT_NAME,
    NEXT_PUBLIC_ARMZ_TOKEN_NAME: process.env.NEXT_PUBLIC_ARMZ_TOKEN_NAME,
    NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL: process.env.NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL,
    NEXT_PUBLIC_ARMZ_NETWORK: process.env.NEXT_PUBLIC_ARMZ_NETWORK,
    NEXT_PUBLIC_ARMZ_DOCS_VERSION: process.env.NEXT_PUBLIC_ARMZ_DOCS_VERSION,
    NEXT_PUBLIC_ARMZ_ENVIRONMENT: process.env.NEXT_PUBLIC_ARMZ_ENVIRONMENT,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_REOWN_PROJECT_ID: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
    NEXT_PUBLIC_ARMZ_TOKEN_MINT: process.env.NEXT_PUBLIC_ARMZ_TOKEN_MINT,
    NEXT_PUBLIC_ARMZ_NFT_COLLECTION: process.env.NEXT_PUBLIC_ARMZ_NFT_COLLECTION,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_ARMZ_API_URL: process.env.NEXT_PUBLIC_ARMZ_API_URL,
    NEXT_PUBLIC_ARMZ_WEB_URL: process.env.NEXT_PUBLIC_ARMZ_WEB_URL,
    NEXT_PUBLIC_ARMZ_GAME_URL: process.env.NEXT_PUBLIC_ARMZ_GAME_URL,
    NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED: process.env.NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED,
    NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED: process.env.NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED,
    NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED: process.env.NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED,
    NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED: process.env.NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED,
    NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED: process.env.NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED,
    NEXT_PUBLIC_ARMZ_MAINNET_ENABLED: process.env.NEXT_PUBLIC_ARMZ_MAINNET_ENABLED,
  };
}

function readPublicBool(env: PublicEnvironment, key: string, fallback: boolean): boolean {
  const parsed = parseStrictBoolean(env[key], key);
  return parsed === undefined ? fallback : parsed;
}

function normalizePublicUrl(value: string | undefined, fallback: string): string {
  const raw = (value ?? '').trim();
  if (!raw) return fallback;
  return raw.replace(/\/$/, '');
}

/**
 * Load and validate client-safe environment.
 *
 * @param override Optional public env bag for unit tests. When omitted, uses
 * explicit bundled `process.env.NEXT_PUBLIC_*` references for Next.js embedding.
 */
export function loadClientEnv(override?: PublicEnvironment): ClientEnv {
  const env = override ?? readBundledPublicEnvironment();

  return ClientEnvSchema.parse({
    NEXT_PUBLIC_ARMZ_PRODUCT_NAME: env.NEXT_PUBLIC_ARMZ_PRODUCT_NAME,
    NEXT_PUBLIC_ARMZ_TOKEN_NAME: env.NEXT_PUBLIC_ARMZ_TOKEN_NAME,
    NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL: env.NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL,
    NEXT_PUBLIC_ARMZ_NETWORK: env.NEXT_PUBLIC_ARMZ_NETWORK,
    NEXT_PUBLIC_ARMZ_DOCS_VERSION: env.NEXT_PUBLIC_ARMZ_DOCS_VERSION,
    NEXT_PUBLIC_ARMZ_ENVIRONMENT: env.NEXT_PUBLIC_ARMZ_ENVIRONMENT,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_REOWN_PROJECT_ID: (env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? '').trim(),
    NEXT_PUBLIC_ARMZ_TOKEN_MINT: env.NEXT_PUBLIC_ARMZ_TOKEN_MINT,
    NEXT_PUBLIC_ARMZ_NFT_COLLECTION: env.NEXT_PUBLIC_ARMZ_NFT_COLLECTION,
    NEXT_PUBLIC_SENTRY_DSN: env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_ARMZ_API_URL: normalizePublicUrl(
      env.NEXT_PUBLIC_ARMZ_API_URL,
      'http://127.0.0.1:4000',
    ),
    NEXT_PUBLIC_ARMZ_WEB_URL: normalizePublicUrl(
      env.NEXT_PUBLIC_ARMZ_WEB_URL,
      'http://127.0.0.1:3000',
    ),
    NEXT_PUBLIC_ARMZ_GAME_URL: normalizePublicUrl(
      env.NEXT_PUBLIC_ARMZ_GAME_URL,
      'http://127.0.0.1:3001',
    ),
    // Client mirrors only — never fall back to server-only ARMZ_* keys here.
    NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED',
      DEFAULT_FEATURE_FLAGS.demoModeEnabled,
    ),
    NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED',
      DEFAULT_FEATURE_FLAGS.realMintEnabled,
    ),
    NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED',
      DEFAULT_FEATURE_FLAGS.realRewardsEnabled,
    ),
    NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED',
      DEFAULT_FEATURE_FLAGS.claimsEnabled,
    ),
    NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED',
      DEFAULT_FEATURE_FLAGS.marketplaceEnabled,
    ),
    NEXT_PUBLIC_ARMZ_MAINNET_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_MAINNET_ENABLED',
      DEFAULT_FEATURE_FLAGS.mainnetEnabled,
    ),
  });
}

/** True when a non-empty Reown Project ID is configured (value never returned). */
export function isReownProjectIdConfigured(env?: PublicEnvironment): boolean {
  const source = env ?? readBundledPublicEnvironment();
  return Boolean((source.NEXT_PUBLIC_REOWN_PROJECT_ID ?? '').trim());
}
