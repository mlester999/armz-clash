import { z } from 'zod';
import { SolanaNetworkSchema, DEFAULT_SOLANA_NETWORK } from '../network';
import { DEFAULT_FEATURE_FLAGS, parseStrictBoolean } from '../features';

/**
 * Client-safe environment only.
 * Never put service-role keys, session secrets, or treasury signers here.
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

function readPublicBool(
  env: Record<string, string | undefined>,
  key: string,
  fallback: boolean,
): boolean {
  const parsed = parseStrictBoolean(env[key], key);
  return parsed === undefined ? fallback : parsed;
}

export function loadClientEnv(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): ClientEnv {
  return ClientEnvSchema.parse({
    NEXT_PUBLIC_ARMZ_PRODUCT_NAME: env.NEXT_PUBLIC_ARMZ_PRODUCT_NAME,
    NEXT_PUBLIC_ARMZ_TOKEN_NAME: env.NEXT_PUBLIC_ARMZ_TOKEN_NAME,
    NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL: env.NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL,
    NEXT_PUBLIC_ARMZ_NETWORK: env.NEXT_PUBLIC_ARMZ_NETWORK,
    NEXT_PUBLIC_ARMZ_DOCS_VERSION: env.NEXT_PUBLIC_ARMZ_DOCS_VERSION,
    NEXT_PUBLIC_ARMZ_ENVIRONMENT: env.NEXT_PUBLIC_ARMZ_ENVIRONMENT ?? env.ARMZ_ENVIRONMENT,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_REOWN_PROJECT_ID: env.NEXT_PUBLIC_REOWN_PROJECT_ID,
    NEXT_PUBLIC_ARMZ_TOKEN_MINT: env.NEXT_PUBLIC_ARMZ_TOKEN_MINT,
    NEXT_PUBLIC_ARMZ_NFT_COLLECTION: env.NEXT_PUBLIC_ARMZ_NFT_COLLECTION,
    NEXT_PUBLIC_SENTRY_DSN: env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_ARMZ_API_URL: env.NEXT_PUBLIC_ARMZ_API_URL,
    NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED',
      readPublicBool(env, 'ARMZ_DEMO_MODE_ENABLED', DEFAULT_FEATURE_FLAGS.demoModeEnabled),
    ),
    NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED',
      readPublicBool(env, 'ARMZ_REAL_MINT_ENABLED', DEFAULT_FEATURE_FLAGS.realMintEnabled),
    ),
    NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED',
      readPublicBool(env, 'ARMZ_REAL_REWARDS_ENABLED', DEFAULT_FEATURE_FLAGS.realRewardsEnabled),
    ),
    NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED',
      readPublicBool(env, 'ARMZ_CLAIMS_ENABLED', DEFAULT_FEATURE_FLAGS.claimsEnabled),
    ),
    NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED',
      readPublicBool(env, 'ARMZ_MARKETPLACE_ENABLED', DEFAULT_FEATURE_FLAGS.marketplaceEnabled),
    ),
    NEXT_PUBLIC_ARMZ_MAINNET_ENABLED: readPublicBool(
      env,
      'NEXT_PUBLIC_ARMZ_MAINNET_ENABLED',
      readPublicBool(env, 'ARMZ_MAINNET_ENABLED', DEFAULT_FEATURE_FLAGS.mainnetEnabled),
    ),
  });
}
