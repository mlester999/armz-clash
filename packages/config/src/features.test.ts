import { describe, expect, it } from 'vitest';
import {
  assertFeatureFlagSafety,
  DEFAULT_FEATURE_FLAGS,
  FeatureFlagSafetyError,
  parseFeatureFlagsFromEnv,
  parseStrictBoolean,
} from './features';
import { buildPublicConfig } from './public-config';
import { formatTokenSymbol, PRODUCT_NAME, TOKEN_SYMBOL } from './product';

describe('product identity', () => {
  it('uses Armz Clash product name', () => {
    expect(PRODUCT_NAME).toBe('Armz Clash');
  });

  it('centralizes token ticker as ARMZ', () => {
    expect(TOKEN_SYMBOL).toBe('ARMZ');
    expect(formatTokenSymbol()).toBe('$ARMZ');
    expect(formatTokenSymbol('ARMZ')).toBe('$ARMZ');
  });
});

describe('parseStrictBoolean', () => {
  it('accepts only explicit true/false', () => {
    expect(parseStrictBoolean('true', 'x')).toBe(true);
    expect(parseStrictBoolean('false', 'x')).toBe(false);
    expect(parseStrictBoolean(undefined, 'x')).toBeUndefined();
  });

  it('rejects ambiguous values including non-empty strings', () => {
    expect(() => parseStrictBoolean('yes', 'x')).toThrow(/Invalid boolean/);
    expect(() => parseStrictBoolean('1', 'x')).toThrow(/Invalid boolean/);
    expect(() => parseStrictBoolean('0', 'x')).toThrow(/Invalid boolean/);
    expect(() => parseStrictBoolean('TRUE ', 'x')).toThrow(/Invalid boolean/);
  });
});

describe('feature flags', () => {
  it('defaults missing real-value flags to disabled', () => {
    const flags = parseFeatureFlagsFromEnv({});
    expect(flags).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(flags.mainnetEnabled).toBe(false);
    expect(flags.realMintEnabled).toBe(false);
    expect(flags.realRewardsEnabled).toBe(false);
    expect(flags.claimsEnabled).toBe(false);
    expect(flags.marketplaceSettlementEnabled).toBe(false);
    expect(flags.demoModeEnabled).toBe(true);
  });

  it('does not treat string "false" as true', () => {
    const flags = parseFeatureFlagsFromEnv({
      ARMZ_MAINNET_ENABLED: 'false',
      ARMZ_REAL_MINT_ENABLED: 'false',
      ARMZ_REAL_REWARDS_ENABLED: 'false',
    });
    expect(flags.mainnetEnabled).toBe(false);
    expect(flags.realMintEnabled).toBe(false);
    expect(flags.realRewardsEnabled).toBe(false);
  });

  it('parses explicit true values', () => {
    const flags = parseFeatureFlagsFromEnv({
      ARMZ_DEMO_MODE_ENABLED: 'true',
      ARMZ_MARKETPLACE_ENABLED: 'true',
    });
    expect(flags.demoModeEnabled).toBe(true);
    expect(flags.marketplaceEnabled).toBe(true);
  });

  it('rejects unsafe mainnet in development', () => {
    expect(() =>
      assertFeatureFlagSafety(
        { ...DEFAULT_FEATURE_FLAGS, mainnetEnabled: true },
        {
          environment: 'development',
          hasRewardTreasuryConfig: true,
          hasMarketplaceConfig: true,
          productionAdminWritesApproved: false,
        },
      ),
    ).toThrow(FeatureFlagSafetyError);
  });

  it('rejects claims without treasury config', () => {
    expect(() =>
      assertFeatureFlagSafety(
        { ...DEFAULT_FEATURE_FLAGS, claimsEnabled: true },
        {
          environment: 'development',
          hasRewardTreasuryConfig: false,
          hasMarketplaceConfig: false,
          productionAdminWritesApproved: false,
        },
      ),
    ).toThrow(/treasury/);
  });

  it('rejects settlement when marketplace disabled', () => {
    expect(() =>
      assertFeatureFlagSafety(
        {
          ...DEFAULT_FEATURE_FLAGS,
          marketplaceEnabled: false,
          marketplaceSettlementEnabled: true,
        },
        {
          environment: 'development',
          hasRewardTreasuryConfig: true,
          hasMarketplaceConfig: true,
          productionAdminWritesApproved: false,
        },
      ),
    ).toThrow(/settlement/);
  });
});

describe('public config', () => {
  it('serializes safe public config without secrets', () => {
    const config = buildPublicConfig();
    expect(config.productName).toBe('Armz Clash');
    expect(config.tokenDisplay).toBe('$ARMZ');
    expect(config.features.mainnetEnabled).toBe(false);
    expect(config.realValueSystemsDisabled).toBe(true);
    expect(JSON.stringify(config)).not.toMatch(/SERVICE_ROLE|private|secret/i);
  });
});
