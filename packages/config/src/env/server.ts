import { z } from 'zod';
import { assertFeatureFlagSafety, parseFeatureFlagsFromEnv, type FeatureFlags } from '../features';
import { SharedEnvSchema } from './shared';
import { DEFAULT_SOLANA_NETWORK, type SolanaNetwork } from '../network';
import { PORTS } from '../ports';

/**
 * Server-only environment.
 * Must never be imported into client components or browser bundles.
 */
export const ServerEnvSchema = SharedEnvSchema.extend({
  // Supabase (optional in Phase 1 local foundation)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_DATABASE_URL: z.string().optional().default(''),
  SUPABASE_PROJECT_REF: z.string().optional().default(''),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(''),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(''),

  // Solana placeholders (optional until later phases)
  SOLANA_RPC_URL: z.string().optional().default(''),
  SOLANA_WS_URL: z.string().optional().default(''),
  ARMZ_TREASURY_PUBLIC_KEY: z.string().optional().default(''),
  ARMZ_REWARD_TREASURY_PUBLIC_KEY: z.string().optional().default(''),
  ARMZ_MARKETPLACE_FEE_TREASURY_PUBLIC_KEY: z.string().optional().default(''),

  // Security placeholders (optional until later phases)
  ARMZ_WALLET_NONCE_SECRET: z.string().optional().default(''),
  ARMZ_SESSION_SIGNING_SECRET: z.string().optional().default(''),
  ARMZ_REWARD_SIGNER_SECRET: z.string().optional().default(''),
  ARMZ_PRODUCTION_ADMIN_WRITES_APPROVED: z.string().optional().default('false'),

  // Hosted safety gates
  SUPABASE_REMOTE_WRITES_APPROVED: z.string().optional().default('false'),
  RUN_HOSTED_SUPABASE_TESTS: z.string().optional().default('false'),

  // Observability
  SENTRY_DSN: z.string().optional().default(''),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional().default(''),

  // Service ports
  ARMZ_API_PORT: z.coerce.number().int().positive().default(PORTS.api),
  ARMZ_WORKER_HEALTH_PORT: z.coerce.number().int().positive().default(PORTS.workerHealth),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema> & {
  features: FeatureFlags;
  network: SolanaNetwork;
};

function isTruthyStrict(value: string | undefined): boolean {
  return value === 'true' || value === 'TRUE' || value === 'True';
}

export function loadServerEnv(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): ServerEnv {
  const parsed = ServerEnvSchema.parse(env);
  const features = parseFeatureFlagsFromEnv(env);

  assertFeatureFlagSafety(features, {
    environment: parsed.ARMZ_ENVIRONMENT,
    hasRewardTreasuryConfig: Boolean(parsed.ARMZ_REWARD_TREASURY_PUBLIC_KEY),
    hasMarketplaceConfig: Boolean(parsed.ARMZ_MARKETPLACE_FEE_TREASURY_PUBLIC_KEY),
    productionAdminWritesApproved: isTruthyStrict(parsed.ARMZ_PRODUCTION_ADMIN_WRITES_APPROVED),
  });

  if (features.mainnetEnabled && parsed.ARMZ_ENVIRONMENT !== 'production') {
    throw new Error('Mainnet may only be considered when ARMZ_ENVIRONMENT is production.');
  }

  const network = (parsed.NEXT_PUBLIC_ARMZ_NETWORK ?? DEFAULT_SOLANA_NETWORK) as SolanaNetwork;

  return {
    ...parsed,
    features,
    network,
  };
}
