import { ARMZ_RARITIES, type ArmzRarity } from './types';

/**
 * Official Phase 1 rarity weight table (static configuration only).
 * Weights are integers. Total must equal exactly 100_000.
 * Do not implement rolling/mint selection in Phase 1.
 */
export const OFFICIAL_RARITY_WEIGHTS: Readonly<Record<ArmzRarity, number>> = {
  common: 59_900,
  uncommon: 28_000,
  rare: 7_000,
  epic: 4_000,
  legendary: 1_000,
  mythic: 100,
} as const;

export const OFFICIAL_RARITY_WEIGHT_TOTAL = 100_000 as const;

export type RarityWeightValidationIssue = {
  code: string;
  message: string;
};

export function sumRarityWeights(weights: Readonly<Record<ArmzRarity, number>>): number {
  return ARMZ_RARITIES.reduce((sum, rarity) => sum + weights[rarity], 0);
}

export function validateRarityWeights(
  weights: Readonly<Record<ArmzRarity, number>> = OFFICIAL_RARITY_WEIGHTS,
): RarityWeightValidationIssue[] {
  const issues: RarityWeightValidationIssue[] = [];
  const keys = Object.keys(weights) as ArmzRarity[];

  for (const rarity of ARMZ_RARITIES) {
    if (!(rarity in weights)) {
      issues.push({ code: 'missing_rarity', message: `Missing rarity key: ${rarity}` });
    }
  }

  const unique = new Set(keys);
  if (unique.size !== keys.length) {
    issues.push({ code: 'duplicate_rarity', message: 'Duplicate rarity keys detected' });
  }

  for (const rarity of ARMZ_RARITIES) {
    const value = weights[rarity];
    if (value === undefined) continue;
    if (!Number.isInteger(value)) {
      issues.push({
        code: 'non_integer_weight',
        message: `Weight for ${rarity} must be an integer`,
      });
    }
    if (value < 0) {
      issues.push({
        code: 'negative_weight',
        message: `Weight for ${rarity} must not be negative`,
      });
    }
  }

  const total = sumRarityWeights(weights);
  if (total !== OFFICIAL_RARITY_WEIGHT_TOTAL) {
    issues.push({
      code: 'invalid_total',
      message: `Rarity weight total must be ${OFFICIAL_RARITY_WEIGHT_TOTAL}, received ${total}`,
    });
  }

  if (weights.mythic !== 100) {
    issues.push({
      code: 'mythic_default',
      message: 'Official Mythic default weight must be exactly 100',
    });
  }

  if (weights.common !== 59_900) {
    issues.push({
      code: 'common_default',
      message: 'Official Common default weight must be exactly 59,900',
    });
  }

  return issues;
}

export function assertOfficialRarityWeightsValid(): void {
  const issues = validateRarityWeights(OFFICIAL_RARITY_WEIGHTS);
  if (issues.length > 0) {
    throw new Error(`Official rarity weights invalid: ${issues.map((i) => i.message).join('; ')}`);
  }
}
