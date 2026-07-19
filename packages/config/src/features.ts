import { z } from 'zod';

/**
 * Explicit boolean parser.
 * Only these values are accepted. Missing flags default to safe disabled (or demo true).
 * Ambiguous values such as "yes", "1", or any non-empty string are rejected.
 */
const TRUE_VALUES = new Set(['true', 'TRUE', 'True']);
const FALSE_VALUES = new Set(['false', 'FALSE', 'False']);

export function parseStrictBoolean(
  value: string | undefined,
  fieldName: string,
): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  if (TRUE_VALUES.has(value)) {
    return true;
  }
  if (FALSE_VALUES.has(value)) {
    return false;
  }
  throw new Error(`Invalid boolean for ${fieldName}: "${value}". Use exactly "true" or "false".`);
}

export const FeatureFlagsSchema = z.object({
  demoModeEnabled: z.boolean(),
  realMintEnabled: z.boolean(),
  realRewardsEnabled: z.boolean(),
  claimsEnabled: z.boolean(),
  marketplaceEnabled: z.boolean(),
  marketplaceSettlementEnabled: z.boolean(),
  oracleEnabled: z.boolean(),
  mainnetEnabled: z.boolean(),
  adminEconomyWritesEnabled: z.boolean(),
});

export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

/** Safe Phase 1 defaults — real-value systems stay off. */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  demoModeEnabled: true,
  realMintEnabled: false,
  realRewardsEnabled: false,
  claimsEnabled: false,
  marketplaceEnabled: false,
  marketplaceSettlementEnabled: false,
  oracleEnabled: false,
  mainnetEnabled: false,
  adminEconomyWritesEnabled: false,
};

export function parseFeatureFlagsFromEnv(
  env: Record<string, string | undefined> = process.env,
): FeatureFlags {
  const read = (key: string, fallback: boolean): boolean => {
    const parsed = parseStrictBoolean(env[key], key);
    return parsed === undefined ? fallback : parsed;
  };

  return FeatureFlagsSchema.parse({
    demoModeEnabled: read('ARMZ_DEMO_MODE_ENABLED', DEFAULT_FEATURE_FLAGS.demoModeEnabled),
    realMintEnabled: read('ARMZ_REAL_MINT_ENABLED', DEFAULT_FEATURE_FLAGS.realMintEnabled),
    realRewardsEnabled: read('ARMZ_REAL_REWARDS_ENABLED', DEFAULT_FEATURE_FLAGS.realRewardsEnabled),
    claimsEnabled: read('ARMZ_CLAIMS_ENABLED', DEFAULT_FEATURE_FLAGS.claimsEnabled),
    marketplaceEnabled: read('ARMZ_MARKETPLACE_ENABLED', DEFAULT_FEATURE_FLAGS.marketplaceEnabled),
    marketplaceSettlementEnabled: read(
      'ARMZ_MARKETPLACE_SETTLEMENT_ENABLED',
      DEFAULT_FEATURE_FLAGS.marketplaceSettlementEnabled,
    ),
    oracleEnabled: read('ARMZ_ORACLE_ENABLED', DEFAULT_FEATURE_FLAGS.oracleEnabled),
    mainnetEnabled: read('ARMZ_MAINNET_ENABLED', DEFAULT_FEATURE_FLAGS.mainnetEnabled),
    adminEconomyWritesEnabled: read(
      'ARMZ_ADMIN_ECONOMY_WRITES_ENABLED',
      DEFAULT_FEATURE_FLAGS.adminEconomyWritesEnabled,
    ),
  });
}

export type FeatureSafetyContext = {
  environment: string;
  hasRewardTreasuryConfig: boolean;
  hasMarketplaceConfig: boolean;
  productionAdminWritesApproved: boolean;
};

export class FeatureFlagSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureFlagSafetyError';
  }
}

/**
 * Fail startup on unsafe feature combinations.
 * Missing real-value credentials while those flags are false is OK.
 */
export function assertFeatureFlagSafety(flags: FeatureFlags, context: FeatureSafetyContext): void {
  if (flags.mainnetEnabled && context.environment === 'development') {
    throw new FeatureFlagSafetyError(
      'Mainnet cannot be enabled while ARMZ_ENVIRONMENT is development.',
    );
  }

  if (flags.realRewardsEnabled && !context.hasRewardTreasuryConfig) {
    throw new FeatureFlagSafetyError(
      'Real rewards cannot be enabled without reward treasury configuration.',
    );
  }

  if (flags.claimsEnabled && !context.hasRewardTreasuryConfig) {
    throw new FeatureFlagSafetyError(
      'Claims cannot be enabled without reward treasury configuration.',
    );
  }

  if (flags.marketplaceSettlementEnabled && !flags.marketplaceEnabled) {
    throw new FeatureFlagSafetyError(
      'Marketplace settlement cannot be enabled while marketplace is disabled.',
    );
  }

  if (flags.marketplaceSettlementEnabled && !context.hasMarketplaceConfig) {
    throw new FeatureFlagSafetyError(
      'Marketplace settlement cannot be enabled without marketplace fee treasury configuration.',
    );
  }

  if (flags.realMintEnabled && flags.oracleEnabled === false) {
    // Oracle may be optional for fixed-price mint later; for Phase 1 we only guard when mint is on without oracle if oracle is expected.
    // Allow real mint flag off by default; if both mint on and oracle off, allow but do not require oracle yet.
  }

  if (
    flags.adminEconomyWritesEnabled &&
    context.environment === 'production' &&
    !context.productionAdminWritesApproved
  ) {
    throw new FeatureFlagSafetyError(
      'Admin economy writes require an explicit production approval gate.',
    );
  }
}

export function areRealValueSystemsDisabled(flags: FeatureFlags): boolean {
  return (
    !flags.realMintEnabled &&
    !flags.realRewardsEnabled &&
    !flags.claimsEnabled &&
    !flags.marketplaceSettlementEnabled &&
    !flags.mainnetEnabled
  );
}
