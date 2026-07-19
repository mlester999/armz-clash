import {
  BASIS_POINTS_MAX,
  BASIS_POINTS_MIN,
  type BasisPoints,
  type TokenAtomicAmount,
} from './types';

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseBasisPoints(value: number): ValidationResult<BasisPoints> {
  if (!Number.isInteger(value)) {
    return { ok: false, error: 'Basis points must be an integer' };
  }
  if (value < BASIS_POINTS_MIN || value > BASIS_POINTS_MAX) {
    return {
      ok: false,
      error: `Basis points must be between ${BASIS_POINTS_MIN} and ${BASIS_POINTS_MAX}`,
    };
  }
  return { ok: true, value: value as BasisPoints };
}

export function parseTokenAtomicAmount(
  value: bigint | number | string,
): ValidationResult<TokenAtomicAmount> {
  let amount: bigint;
  try {
    amount = typeof value === 'bigint' ? value : BigInt(value);
  } catch {
    return { ok: false, error: 'Token amount must be an integer atomic value' };
  }
  if (amount < 0n) {
    return { ok: false, error: 'Token amount must be non-negative' };
  }
  return { ok: true, value: amount as TokenAtomicAmount };
}

export function validateEconomyConfigVersion(version: string): ValidationResult<string> {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(version)) {
    return {
      ok: false,
      error: 'Economy configuration version must be 1–64 URL-safe characters',
    };
  }
  return { ok: true, value: version };
}

export type FeatureStateConsistencyInput = {
  marketplaceEnabled: boolean;
  marketplaceSettlementEnabled: boolean;
  realRewardsEnabled: boolean;
  claimsEnabled: boolean;
};

export function validateFeatureStateConsistency(
  input: FeatureStateConsistencyInput,
): ValidationResult<FeatureStateConsistencyInput> {
  if (input.marketplaceSettlementEnabled && !input.marketplaceEnabled) {
    return {
      ok: false,
      error: 'Marketplace settlement requires marketplace to be enabled',
    };
  }
  if (input.claimsEnabled && !input.realRewardsEnabled) {
    // Claims may require rewards pipeline; keep consistent safety.
    return {
      ok: false,
      error: 'Claims require real rewards to be enabled (or remain disabled in foundation)',
    };
  }
  return { ok: true, value: input };
}
