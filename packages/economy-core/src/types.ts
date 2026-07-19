/** Treasury health for reward budget controls. */
export type TreasuryState = 'healthy' | 'caution' | 'restricted' | 'paused';

export type RewardFeatureState = 'disabled' | 'demo_only' | 'enabled_limited' | 'paused';

export type LiabilityStatus = 'none' | 'within_budget' | 'near_limit' | 'over_limit' | 'unknown';

export type RewardLotStatus = 'pending' | 'claimable' | 'claimed' | 'expired' | 'cancelled';

export type ClaimStatus =
  'disabled' | 'eligible' | 'cooldown' | 'processing' | 'completed' | 'failed';

export type MarketplaceStatus =
  'disabled' | 'browse_only' | 'listing_enabled' | 'settlement_enabled' | 'paused';

/** Integer basis points: 0–10_000 (100% = 10_000). */
export type BasisPoints = number & { readonly __brand: 'BasisPoints' };

/** Non-negative integer token amount in atomic units (no floating point). */
export type TokenAtomicAmount = bigint & { readonly __brand: 'TokenAtomicAmount' };

export type EconomyConfigurationVersion = string;

export const TREASURY_STATES: readonly TreasuryState[] = [
  'healthy',
  'caution',
  'restricted',
  'paused',
] as const;

export const BASIS_POINTS_MIN = 0;
export const BASIS_POINTS_MAX = 10_000;
