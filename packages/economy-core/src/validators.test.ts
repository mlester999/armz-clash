import { describe, expect, it } from 'vitest';
import {
  parseBasisPoints,
  parseTokenAtomicAmount,
  validateEconomyConfigVersion,
  validateFeatureStateConsistency,
} from './validators';

describe('basis points', () => {
  it('accepts 0 through 10000 integers', () => {
    expect(parseBasisPoints(0).ok).toBe(true);
    expect(parseBasisPoints(2500).ok).toBe(true);
    expect(parseBasisPoints(10_000).ok).toBe(true);
  });

  it('rejects out of range and non-integers', () => {
    expect(parseBasisPoints(-1).ok).toBe(false);
    expect(parseBasisPoints(10_001).ok).toBe(false);
    expect(parseBasisPoints(1.5).ok).toBe(false);
  });
});

describe('token atomic amounts', () => {
  it('accepts non-negative integers as bigint', () => {
    const result = parseTokenAtomicAmount(0);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(0n);
    expect(parseTokenAtomicAmount('1000000').ok).toBe(true);
  });

  it('rejects negatives', () => {
    expect(parseTokenAtomicAmount(-1).ok).toBe(false);
  });
});

describe('economy config version', () => {
  it('accepts safe identifiers', () => {
    expect(validateEconomyConfigVersion('economy-v1').ok).toBe(true);
  });

  it('rejects empty or unsafe identifiers', () => {
    expect(validateEconomyConfigVersion('').ok).toBe(false);
    expect(validateEconomyConfigVersion(' has space').ok).toBe(false);
  });
});

describe('feature state consistency', () => {
  it('rejects settlement without marketplace', () => {
    const result = validateFeatureStateConsistency({
      marketplaceEnabled: false,
      marketplaceSettlementEnabled: true,
      realRewardsEnabled: false,
      claimsEnabled: false,
    });
    expect(result.ok).toBe(false);
  });
});
