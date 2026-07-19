import { describe, expect, it } from 'vitest';
import {
  assertOfficialRarityWeightsValid,
  OFFICIAL_RARITY_WEIGHT_TOTAL,
  OFFICIAL_RARITY_WEIGHTS,
  sumRarityWeights,
  validateRarityWeights,
} from './rarity';
import { ARMZ_RARITIES } from './types';

describe('official rarity weights', () => {
  it('includes all six rarity keys', () => {
    expect(ARMZ_RARITIES).toEqual(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']);
    for (const rarity of ARMZ_RARITIES) {
      expect(OFFICIAL_RARITY_WEIGHTS[rarity]).toBeTypeOf('number');
    }
  });

  it('uses integer weights totaling exactly 100000', () => {
    expect(sumRarityWeights(OFFICIAL_RARITY_WEIGHTS)).toBe(100_000);
    expect(OFFICIAL_RARITY_WEIGHT_TOTAL).toBe(100_000);
    for (const rarity of ARMZ_RARITIES) {
      expect(Number.isInteger(OFFICIAL_RARITY_WEIGHTS[rarity])).toBe(true);
    }
  });

  it('matches official per-rarity defaults', () => {
    expect(OFFICIAL_RARITY_WEIGHTS.common).toBe(59_900);
    expect(OFFICIAL_RARITY_WEIGHTS.uncommon).toBe(28_000);
    expect(OFFICIAL_RARITY_WEIGHTS.rare).toBe(7_000);
    expect(OFFICIAL_RARITY_WEIGHTS.epic).toBe(4_000);
    expect(OFFICIAL_RARITY_WEIGHTS.legendary).toBe(1_000);
    expect(OFFICIAL_RARITY_WEIGHTS.mythic).toBe(100);
  });

  it('validates clean official table', () => {
    expect(validateRarityWeights()).toEqual([]);
    expect(() => assertOfficialRarityWeightsValid()).not.toThrow();
  });

  it('rejects invalid totals and negatives', () => {
    const bad = { ...OFFICIAL_RARITY_WEIGHTS, common: 59_899 };
    expect(validateRarityWeights(bad).some((i) => i.code === 'invalid_total')).toBe(true);

    const negative = { ...OFFICIAL_RARITY_WEIGHTS, rare: -1, common: 59_900 + 7_001 };
    expect(validateRarityWeights(negative).some((i) => i.code === 'negative_weight')).toBe(true);
  });
});
